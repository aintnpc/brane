import fs from "fs";
import path from "path";
import { listConcepts, BUNDLE_DIR, ARCHIVE_DIR, BRANE_ROOT } from "./bundle";
import { getProvider } from "./llm";
import { ingestCore, ConceptRecord, IngestEvent } from "./ingest-core";

const LOG_DIR = path.join(BRANE_ROOT, ".ingest-logs");

// The author's own write path: the same engine as the visitor's, with a
// filesystem strapped to either end. Everything that decides *what* to write
// now lives in ingest-core.ts — this file only reads the bundle off disk,
// commits the result back, and files the source in archive/.
//
// Keeping the judgment logic out of here is what lets the identical engine
// run over a stranger's uploaded chat logs with no disk at all, and over
// synthetic personas in the simulation harness.

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
  provider: string;
  usage: { inputTokens: number; outputTokens: number; calls: number };
}

function toRecord(c: ReturnType<typeof listConcepts>[number]): ConceptRecord {
  const raw = fs.readFileSync(path.join(BUNDLE_DIR, c.relPath), "utf-8");
  return {
    relPath: c.relPath,
    category: c.category,
    title: c.title,
    description: c.description,
    tags: c.tags,
    timestamp: c.timestamp,
    content: c.content,
    raw,
  };
}

export async function ingest(
  sourceAbsPath: string,
  opts: { providerId?: string; onEvent?: (e: IngestEvent) => void } = {},
): Promise<IngestResult> {
  const sourceRelName = path.basename(sourceAbsPath);
  const text = fs.readFileSync(sourceAbsPath, "utf-8");
  const provider = getProvider(opts.providerId);

  const existing = listConcepts().map(toRecord);
  const existingPaths = new Set(existing.map((c) => c.relPath));

  const result = await ingestCore({
    sources: [{ name: sourceRelName, text }],
    existingConcepts: existing,
    provider,
    onEvent: opts.onEvent,
  });

  const newFiles: string[] = [];
  const updatedFiles: string[] = [];

  for (const [relPath, content] of result.files) {
    const targetPath = path.join(BUNDLE_DIR, relPath);
    // Belt and braces alongside the core's own existence check: never let a
    // path escape the bundle directory, whatever the planner proposed.
    if (!targetPath.startsWith(BUNDLE_DIR)) continue;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content.trimEnd() + "\n", "utf-8");
    if (existingPaths.has(relPath)) updatedFiles.push(relPath);
    else newFiles.push(relPath);
  }

  // Only file the source away once its concepts are safely on disk — a crash
  // mid-write leaves the source in inbox/ to be retried, not silently archived.
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  fs.renameSync(sourceAbsPath, path.join(ARCHIVE_DIR, sourceRelName));

  const trace: IngestTraceEntry[] = result.trace.map((t) => ({
    title: t.title,
    plannerJudgment: t.plannerJudgment,
    effectiveJudgment: t.effectiveJudgment,
    overridden: t.overridden,
    targetRelPath: t.targetRelPath,
    reasoning: t.reasoning,
  }));

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const traceLogPath = path.join(LOG_DIR, `${sourceRelName}.trace.json`);
  fs.writeFileSync(
    traceLogPath,
    JSON.stringify(
      {
        source: sourceRelName,
        ranAt: new Date().toISOString(),
        provider: provider.id,
        usage: result.usage,
        trace,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(
    `[ingest] ${sourceRelName} via ${provider.id}: new=${newFiles.length} updated=${updatedFiles.length} questions=${result.questions.length} calls=${result.usage.calls}`,
  );

  return {
    source: sourceRelName,
    newFiles,
    updatedFiles,
    questions: result.questions,
    skippedCount: 0, // the planner already drops non-durable content
    trace,
    traceLogPath,
    provider: provider.id,
    usage: result.usage,
  };
}
