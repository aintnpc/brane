import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { listConcepts, BUNDLE_DIR, ARCHIVE_DIR, BRANE_ROOT } from "./bundle";

const LOG_DIR = path.join(BRANE_ROOT, ".ingest-logs");

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
const MODEL = "claude-sonnet-5";

// Mirrors ~/brane/engine/ingest.md exactly — this is the write path as code
// instead of a prompt a human follows by hand. Do not drift from that spec
// without updating both places.

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
[{"title": "concept title", "judgment": "NEW"|"UPDATE"|"REFINE"|"QUESTION", "targetRelPath": "category/slug.md", "category": "identity"|"ventures"|"roadmap"|"playbooks"|"notes"|"architecture", "reasoning": "one sentence — for QUESTION, phrase as '[old date/context]엔 A, 지금은 B — 어느 쪽이 유효합니까? 근거: ...'"}]

If nothing in the source passes the 6-month test, return an empty array [].`;

const WRITE_SYSTEM_PROMPT = `You are brane's write-path compiler for a single concept. You are not an archivist — you are a compiler. Never paste raw source text verbatim; distill to conclusions only.

Rules:
- Every file needs YAML frontmatter: type, title, description, tags (array), timestamp (today's date), and status if applicable.
- One file = one concept. If asked to write about two concepts, refuse and write only the first.
- Every fact you write must carry an inline citation tag \`^[archive/<sourceFilename>]\` immediately after the sentence it came from. Never write an unattributable sentence.
- Related bundle documents get linked with relative markdown links in the body, e.g. [green-apple](../ventures/green-apple.md).
- If judgment is UPDATE or REFINE: you are given the EXISTING FULL FILE. Merge the new material into it — preserve everything still valid, update what changed, bump the timestamp. Do not restate the whole file from scratch if most of it is unchanged; keep the parts that still hold and edit only what's affected.
- If judgment is NEW: write a complete new file from scratch following the same frontmatter and citation rules.
- Do not state uncertain inference as fact — mark it "(추정)" if it's inferred rather than stated directly.

Return ONLY the full file content (frontmatter + body), no explanation, no code fences.`;

export interface IngestQuestion {
  concept: string;
  report: string;
}

export interface IngestTraceEntry {
  title: string;
  plannerJudgment: "NEW" | "UPDATE" | "REFINE" | "QUESTION";
  effectiveJudgment: string;
  overridden: boolean; // true when the safety net corrected the planner's NEW mislabel
  targetRelPath: string;
  reasoning: string;
}

export interface IngestResult {
  source: string;
  newFiles: string[];
  updatedFiles: string[];
  questions: IngestQuestion[];
  skippedCount: number;
  trace: IngestTraceEntry[];
  traceLogPath: string;
}

interface PlannedConcept {
  title: string;
  judgment: "NEW" | "UPDATE" | "REFINE" | "QUESTION";
  targetRelPath: string;
  category: string;
  reasoning: string;
}

function textOf(resp: Anthropic.Message): string {
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export async function ingest(sourceAbsPath: string): Promise<IngestResult> {
  const sourceRelName = path.basename(sourceAbsPath);
  const raw = fs.readFileSync(sourceAbsPath, "utf-8");

  const concepts = listConcepts();
  const index = concepts
    .map((c) => `${c.relPath} | ${c.title} | ${c.description} | tags: ${c.tags.join(",")} | ${c.timestamp}`)
    .join("\n");

  const planResp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: PLAN_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `BUNDLE INDEX:\n${index}\n\nSOURCE (${sourceRelName}):\n${raw}\n\nReturn the JSON plan now.`,
      },
    ],
  });

  let plan: PlannedConcept[] = [];
  try {
    const match = textOf(planResp).match(/\[[\s\S]*\]/);
    plan = match ? JSON.parse(match[0]) : [];
  } catch (err) {
    throw new Error(`ingest planning failed to parse: ${(err as Error).message}`);
  }

  console.log(`[ingest] ${sourceRelName}: planned ${plan.length} concept(s)`);

  const newFiles: string[] = [];
  const updatedFiles: string[] = [];
  const questions: IngestQuestion[] = [];
  const trace: IngestTraceEntry[] = [];

  for (const p of plan) {
    if (p.judgment === "QUESTION") {
      questions.push({ concept: p.title, report: p.reasoning });
      trace.push({
        title: p.title,
        plannerJudgment: p.judgment,
        effectiveJudgment: "QUESTION",
        overridden: false,
        targetRelPath: p.targetRelPath,
        reasoning: p.reasoning,
      });
      console.log(`[ingest]   QUESTION "${p.title}" — ${p.reasoning}`);
      continue; // existing file untouched, per spec
    }

    const targetPath = path.join(BUNDLE_DIR, p.targetRelPath);
    const fileAlreadyExists = fs.existsSync(targetPath);

    // Defense against planner error: the plan is an LLM judgment and can be
    // wrong (observed: a concept with a rich existing file misjudged as
    // NEW). Never trust the judgment label over reality — if a file already
    // sits at the target path, always load it and treat this as a merge,
    // regardless of what the planner said. Blindly writing "NEW" content
    // over an existing path is data loss, not a compaction decision.
    const effectiveJudgment = fileAlreadyExists && p.judgment === "NEW" ? "UPDATE" : p.judgment;
    const existingRaw = fileAlreadyExists ? fs.readFileSync(targetPath, "utf-8") : null;

    const writeResp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: WRITE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `JUDGMENT: ${effectiveJudgment}\nCONCEPT: ${p.title}\nTARGET PATH: ${p.targetRelPath}\n\nEXISTING FULL FILE (frontmatter + body), or (none) if NEW:\n${existingRaw ?? "(none)"}\n\nSOURCE DOCUMENT (${sourceRelName}) — extract only what's relevant to this concept:\n${raw}\n\nWrite the full file content now.`,
        },
      ],
    });

    const fileContent = textOf(writeResp).trim();
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, fileContent + "\n", "utf-8");

    const overridden = fileAlreadyExists && p.judgment === "NEW";
    trace.push({
      title: p.title,
      plannerJudgment: p.judgment,
      effectiveJudgment,
      overridden,
      targetRelPath: p.targetRelPath,
      reasoning: p.reasoning,
    });
    console.log(
      `[ingest]   ${effectiveJudgment}${overridden ? " (planner said NEW, corrected)" : ""} "${p.title}" -> ${p.targetRelPath} — ${p.reasoning}`,
    );

    if (effectiveJudgment === "NEW") newFiles.push(p.targetRelPath);
    else updatedFiles.push(p.targetRelPath);
  }

  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  fs.renameSync(sourceAbsPath, path.join(ARCHIVE_DIR, sourceRelName));

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const traceLogPath = path.join(LOG_DIR, `${sourceRelName}.trace.json`);
  fs.writeFileSync(
    traceLogPath,
    JSON.stringify({ source: sourceRelName, ranAt: new Date().toISOString(), trace }, null, 2),
    "utf-8",
  );

  return {
    source: sourceRelName,
    newFiles,
    updatedFiles,
    questions,
    skippedCount: 0, // the planner already drops non-durable content; nothing to count separately yet
    trace,
    traceLogPath,
  };
}
