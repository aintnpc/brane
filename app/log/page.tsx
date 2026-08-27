"use client";

import { useEffect, useState } from "react";

interface IngestTraceEntry {
  title: string;
  plannerJudgment: "NEW" | "UPDATE" | "REFINE" | "QUESTION";
  effectiveJudgment: string;
  overridden: boolean;
  targetRelPath: string;
  reasoning: string;
}

interface TraceFile {
  source: string;
  ranAt: string;
  trace: IngestTraceEntry[];
}

const JUDGMENT_COLOR: Record<string, string> = {
  NEW: "#22c55e",
  UPDATE: "#3b82f6",
  REFINE: "#eab308",
  QUESTION: "#f59e0b",
};

export default function LogPage() {
  const [runs, setRuns] = useState<TraceFile[] | null>(null);

  useEffect(() => {
    fetch("/api/ingest-log")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRuns(Array.isArray(d) ? d : []))
      .catch(() => setRuns([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] p-6 font-mono text-sm text-zinc-300">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">write path — reasoning log</h1>
            <p className="text-xs text-zinc-500">
              매 ingest 실행마다 남긴 판정 근거. 왜 NEW/UPDATE/REFINE/QUESTION으로 판단했는지 전부 여기 있음.
            </p>
          </div>
          <a href="/" className="text-xs text-zinc-500 hover:text-white">
            ← 뷰어로
          </a>
        </div>

        {runs === null && <p className="text-zinc-500">loading...</p>}
        {runs?.length === 0 && (
          <p className="text-zinc-500">아직 실행된 ingest 없음 — /api/ingest 한 번 돌리면 여기 쌓임.</p>
        )}

        <div className="space-y-6">
          {runs?.map((run, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                <span className="text-zinc-300">{run.source}</span>
                <span>{new Date(run.ranAt).toLocaleString("ko-KR")}</span>
              </div>
              <div className="space-y-2">
                {run.trace.length === 0 && (
                  <p className="text-xs text-zinc-600">잡담/일회성으로 판단 — 전부 skip됨.</p>
                )}
                {run.trace.map((t, j) => (
                  <div key={j} className="rounded border border-white/5 bg-black/30 p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className="rounded px-1.5 py-0.5 font-semibold"
                        style={{
                          color: JUDGMENT_COLOR[t.effectiveJudgment] ?? "#a1a1aa",
                          backgroundColor: `${JUDGMENT_COLOR[t.effectiveJudgment] ?? "#a1a1aa"}22`,
                        }}
                      >
                        {t.effectiveJudgment}
                      </span>
                      {t.overridden && (
                        <span
                          className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400"
                          title={`planner가 원래 ${t.plannerJudgment}로 판정했으나 이미 존재하는 파일이라 코드가 강제로 수정함`}
                        >
                          ⚠ planner 오판 교정됨 (원래 {t.plannerJudgment})
                        </span>
                      )}
                      <span className="text-zinc-400">{t.title}</span>
                      <span className="text-zinc-600">→ {t.targetRelPath}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{t.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
