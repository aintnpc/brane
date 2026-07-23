"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ConceptFile } from "@/lib/bundle";
import MarkdownWithCitations from "./MarkdownWithCitations";
import GraphIndexPanel from "./GraphIndexPanel";
import BrainGraph3D from "./BrainGraph3D";
import BrainGraph from "./BrainGraph";
import GraphErrorBoundary from "./GraphErrorBoundary";

interface ChatTurn {
  query: string;
  answer: string;
  loadedFiles: { relPath: string; title: string; timestamp: string }[];
}

export default function BraneApp() {
  const [concepts, setConcepts] = useState<ConceptFile[]>([]);
  const [selected, setSelected] = useState<ConceptFile | null>(null);
  const [focusRelPath, setFocusRelPath] = useState<string | null>(null);
  const [citation, setCitation] = useState<{ ref: string; content: string } | null>(null);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/concepts")
      .then((r) => r.json())
      .then((data: ConceptFile[]) => {
        setConcepts(data);
        const openPath = searchParams.get("open");
        const toOpen = openPath && data.find((c) => c.relPath === openPath);
        if (toOpen) {
          setSelected(toOpen);
          setFocusRelPath(toOpen.relPath);
        }
        // no auto-select otherwise — first paint should be the bare graph,
        // not a wall of text competing with it for attention.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openConceptByRelPath(relPath: string) {
    const target = concepts.find((c) => c.relPath === relPath);
    if (target) {
      setSelected(target);
      setFocusRelPath(relPath);
    } else {
      setCitation({
        ref: relPath,
        content: "(원본을 찾을 수 없음 — bundle에서 삭제되었거나 경로가 다릅니다)",
      });
    }
  }

  async function openCitation(ref: string) {
    const res = await fetch(`/api/archive?ref=${encodeURIComponent(ref)}`);
    if (res.ok) {
      const data = await res.json();
      setCitation(data);
    } else {
      setCitation({ ref, content: "(원본을 찾을 수 없음 — archive에서 삭제되었거나 경로가 다릅니다)" });
    }
  }

  async function handleAsk() {
    if (!query.trim() || asking) return;
    const q = query.trim();
    setQuery("");
    setAsking(true);
    setChatOpen(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (res.ok) {
        setChat((prev) => [...prev, { query: q, answer: data.answer, loadedFiles: data.loadedFiles }]);
      } else {
        setChat((prev) => [
          ...prev,
          { query: q, answer: `에러: ${data.error ?? "알 수 없는 오류"}`, loadedFiles: [] },
        ]);
      }
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050506] text-sm text-zinc-100">
      {/* the graph is the hero — full-bleed background, everything else floats on top */}
      <div className="absolute inset-0">
        <GraphErrorBoundary
          fallback={
            <BrainGraph onSelect={openConceptByRelPath} focusRelPath={focusRelPath} hideLabel />
          }
        >
          <BrainGraph3D onSelect={openConceptByRelPath} focusRelPath={focusRelPath} hideLabel />
        </GraphErrorBoundary>
      </div>
      {/* vignette so floating glass panels stay legible over bright node clusters */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

      {/* brand chip, top-left */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[rgba(var(--brane-accent-rgb),0.25)] bg-black/40 px-3 py-1.5 backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">live</span>
        <span className="mx-1 h-3 w-px bg-white/10" />
        <span className="text-sm font-semibold tracking-tight text-white">brane</span>
      </div>

      {/* sidebar — floating glass, left */}
      <div className="absolute left-4 top-16 z-20 h-[calc(100%-6rem)]">
        <GraphIndexPanel
          glass
          selectedRelPath={selected?.relPath}
          onFocus={setFocusRelPath}
          onSelect={openConceptByRelPath}
        />
      </div>

      {/* selected concept — floating glass, center-right; absent = pure graph */}
      {selected && (
        <div className="absolute left-[21rem] right-[22rem] top-16 z-20 max-h-[calc(100%-6rem)] overflow-y-auto rounded-xl border border-[rgba(var(--brane-accent-rgb),0.2)] bg-black/50 p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{selected.title}</h2>
              <p className="text-zinc-400">{selected.description}</p>
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] text-zinc-500">
                <span>{selected.timestamp}</span>
                {selected.status && <span>· {selected.status}</span>}
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-[rgba(var(--brane-accent-rgb),0.12)] px-1.5 py-0.5 text-[rgb(var(--brane-accent-rgb))]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
              title="닫고 그래프로 돌아가기"
            >
              ✕
            </button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <MarkdownWithCitations
              content={selected.content}
              baseRelPath={selected.relPath}
              onCite={openCitation}
              onOpenConcept={openConceptByRelPath}
            />
          </div>
        </div>
      )}

      {/* chat — floating glass, right. collapsed to a launcher until first use. */}
      {chatOpen ? (
        <div className="absolute right-4 top-16 z-20 flex h-[calc(100%-6rem)] w-96 flex-col overflow-hidden rounded-xl border border-[rgba(var(--brane-accent-rgb),0.2)] bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              chat stream
            </span>
            <button
              onClick={() => setChatOpen(false)}
              className="text-zinc-500 hover:text-white"
              title="접기"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {chat.length === 0 && (
              <p className="text-zinc-500">bundle 전체를 대상으로 질문해보세요.</p>
            )}
            {chat.map((turn, i) => (
              <div key={i} className="space-y-2">
                <div className="rounded-lg bg-white/5 px-3 py-2 font-medium text-zinc-100">
                  {turn.query}
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <MarkdownWithCitations content={turn.answer} onCite={openCitation} />
                </div>
                {turn.loadedFiles.length > 0 && (
                  <div className="font-mono text-[10px] text-zinc-500">
                    로드한 파일: {turn.loadedFiles.map((f) => `${f.title}(${f.timestamp})`).join(", ")}
                  </div>
                )}
              </div>
            ))}
            {asking && <p className="text-zinc-500">brane이 관련 파일을 찾고 답변 합성 중...</p>}
          </div>
          <div className="border-t border-white/10 p-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="brane한테 물어보기..."
              autoFocus
              className="w-full resize-none rounded border border-white/10 bg-black/30 p-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[rgba(var(--brane-accent-rgb),0.4)] focus:outline-none"
              rows={2}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute right-4 top-16 z-20 rounded-full border border-[rgba(var(--brane-accent-rgb),0.25)] bg-black/40 px-4 py-2 font-mono text-xs text-zinc-300 backdrop-blur-xl hover:bg-black/60 hover:text-white"
        >
          💬 brane한테 물어보기
        </button>
      )}

      {/* citation modal */}
      {citation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8"
          onClick={() => setCitation(null)}
        >
          <div
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-xs text-zinc-500">{citation.ref}</h3>
              <button
                onClick={() => setCitation(null)}
                className="rounded px-2 py-1 text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                닫기
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-200">{citation.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
