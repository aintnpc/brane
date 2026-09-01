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

type Theme = "dark" | "light";

export default function BraneApp() {
  const [concepts, setConcepts] = useState<ConceptFile[]>([]);
  const [selected, setSelected] = useState<ConceptFile | null>(null);
  const [focusRelPath, setFocusRelPath] = useState<string | null>(null);
  const [citation, setCitation] = useState<{ ref: string; content: string } | null>(null);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const searchParams = useSearchParams();

  useEffect(() => {
    const stored = window.localStorage.getItem("brane-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("brane-theme", theme);
  }, [theme]);

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
    } else if (res.status === 403) {
      setCitation({
        ref,
        content:
          "(비공개 원본 — 이 인용의 출처는 공개 범위에 포함되지 않았습니다.\n" +
          "원장에는 개인 기록이 함께 들어 있고, 무엇을 열지는 기록의 주인이 고릅니다.)",
      });
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
          { query: q, answer: (res.status === 503
            ? "지금은 답변 기능이 꺼져 있습니다. 왼쪽 INDEX에서 문서를 열면 같은 원장을 그대로 읽을 수 있고, 문장에 붙은 📎는 원본으로 열립니다."
            : `에러: ${data.error ?? "알 수 없는 오류"}`), loadedFiles: [] },
        ]);
      }
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--background)] text-sm text-[var(--text-primary)]">
      {/* the graph is the hero — full-bleed background, everything else floats on top */}
      <div className="absolute inset-0">
        <GraphErrorBoundary
          fallback={
            <BrainGraph
              onSelect={openConceptByRelPath}
              focusRelPath={focusRelPath}
              hideLabel
              theme={theme}
            />
          }
        >
          <BrainGraph3D
            onSelect={openConceptByRelPath}
            focusRelPath={focusRelPath}
            hideLabel
            theme={theme}
          />
        </GraphErrorBoundary>
      </div>
      {/* vignette so floating glass panels stay legible over bright node clusters */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(to top, rgba(0,0,0,0.5), transparent, rgba(0,0,0,0.3))"
              : "linear-gradient(to top, rgba(255,255,255,0.35), transparent, rgba(255,255,255,0.2))",
        }}
      />

      {/* brand chip, top-left */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[rgba(var(--brane-accent-rgb),0.25)] bg-[var(--panel-bg)] px-3 py-1.5 backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          live
        </span>
        <span className="mx-1 h-3 w-px bg-[var(--panel-border)]" />
        <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">brane</span>
        <span className="mx-1 h-3 w-px bg-[var(--panel-border)]" />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="pointer-events-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>
      </div>

      {/* sidebar — floating glass, left */}
      <div className="pointer-events-none absolute left-4 right-4 top-[3.4rem] z-20 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] sm:right-auto">
        <span style={{ color: "var(--text-secondary)" }}>
          AI 대화 로그 1,082개가 개념 문서로 압축된 원장. 문장마다 원본 인용이 붙습니다.
        </span>
        <a href="/" className="pointer-events-auto underline" style={{ color: "var(--accent-text)" }}>처음</a>
        <a href="/portfolio" className="pointer-events-auto underline" style={{ color: "var(--accent-text)" }}>포트폴리오</a>
      </div>

      <div className="absolute left-3 right-3 top-[5.6rem] z-20 h-[calc(100%-9rem)] sm:right-auto sm:left-4">
        <GraphIndexPanel
          glass
          selectedRelPath={selected?.relPath}
          onFocus={setFocusRelPath}
          onSelect={openConceptByRelPath}
        />
      </div>

      {/* selected concept — floating glass, center-right; absent = pure graph */}
      {selected && (
        <div className="absolute inset-x-3 top-16 z-30 max-h-[calc(100%-6rem)] sm:inset-x-auto sm:left-[21rem] sm:right-[22rem] sm:z-20 overflow-y-auto rounded-xl border border-[rgba(var(--brane-accent-rgb),0.2)] bg-[var(--panel-bg)] p-6 shadow-[0_0_60px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{selected.title}</h2>
              <p className="text-[var(--text-secondary)]">{selected.description}</p>
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px] text-[var(--text-muted)]">
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
              className="shrink-0 rounded-full border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
              title="닫고 그래프로 돌아가기"
            >
              ✕
            </button>
          </div>
          <div className={`prose prose-sm max-w-none ${theme === "dark" ? "prose-invert" : ""}`}>
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
        <div className="absolute inset-x-3 top-16 z-40 flex h-[calc(100%-6rem)] flex-col sm:inset-x-auto sm:right-4 sm:z-20 sm:w-96 overflow-hidden rounded-xl border border-[rgba(var(--brane-accent-rgb),0.2)] bg-[var(--panel-bg)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-4 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              chat stream
            </span>
            <button
              onClick={() => setChatOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="접기"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {chat.length === 0 && (
              <p className="text-[var(--text-muted)]">bundle 전체를 대상으로 질문해보세요.</p>
            )}
            {chat.map((turn, i) => (
              <div key={i} className="space-y-2">
                <div className="rounded-lg bg-[var(--hover-bg)] px-3 py-2 font-medium text-[var(--text-primary)]">
                  {turn.query}
                </div>
                <div className={`prose prose-sm max-w-none ${theme === "dark" ? "prose-invert" : ""}`}>
                  <MarkdownWithCitations content={turn.answer} onCite={openCitation} />
                </div>
                {turn.loadedFiles.length > 0 && (
                  <div className="font-mono text-[10px] text-[var(--text-muted)]">
                    로드한 파일: {turn.loadedFiles.map((f) => `${f.title}(${f.timestamp})`).join(", ")}
                  </div>
                )}
              </div>
            ))}
            {asking && (
              <p className="text-[var(--text-muted)]">brane이 관련 파일을 찾고 답변 합성 중...</p>
            )}
          </div>
          <div className="border-t border-[var(--panel-border)] p-3">
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
              className="w-full resize-none rounded border border-[var(--panel-border)] bg-[var(--hover-bg)] p-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--brane-accent-rgb),0.4)] focus:outline-none"
              rows={2}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute right-4 top-16 z-20 rounded-full border border-[rgba(var(--brane-accent-rgb),0.25)] bg-[var(--panel-bg)] px-4 py-2 font-mono text-xs text-[var(--text-secondary)] backdrop-blur-xl hover:text-[var(--text-primary)]"
        >
          💬 brane한테 물어보기
        </button>
      )}

      {/* citation modal */}
      {citation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: "var(--overlay-bg)" }}
          onClick={() => setCitation(null)}
        >
          <div
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--panel-border)] bg-[var(--modal-bg)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-xs text-[var(--text-muted)]">{citation.ref}</h3>
              <button
                onClick={() => setCitation(null)}
                className="rounded px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
              >
                닫기
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-primary)]">
              {citation.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
