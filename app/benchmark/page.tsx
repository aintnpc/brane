"use client";

import { useEffect, useState } from "react";

interface ProvenanceNode {
  ref: string;
  chars: number;
  tokensEst: number;
  exists: boolean;
}
interface ConceptTrace {
  relPath: string;
  title: string;
  bundleChars: number;
  bundleTokensEst: number;
  citedArchive: ProvenanceNode[];
}
interface ContextCostComparison {
  query: string;
  selectedConcepts: ConceptTrace[];
  digested: { tokensEst: number; fileCount: number };
  raw: { tokensEst: number; fileCount: number };
  compressionRatio: number;
}
interface OverallStats {
  bundleFileCount: number;
  bundleTokensEst: number;
  archiveTokensEst: number;
  compressionRatio: number;
}

export default function BenchmarkPage() {
  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [query, setQuery] = useState("");
  const [comparison, setComparison] = useState<ContextCostComparison | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/benchmark")
      .then((r) => r.json())
      .then((d) => setOverall(d.overall));
  }, []);

  async function run() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/benchmark?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setComparison(data.comparison);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black p-8 font-mono text-sm text-zinc-300">
      <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← 뷰어로 돌아가기
      </a>
      <h1 className="mt-4 mb-1 text-xl font-semibold text-zinc-100">압축 벤치마크</h1>
      <p className="mb-6 text-xs text-zinc-500">
        OKF 구조(bundle, 소화됨)로 읽는 것과 원본 archive를 그대로 읽는 것의 토큰 비용 차이. 파일
        크기 기반 추정치 — API 호출 없이 지금 바로 계산됨 (2.5자/토큰 어림).
      </p>

      {overall && (
        <div className="mb-8 grid grid-cols-4 gap-4 rounded border border-white/10 p-4">
          <div>
            <div className="text-xs text-zinc-500">bundle 파일</div>
            <div className="text-lg text-zinc-100">{overall.bundleFileCount}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">bundle 토큰(추정)</div>
            <div className="text-lg text-zinc-100">{overall.bundleTokensEst.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">archive 토큰(추정)</div>
            <div className="text-lg text-zinc-100">{overall.archiveTokensEst.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">전체 압축률</div>
            <div className="text-lg font-semibold text-amber-400">
              {overall.compressionRatio.toFixed(1)}x
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="질문 입력 (예: Green Apple이 뭐야?)"
          className="flex-1 rounded border border-white/10 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
        />
        <button
          onClick={run}
          disabled={loading}
          className="rounded bg-zinc-800 px-4 py-2 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "..." : "비교"}
        </button>
      </div>

      {comparison && (
        <div>
          <div className="mb-4 grid grid-cols-3 gap-4 rounded border border-amber-400/30 bg-amber-400/5 p-4">
            <div>
              <div className="text-xs text-zinc-500">digested (bundle) 경로</div>
              <div className="text-lg text-zinc-100">
                {comparison.digested.tokensEst.toLocaleString()} tok
              </div>
              <div className="text-xs text-zinc-600">{comparison.digested.fileCount}개 파일</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">raw (archive) 경로</div>
              <div className="text-lg text-zinc-100">{comparison.raw.tokensEst.toLocaleString()} tok</div>
              <div className="text-xs text-zinc-600">{comparison.raw.fileCount}개 원본</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">이 질문의 압축률</div>
              <div className="text-lg font-semibold text-amber-400">
                {comparison.compressionRatio.toFixed(1)}x
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-500 mb-2">provenance chain (질문 → 선택된 개념 → 인용 원본)</div>
          <div className="space-y-3">
            {comparison.selectedConcepts.map((c) => (
              <div key={c.relPath} className="rounded border border-white/10 p-3">
                <div className="text-zinc-100">
                  {c.title}{" "}
                  <span className="text-zinc-600">
                    ({c.bundleTokensEst.toLocaleString()} tok, {c.relPath})
                  </span>
                </div>
                <div className="mt-1 ml-4 space-y-0.5">
                  {c.citedArchive.length === 0 && (
                    <div className="text-zinc-600">— 인용 원본 없음</div>
                  )}
                  {c.citedArchive.map((a) => (
                    <div key={a.ref} className={a.exists ? "text-zinc-500" : "text-red-500"}>
                      ↳ {a.ref} ({a.tokensEst.toLocaleString()} tok){!a.exists && " — 없음"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {comparison.selectedConcepts.length === 0 && (
              <div className="text-zinc-600">일치하는 개념 없음 — 다른 키워드로 시도해보세요.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
