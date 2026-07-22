import Anthropic from "@anthropic-ai/sdk";
import { listConcepts, getConcept, ConceptFile } from "./bundle";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
const MODEL = "claude-sonnet-5";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface AskResult {
  answer: string;
  loadedFiles: { relPath: string; title: string; timestamp: string }[];
  // Real, billed token usage per API call — this is the actual answer to
  // "how much does the digested read-path cost", not an estimate. Compare
  // against lib/benchmark.ts's file-size-based projection for the raw
  // (undigested-archive) path, which needs no API call to compute.
  trace: {
    selection: TokenUsage;
    synthesis: TokenUsage;
    conceptsScanned: number;
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

  const synthesis = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system:
      "You are brane's read-path synthesizer. Answer the user's question using ONLY the provided bundle excerpts. " +
      "Preserve every `^[archive/...]` citation tag exactly as it appears in the source text when you use a fact from it — " +
      "do not invent new citations and do not drop existing ones. If the excerpts don't answer the question, say so plainly. " +
      "Answer in Korean, matching the language of the bundle content.",
    messages: [
      {
        role: "user",
        content: `BUNDLE EXCERPTS:\n\n${context}\n\nQUESTION: ${query}`,
      },
    ],
  });

  const answer = synthesis.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    answer,
    loadedFiles: loaded.map((c) => ({
      relPath: c.relPath,
      title: c.title,
      timestamp: c.timestamp,
    })),
    trace: {
      selection: usageOf(selection),
      synthesis: usageOf(synthesis),
      conceptsScanned: concepts.length,
    },
  };
}
