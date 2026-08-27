import Anthropic from "@anthropic-ai/sdk";
import { listConcepts, getConcept, getArchiveSource, ConceptFile } from "./bundle";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
const MODEL = "claude-sonnet-5";

// Bounds how many archive files a single query can pull in. Mirrors engine/load.md's
// "관련 없으면 열지 않는다" principle — this is a ceiling for when links genuinely need
// following, not an invitation to open everything cited.
const MAX_ARCHIVE_HOPS = 3;

const READ_ARCHIVE_TOOL: Anthropic.Tool = {
  name: "read_archive_source",
  description:
    "Open the full raw text of a bundle citation (a `^[archive/...]` tag) when the loaded bundle " +
    "excerpts don't fully answer the question on their own — e.g. the excerpt only summarizes a " +
    "decision but the question needs the reasoning, alternatives considered, or exact wording behind " +
    "it. Most citations do NOT need to be opened; the bundle excerpt is usually enough. Only call this " +
    "when you can point to a specific gap the citation would fill.",
  input_schema: {
    type: "object",
    properties: {
      archiveRelPath: {
        type: "string",
        description: "Path exactly as it appears inside a `^[...]` tag, e.g. archive/2026-07-02-brane-fable-5.md",
      },
    },
    required: ["archiveRelPath"],
  },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface AskResult {
  answer: string;
  loadedFiles: { relPath: string; title: string; timestamp: string }[];
  // Archive sources opened via link-following, in the order they were opened.
  // Empty in the common case — most queries are answerable from bundle excerpts alone.
  archiveLoaded: string[];
  // Real, billed token usage per API call — this is the actual answer to
  // "how much does the digested read-path cost", not an estimate. Compare
  // against lib/benchmark.ts's file-size-based projection for the raw
  // (undigested-archive) path, which needs no API call to compute.
  trace: {
    selection: TokenUsage;
    synthesis: TokenUsage; // summed across all hops, including archive follow-ups
    conceptsScanned: number;
    archiveHops: number;
  };
}

function usageOf(resp: Anthropic.Message): TokenUsage {
  return {
    inputTokens: resp.usage.input_tokens,
    outputTokens: resp.usage.output_tokens,
    cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: resp.usage.cache_creation_input_tokens ?? 0,
  };
}

function sumUsage(usages: TokenUsage[]): TokenUsage {
  return usages.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + u.inputTokens,
      outputTokens: acc.outputTokens + u.outputTokens,
      cacheReadTokens: acc.cacheReadTokens + u.cacheReadTokens,
      cacheCreationTokens: acc.cacheCreationTokens + u.cacheCreationTokens,
    }),
    { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
  );
}

// Mirrors ~/brane/engine/load.md: scan frontmatter only, pick <=5 relevant
// files, then synthesize a grounded answer. Never stuff the whole bundle
// into one prompt.
export async function ask(query: string): Promise<AskResult> {
  const concepts = listConcepts();

  const index = concepts
    .map(
      (c) =>
        `${c.relPath} | ${c.title} | ${c.description} | tags: ${c.tags.join(",")} | ${c.timestamp}`,
    )
    .join("\n");

  const selection = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are brane's read-path selector. Given a directory index (relPath | title | description | tags | timestamp) " +
      "and a user query, pick at most 5 relPaths most relevant to answering the query. " +
      "Return ONLY a JSON array of relPath strings, most relevant first. No prose.",
    messages: [
      {
        role: "user",
        content: `INDEX:\n${index}\n\nQUERY: ${query}\n\nReturn the JSON array of relPaths now.`,
      },
    ],
  });

  const rawSelection = selection.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let picked: string[] = [];
  try {
    const match = rawSelection.match(/\[[\s\S]*\]/);
    picked = match ? JSON.parse(match[0]) : [];
  } catch {
    picked = [];
  }
  picked = picked.slice(0, 5);

  const loaded = picked
    .map((relPath) => getConcept(relPath))
    .filter((c): c is ConceptFile => c !== null);

  const context = loaded
    .map((c) => `--- ${c.relPath} (title: ${c.title}, timestamp: ${c.timestamp}) ---\n${c.content}`)
    .join("\n\n");

  const synthesisSystem =
    "You are brane's read-path synthesizer. Answer the user's question using the provided bundle excerpts. " +
    "Preserve every `^[archive/...]` citation tag exactly as it appears in the source text when you use a fact from it — " +
    "do not invent new citations and do not drop existing ones. " +
    "Bundle excerpts are summaries, not the full record — for consequential judgments (does the roadmap allow X, " +
    "is Y actually prohibited, what exactly was decided), a one-line citation may be hiding the reasoning, alternatives, " +
    "or exact wording you need. Use read_archive_source to open a cited archive file when you can point to a specific " +
    "gap it would fill. Don't open citations that are just supporting color. If the excerpts don't answer the question " +
    "even after following the citations that mattered, say so plainly. Answer in Korean, matching the bundle's language.";

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `BUNDLE EXCERPTS:\n\n${context}\n\nQUESTION: ${query}`,
    },
  ];

  const synthesisUsages: TokenUsage[] = [];
  const archiveLoaded: string[] = [];
  let answer = "";

  for (let hop = 0; ; hop++) {
    const atHopLimit = hop >= MAX_ARCHIVE_HOPS;
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: synthesisSystem,
      tools: atHopLimit ? undefined : [READ_ARCHIVE_TOOL],
      messages,
    });
    synthesisUsages.push(usageOf(resp));

    const toolUses = resp.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUses.length === 0) {
      answer = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      break;
    }

    messages.push({ role: "assistant", content: resp.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
      const relPath = (tu.input as { archiveRelPath?: string }).archiveRelPath ?? "";
      const source = getArchiveSource(relPath);
      archiveLoaded.push(relPath);
      return {
        type: "tool_result",
        tool_use_id: tu.id,
        content:
          source ??
          `(이 인용의 원본은 열 수 없습니다: ${relPath} — 공개 범위에 포함되지 않았거나 존재하지 않는 파일입니다. ` +
            `추측하지 말고, 인용된 bundle 발췌만으로 답하세요.)`,
      };
    });
    messages.push({ role: "user", content: toolResults });
  }

  return {
    answer,
    loadedFiles: loaded.map((c) => ({
      relPath: c.relPath,
      title: c.title,
      timestamp: c.timestamp,
    })),
    archiveLoaded,
    trace: {
      selection: usageOf(selection),
      synthesis: sumUsage(synthesisUsages),
      conceptsScanned: concepts.length,
      archiveHops: archiveLoaded.length,
    },
  };
}
