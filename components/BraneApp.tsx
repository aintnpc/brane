"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ConceptFile } from "@/lib/bundle";
import MarkdownWithCitations from "./MarkdownWithCitations";

interface ChatTurn {
  query: string;
  answer: string;
  loadedFiles: { relPath: string; title: string; timestamp: string }[];
}

export default function BraneApp() {
  const [concepts, setConcepts] = useState<ConceptFile[]>([]);
  const [selected, setSelected] = useState<ConceptFile | null>(null);
  const [citation, setCitation] = useState<{ ref: string; content: string } | null>(null);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/concepts")
      .then((r) => r.json())
      .then((data: ConceptFile[]) => {
        setConcepts(data);
        const openPath = searchParams.get("open");
        const toOpen = openPath && data.find((c) => c.relPath === openPath);
        setSelected(toOpen || data[0] || null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped: Record<string, ConceptFile[]> = {};
  for (const c of concepts) {
    (grouped[c.category] ??= []).push(c);
  }

  function openConceptByRelPath(relPath: string) {
    const target = concepts.find((c) => c.relPath === relPath);
    if (target) {
      setSelected(target);
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
    <div className="flex h-screen w-full text-sm text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">brane</h1>
          <a
            href="/graph"
            className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            🧠 그래프
          </a>
        </div>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {category}
            </div>
            <ul>
              {items.map((c) => (
                <li key={c.relPath}>
                  <button
                    onClick={() => setSelected(c)}
                    className={`block w-full truncate rounded px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      selected?.relPath === c.relPath ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : ""
                    }`}
                    title={c.description}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{selected.title}</h2>
              <p className="text-zinc-500">{selected.description}</p>
              <div className="mt-1 flex gap-2 text-xs text-zinc-400">
                <span>{selected.timestamp}</span>
                {selected.status && <span>· {selected.status}</span>}
                {selected.tags.map((t) => (
                  <span key={t} className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
            <MarkdownWithCitations
              content={selected.content}
              baseRelPath={selected.relPath}
              onCite={openCitation}
              onOpenConcept={openConceptByRelPath}
            />
          </>
        ) : (
          <p className="text-zinc-400">bundle 로딩 중...</p>
        )}
      </main>

      {/* Chat panel */}
      <aside className="flex w-96 shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.length === 0 && (
            <p className="text-zinc-400">bundle 전체를 대상으로 질문해보세요.</p>
          )}
          {chat.map((turn, i) => (
            <div key={i} className="space-y-2">
              <div className="rounded bg-zinc-100 dark:bg-zinc-800 px-3 py-2 font-medium">
                {turn.query}
              </div>
              <MarkdownWithCitations content={turn.answer} onCite={openCitation} />
              {turn.loadedFiles.length > 0 && (
                <div className="text-xs text-zinc-400">
                  로드한 파일: {turn.loadedFiles.map((f) => `${f.title}(${f.timestamp})`).join(", ")}
                </div>
              )}
            </div>
          ))}
          {asking && <p className="text-zinc-400">brane이 관련 파일을 찾고 답변 합성 중...</p>}
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
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
            className="w-full resize-none rounded border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm"
            rows={2}
          />
        </div>
      </aside>

      {/* Citation modal */}
      {citation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-8"
          onClick={() => setCitation(null)}
        >
          <div
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-xs text-zinc-500">{citation.ref}</h3>
              <button
                onClick={() => setCitation(null)}
                className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                닫기
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm">{citation.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
