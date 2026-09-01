// The simulation harness — run the write path against synthetic users and
// measure what came out.
//
// The engine's behaviour is almost entirely prompt-determined, which means
// every prompt edit, every model swap, and every parameter change is an
// unmeasured gamble unless something replays a known workload and scores it.
// This is that something. It runs personas.ts through ingest-core.ts with no
// filesystem and no network beyond the chosen provider, then reports the
// numbers that actually distinguish a digest from a dump:
//
//   - concept count       — does a 3-conversation stream converge to a few
//                           files, or produce one file per conversation?
//   - merge rate          — did later sources land on earlier files?
//   - question capture    — was a real reversal caught, or silently overwritten?
//   - override rate       — how often did the planner mislabel an existing
//                           concept as NEW and need the code-level safety net?
//   - isolated nodes      — a known weakness: concepts that link to nothing.
//   - cost                — tokens and calls, which is what decides whether a
//                           free tier can serve a public demo.

import { ingestCore, IngestEvent, ConceptRecord, parseConcept } from "./ingest-core";
import { buildGraphFrom } from "./graph";
import { getProvider, classifyError } from "./llm";
import { PERSONAS, Persona, getPersona } from "./personas";

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PersonaRun {
  personaId: string;
  label: string;
  probes: string;
  provider: string;
  ok: boolean;
  error?: string;
  metrics: {
    sources: number;
    concepts: number;
    judgments: Record<string, number>;
    overrides: number;
    questions: number;
    graphNodes: number;
    graphLinks: number;
    isolatedNodes: number;
    inputTokens: number;
    outputTokens: number;
    calls: number;
    durationMs: number;
  };
  checks: CheckResult[];
  /** relPath -> title, so a failure is inspectable without dumping full files. */
  produced: { relPath: string; title: string; chars: number }[];
  questions: { concept: string; report: string }[];
  notes: string[];
}

export interface SuiteRun {
  provider: string;
  startedAt: string;
  runs: PersonaRun[];
  summary: {
    personas: number;
    checksPassed: number;
    checksTotal: number;
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalDurationMs: number;
  };
}

function scorePersona(p: Persona, run: Omit<PersonaRun, "checks">): CheckResult[] {
  const checks: CheckResult[] = [];
  const m = run.metrics;
  const e = p.expects;

  if (e.minConcepts !== undefined) {
    checks.push({
      name: `concepts >= ${e.minConcepts}`,
      passed: m.concepts >= e.minConcepts,
      detail: `${m.concepts}개 생성됨`,
    });
  }
  if (e.maxConcepts !== undefined) {
    checks.push({
      name: `concepts <= ${e.maxConcepts}`,
      passed: m.concepts <= e.maxConcepts,
      detail:
        m.concepts <= e.maxConcepts
          ? `${m.concepts}개 — 병합이 작동함`
          : `${m.concepts}개 — 소스마다 새 파일을 만들고 있음(중복 의심)`,
    });
  }
  if (e.expectsQuestion) {
    checks.push({
      name: "reversal caught as QUESTION",
      passed: m.questions > 0,
      detail:
        m.questions > 0
          ? `QUESTION ${m.questions}건 — 사람에게 되물음`
          : "번복을 못 잡음 — 이전 판단이 조용히 덮어써졌을 가능성",
    });
  }
  if (e.expectsMerge) {
    const merged = (m.judgments.UPDATE ?? 0) + (m.judgments.REFINE ?? 0);
    checks.push({
      name: "later sources merged into earlier files",
      passed: merged > 0,
      detail: merged > 0 ? `UPDATE/REFINE ${merged}건` : "전부 NEW — 진행 상황이 병합되지 않음",
    });
  }
  if (e.expectsNothing) {
    checks.push({
      name: "chatter filtered",
      passed: m.concepts === 0,
      detail:
        m.concepts === 0
          ? "전부 걸러짐 — 6개월 테스트 정상 작동"
          : `${m.concepts}개가 개념으로 승격됨 — 일회성 내용을 보관하고 있음`,
    });
  }

  return checks;
}

export async function runPersona(
  persona: Persona,
  providerId?: string,
  opts: { onEvent?: (e: IngestEvent) => void; seedConcepts?: ConceptRecord[] } = {},
): Promise<PersonaRun> {
  const provider = getProvider(providerId);
  const notes: string[] = [];
  const started = Date.now();

  const base: Omit<PersonaRun, "checks"> = {
    personaId: persona.id,
    label: persona.label,
    probes: persona.probes,
    provider: provider.id,
    ok: true,
    metrics: {
      sources: persona.sources.length,
      concepts: 0,
      judgments: {},
      overrides: 0,
      questions: 0,
      graphNodes: 0,
      graphLinks: 0,
      isolatedNodes: 0,
      inputTokens: 0,
      outputTokens: 0,
      calls: 0,
      durationMs: 0,
    },
    produced: [],
    questions: [],
    notes,
  };

  try {
    const result = await ingestCore({
      sources: persona.sources,
      existingConcepts: opts.seedConcepts ?? [],
      provider,
      onEvent: (ev) => {
        if (ev.type === "note") notes.push(ev.message);
        opts.onEvent?.(ev);
      },
    });

    const judgments: Record<string, number> = {};
    for (const t of result.trace) {
      judgments[t.effectiveJudgment] = (judgments[t.effectiveJudgment] ?? 0) + 1;
    }

    const records = [...result.files.entries()].map(([relPath, raw]) =>
      parseConcept(relPath, raw),
    );
    const graph = buildGraphFrom(records);
    const linked = new Set<string>();
    for (const l of graph.links) {
      linked.add(l.source);
      linked.add(l.target);
    }

    base.metrics = {
      sources: persona.sources.length,
      concepts: result.files.size,
      judgments,
      overrides: result.trace.filter((t) => t.overridden).length,
      questions: result.questions.length,
      graphNodes: graph.nodes.length,
      graphLinks: graph.links.length,
      isolatedNodes: graph.nodes.filter((n) => !linked.has(n.id)).length,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      calls: result.usage.calls,
      durationMs: Date.now() - started,
    };
    base.produced = records.map((r) => ({
      relPath: r.relPath,
      title: r.title,
      chars: r.content.length,
    }));
    base.questions = result.questions;
  } catch (err) {
    base.ok = false;
    base.error = `${classifyError(err)}: ${err instanceof Error ? err.message : String(err)}`;
    base.metrics.durationMs = Date.now() - started;
    return { ...base, checks: [] };
  }

  return { ...base, checks: scorePersona(persona, base) };
}

export async function runSuite(
  providerId?: string,
  opts: { personaIds?: string[]; onEvent?: (e: IngestEvent) => void } = {},
): Promise<SuiteRun> {
  const provider = getProvider(providerId);
  const selected = opts.personaIds?.length
    ? opts.personaIds.map(getPersona).filter((p): p is Persona => p !== null)
    : PERSONAS;

  const runs: PersonaRun[] = [];
  // Sequential on purpose: these runs are for comparing behaviour, and free
  // tiers rate-limit hard enough that a parallel suite would measure the rate
  // limiter instead of the engine.
  for (const p of selected) {
    runs.push(await runPersona(p, provider.id, { onEvent: opts.onEvent }));
  }

  const allChecks = runs.flatMap((r) => r.checks);
  return {
    provider: provider.id,
    startedAt: new Date().toISOString(),
    runs,
    summary: {
      personas: runs.length,
      checksPassed: allChecks.filter((c) => c.passed).length,
      checksTotal: allChecks.length,
      totalCalls: runs.reduce((a, r) => a + r.metrics.calls, 0),
      totalInputTokens: runs.reduce((a, r) => a + r.metrics.inputTokens, 0),
      totalOutputTokens: runs.reduce((a, r) => a + r.metrics.outputTokens, 0),
      totalDurationMs: runs.reduce((a, r) => a + r.metrics.durationMs, 0),
    },
  };
}
