// brane's write path, with no filesystem and no vendor in it.
//
// This is the engine that ~/brane/engine/ingest.md specifies, extracted from
// the fs-bound version in ingest.ts so it can run three ways from one
// implementation: against the author's own bundle on disk, against a
// visitor's uploaded conversations held only in memory, and against
// synthetic personas in the simulation harness. Drift here is drift in all
// three, which is the point.
//
// Two things changed in the extraction, both deliberate:
//
// 1. Compilation is one call per source, not one per concept. The old loop
//    resent the entire source document with every concept's write call — a
//    12KB conversation yielding five concepts shipped ~60KB of duplicated
//    input. On a metered vendor that is the single largest line item in an
//    ingest run, and on a free tier it is what burns the daily quota. The
//    per-concept path survives as a fallback for when a model can't hold the
//    multi-file output format.
//
// 2. Progress is streamed. A visitor watching a 1→100 job wants to see 1,
//    then 2, not a spinner and then everything at once.

import matter from "gray-matter";
import { Provider, CompletionResult } from "./llm";

export interface SourceDoc {
  /** Filename as it will appear in archive/ and in `^[archive/...]` citations. */
  name: string;
  text: string;
}

export interface ConceptRecord {
  relPath: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  timestamp: string;
  content: string; // body, frontmatter stripped
  raw: string; // full file text, frontmatter included
}

export type Judgment = "NEW" | "UPDATE" | "REFINE" | "QUESTION";

export interface PlannedConcept {
  title: string;
  judgment: Judgment;
  targetRelPath: string;
  category: string;
  reasoning: string;
}

export interface TraceEntry {
  source: string;
  title: string;
  plannerJudgment: Judgment;
  effectiveJudgment: string;
  overridden: boolean;
  targetRelPath: string;
  reasoning: string;
}

export interface IngestQuestion {
  concept: string;
  report: string;
}

export type IngestEvent =
  | { type: "source_start"; source: string; index: number; total: number }
  | { type: "planned"; source: string; concepts: { title: string; judgment: Judgment }[] }
  | { type: "concept"; source: string; relPath: string; title: string; judgment: string }
  | { type: "question"; source: string; concept: string; report: string }
  | { type: "source_done"; source: string; index: number; total: number }
  | { type: "note"; message: string };

export interface IngestCoreResult {
  /** Final state of every concept touched, keyed by relPath. */
  files: Map<string, string>;
  trace: TraceEntry[];
  questions: IngestQuestion[];
  usage: { inputTokens: number; outputTokens: number; calls: number };
}

export interface IngestCoreOptions {
  sources: SourceDoc[];
  /** Existing bundle to merge into. Empty for a first-time visitor. */
  existingConcepts: ConceptRecord[];
  provider: Provider;
  onEvent?: (e: IngestEvent) => void;
  /** Ceiling on concepts compiled per source. Bounds cost and latency. */
  maxConceptsPerSource?: number;
}

const PLAN_SYSTEM_PROMPT = `You are brane's write-path planner. Given a bundle index (relPath | title | description | tags | timestamp) and a raw source document (a conversation export or note), extract durable concepts and plan what to do with each.

Rules:
- Extract decisions, facts, strategy, and state changes as concept units. Ignore greetings, small talk, and repeated confirmations with no conceptual content.
- Each concept must pass the "still valid to me in 6 months?" test. Drop one-off content that fails this.
- For each concept, search the bundle index for an existing file covering the same topic.
- Judge each concept as exactly one of:
  - NEW: no existing file covers this — propose a new bundle relPath (lowercase-hyphenated, in an appropriate category directory: identity/ ventures/ roadmap/ playbooks/ notes/ architecture/).
  - UPDATE: an existing file covers this and there's no contradiction — merge into it.
  - REFINE: existing content differs but it's a state/plan progressing further (e.g. "on hold" -> "active"), not a values/strategy conflict — merge silently, do not misjudge this as QUESTION.
  - QUESTION: existing file and new material genuinely conflict on values or strategic philosophy (a real reversal, not a state update) — do not merge; flag it.

Return ONLY a JSON array, no prose, in this exact shape:
[{"title": "concept title", "judgment": "NEW"|"UPDATE"|"REFINE"|"QUESTION", "targetRelPath": "category/slug.md", "category": "identity"|"ventures"|"roadmap"|"playbooks"|"notes"|"architecture", "reasoning": "one sentence"}]

If nothing in the source passes the 6-month test, return an empty array [].`;

const FILE_OPEN = "<<<BRANE_FILE:";
const FILE_CLOSE = "<<<BRANE_END>>>";

const WRITE_RULES = `You are brane's write-path compiler. You are not an archivist — you are a compiler. Never paste raw source text verbatim; distill to conclusions only.

Rules for every file you write:
- Every file needs YAML frontmatter: type, title, description, tags (array), timestamp (today's date), and status if applicable.
- One file = one concept.
- Every fact you write must carry an inline citation tag \`^[archive/<sourceFilename>]\` immediately after the sentence it came from. Never write an unattributable sentence.
- Related bundle documents get linked with relative markdown links in the body, e.g. [green-apple](../ventures/green-apple.md).
- If judgment is UPDATE or REFINE: you are given the EXISTING FULL FILE. Merge the new material into it — preserve everything still valid, update what changed, bump the timestamp. Keep the parts that still hold and edit only what's affected.
- If judgment is NEW: write a complete new file from scratch.
- Do not state uncertain inference as fact — mark it "(추정)" if it's inferred rather than stated directly.
- Write in the language the source document uses.`;

const WRITE_MULTI_SYSTEM_PROMPT = `${WRITE_RULES}

You will be asked to produce SEVERAL files in one response. Emit each one delimited exactly like this, with no prose between or around them:

${FILE_OPEN} category/slug.md >>>
<full file content: frontmatter + body>
${FILE_CLOSE}

Emit one such block per requested concept, in the order given. Nothing outside the blocks.`;

const WRITE_SINGLE_SYSTEM_PROMPT = `${WRITE_RULES}

Return ONLY the full file content (frontmatter + body), no explanation, no code fences.`;

function indexOf(concepts: ConceptRecord[]): string {
  if (concepts.length === 0) return "(empty — this brane has no concepts yet)";
  return concepts
    .map(
      (c) =>
        `${c.relPath} | ${c.title} | ${c.description} | tags: ${c.tags.join(",")} | ${c.timestamp}`,
    )
    .join("\n");
}

function parsePlan(text: string): PlannedConcept[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is PlannedConcept =>
        p && typeof p.title === "string" && typeof p.targetRelPath === "string",
    );
  } catch {
    return [];
  }
}

/** Pull `<<<BRANE_FILE: path >>> ... <<<BRANE_END>>>` blocks out of a multi-file response. */
function parseMultiFile(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = new RegExp(
    `${FILE_OPEN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(.+?)\\s*>>>([\\s\\S]*?)${FILE_CLOSE.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    )}`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const relPath = m[1].trim();
    const body = m[2].trim();
    if (relPath && body) out.set(relPath, body);
  }
  return out;
}

export function parseConcept(relPath: string, raw: string): ConceptRecord {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const category = relPath.split("/")[0] ?? "notes";
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  return {
    relPath,
    category,
    title: String(data.title ?? relPath),
    description: String(data.description ?? ""),
    tags,
    timestamp: String(data.timestamp ?? new Date().toISOString().slice(0, 10)),
    content: parsed.content.trim(),
    raw,
  };
}

export async function ingestCore(opts: IngestCoreOptions): Promise<IngestCoreResult> {
  const { sources, provider, onEvent } = opts;
  const maxConcepts = opts.maxConceptsPerSource ?? 8;

  // Working set: starts as the existing bundle and accumulates as we go, so
  // a second source in the same run sees what the first one wrote. Without
  // this, uploading three related conversations produces three near-duplicate
  // files instead of one file refined three times — which is the whole
  // difference between a digest and a dump.
  const working = new Map<string, ConceptRecord>();
  for (const c of opts.existingConcepts) working.set(c.relPath, c);

  const touched = new Map<string, string>();
  const trace: TraceEntry[] = [];
  const questions: IngestQuestion[] = [];
  const usage = { inputTokens: 0, outputTokens: 0, calls: 0 };

  const account = (r: CompletionResult) => {
    usage.inputTokens += r.usage.inputTokens;
    usage.outputTokens += r.usage.outputTokens;
    usage.calls += 1;
  };

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    onEvent?.({ type: "source_start", source: source.name, index: i, total: sources.length });

    const planResp = await provider.complete({
      system: PLAN_SYSTEM_PROMPT,
      maxTokens: 4096,
      user: `BUNDLE INDEX:\n${indexOf([...working.values()])}\n\nSOURCE (${source.name}):\n${source.text}\n\nReturn the JSON plan now.`,
    });
    account(planResp);

    const plan = parsePlan(planResp.text);
    onEvent?.({
      type: "planned",
      source: source.name,
      concepts: plan.map((p) => ({ title: p.title, judgment: p.judgment })),
    });

    // QUESTION never writes — the engine refuses to auto-resolve a real
    // contradiction and hands it back to the human instead.
    const toWrite: PlannedConcept[] = [];
    for (const p of plan) {
      if (p.judgment === "QUESTION") {
        questions.push({ concept: p.title, report: p.reasoning });
        trace.push({
          source: source.name,
          title: p.title,
          plannerJudgment: p.judgment,
          effectiveJudgment: "QUESTION",
          overridden: false,
          targetRelPath: p.targetRelPath,
          reasoning: p.reasoning,
        });
        onEvent?.({ type: "question", source: source.name, concept: p.title, report: p.reasoning });
        continue;
      }
      toWrite.push(p);
    }

    if (toWrite.length > maxConcepts) {
      onEvent?.({
        type: "note",
        message: `${source.name}: ${toWrite.length}개 개념 중 상위 ${maxConcepts}개만 처리합니다.`,
      });
      toWrite.length = maxConcepts;
    }
    if (toWrite.length === 0) {
      onEvent?.({ type: "source_done", source: source.name, index: i, total: sources.length });
      continue;
    }

    // Resolve each plan entry against reality before writing. The planner is
    // an LLM judgment and it has been observed calling an existing, richly
    // populated concept "NEW" — writing that verdict verbatim destroys the
    // file. Existence on disk beats the label, always.
    const resolved = toWrite.map((p) => {
      const existing = working.get(p.targetRelPath) ?? null;
      const overridden = existing !== null && p.judgment === "NEW";
      return {
        plan: p,
        existing,
        effective: overridden ? "UPDATE" : p.judgment,
        overridden,
      };
    });

    const written = await compileConcepts(provider, source, resolved, account, onEvent);

    for (const r of resolved) {
      const content = written.get(r.plan.targetRelPath);
      if (!content) continue;
      touched.set(r.plan.targetRelPath, content);
      working.set(r.plan.targetRelPath, parseConcept(r.plan.targetRelPath, content));
      trace.push({
        source: source.name,
        title: r.plan.title,
        plannerJudgment: r.plan.judgment,
        effectiveJudgment: r.effective,
        overridden: r.overridden,
        targetRelPath: r.plan.targetRelPath,
        reasoning: r.plan.reasoning,
      });
      onEvent?.({
        type: "concept",
        source: source.name,
        relPath: r.plan.targetRelPath,
        title: r.plan.title,
        judgment: r.effective,
      });
    }

    onEvent?.({ type: "source_done", source: source.name, index: i, total: sources.length });
  }

  return { files: touched, trace, questions, usage };
}

type Resolved = {
  plan: PlannedConcept;
  existing: ConceptRecord | null;
  effective: string;
  overridden: boolean;
};

/**
 * One call for all of a source's concepts, falling back to one call each.
 *
 * The batched call is the cheap path; the fallback exists because holding a
 * multi-file output format is exactly the discipline smaller open-weight
 * models lose first, and a visitor picking a free model should still get a
 * correct bundle — just a slower, pricier one.
 */
async function compileConcepts(
  provider: Provider,
  source: SourceDoc,
  resolved: Resolved[],
  account: (r: CompletionResult) => void,
  onEvent?: (e: IngestEvent) => void,
): Promise<Map<string, string>> {
  const spec = resolved
    .map((r, n) => {
      const existing = r.existing
        ? `EXISTING FULL FILE:\n${r.existing.raw}`
        : "EXISTING FULL FILE: (none — this is a new file)";
      return `--- CONCEPT ${n + 1} ---\nTARGET PATH: ${r.plan.targetRelPath}\nJUDGMENT: ${r.effective}\nCONCEPT: ${r.plan.title}\n${existing}`;
    })
    .join("\n\n");

  const batched = await provider.complete({
    system: WRITE_MULTI_SYSTEM_PROMPT,
    maxTokens: Math.min(16384, 2500 * resolved.length + 1500),
    user: `SOURCE DOCUMENT (${source.name}):\n${source.text}\n\nWrite these ${resolved.length} file(s), each in its own delimited block:\n\n${spec}`,
  });
  account(batched);

  const parsed = parseMultiFile(batched.text);
  const missing = resolved.filter((r) => !parsed.has(r.plan.targetRelPath));

  if (missing.length === 0) return parsed;

  onEvent?.({
    type: "note",
    message: `배치 출력에서 ${missing.length}개 파일이 누락돼 개별 재시도합니다 (모델: ${provider.id}).`,
  });

  for (const r of missing) {
    const single = await provider.complete({
      system: WRITE_SINGLE_SYSTEM_PROMPT,
      maxTokens: 4096,
      user: `JUDGMENT: ${r.effective}\nCONCEPT: ${r.plan.title}\nTARGET PATH: ${r.plan.targetRelPath}\n\nEXISTING FULL FILE (frontmatter + body), or (none) if NEW:\n${r.existing?.raw ?? "(none)"}\n\nSOURCE DOCUMENT (${source.name}) — extract only what's relevant to this concept:\n${source.text}\n\nWrite the full file content now.`,
    });
    account(single);
    const text = single.text.trim().replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "");
    if (text) parsed.set(r.plan.targetRelPath, text);
  }

  return parsed;
}
