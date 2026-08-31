"use client";

import { useState } from "react";
import MarkdownWithCitations from "./MarkdownWithCitations";

// The hero of the portfolio: a question box instead of a pitch.
//
// The argument the page makes is that a candidate's data should sit still while
// the reader asks their own questions of it — so the reader gets the first move,
// not a paragraph written to anticipate them. Answers come from the same ledger
// the rest of the page cites, and every `^[archive/...]` in an answer opens the
// source it came from.

interface Turn {
  q: string;
  answer: string;
  loadedFiles: { relPath: string; title: string }[];
  error?: boolean;
}

const SUGGESTED = [
  "이 사람은 어떤 문제를 푸는 걸 좋아하나?",
  "실패한 프로젝트에서 뭘 배웠나?",
  "AI를 어떻게 쓰나?",
  "결제나 정산 시스템을 다뤄봤나?",
];

export default function AskBrane() {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [cite, setCite] = useState<{ ref: string; content: string } | null>(null);

  async function submit(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setQ("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      const message =
        res.status === 503
          ? "지금은 답변 기능이 꺼져 있습니다. 아래로 스크롤하면 같은 원장에서 나온 작업 기록을 그대로 읽을 수 있고, 인용은 전부 원본으로 열립니다."
          : (data.error ?? "알 수 없는 오류");
      setTurns((prev) => [
        ...prev,
        res.ok
          ? { q: text, answer: data.answer, loadedFiles: data.loadedFiles ?? [] }
          : { q: text, answer: message, loadedFiles: [], error: true },
      ]);
    } catch {
      setTurns((prev) => [
        ...prev,
        { q: text, answer: "연결에 실패했습니다.", loadedFiles: [], error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function openCite(ref: string) {
    const res = await fetch(`/api/archive?ref=${encodeURIComponent(ref)}`);
    if (res.ok) setCite(await res.json());
    else if (res.status === 403)
      setCite({
        ref,
        content:
          "(비공개 원본 — 이 인용의 출처는 공개 범위에 포함되지 않았습니다.\n" +
          "원장에는 개인 기록이 함께 들어 있고, 무엇을 열지는 기록의 주인이 고릅니다.)",
      });
    else setCite({ ref, content: "(원본을 찾을 수 없습니다)" });
  }

  return (
    <section className="flex min-h-[88vh] flex-col justify-center">
      <div>
        <h1
          className="text-4xl font-semibold tracking-tight sm:text-5xl"
          style={{ color: "var(--text-primary)" }}
        >
          김재원
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Jaewon Kim · Stony Brook University (한국뉴욕주립대학교) Computer Science · 휴학 중
        </p>

        <p className="mt-8 text-lg leading-relaxed sm:text-xl" style={{ color: "var(--text-primary)" }}>
          이력서 대신, 4년치 작업 기록에 직접 물어보세요.
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          답은 brane이 소화한 원장에서 나오고, 문장에 붙은 📎를 누르면 그 근거가 된 원본이 열립니다.
          <br />
          찾는 사람이 직접 묻는 편이, 지원자가 미리 짐작해 쓴 글보다 정확합니다.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="mt-8"
      >
        <div
          className="flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors focus-within:border-[var(--accent-text)]"
          style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)" }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={400}
            placeholder="김재원에 대해 물어보세요"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            aria-label="brane에게 질문하기"
          />
          <button
            type="submit"
            disabled={busy || !q.trim()}
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-35"
            style={{ background: "var(--accent-text)", color: "#0b0b0e" }}
          >
            {busy ? "읽는 중" : "물어보기"}
          </button>
        </div>
      </form>

      {turns.length === 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => submit(s)}
                disabled={busy}
                className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-[var(--accent-text)] disabled:opacity-40"
                style={{ borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {turns.length > 0 && (
        <div className="mt-8 space-y-8">
          {turns.map((t, i) => (
            <div key={i}>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {t.q}
              </p>
              <div
                className="mt-3 rounded-xl border p-5"
                style={{
                  borderColor: "var(--panel-border)",
                  background: "var(--panel-bg)",
                  color: t.error ? "var(--text-muted)" : "var(--text-secondary)",
                }}
              >
                {t.error ? (
                  <p className="text-sm">{t.answer}</p>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed">
                    <MarkdownWithCitations content={t.answer} onCite={openCite} />
                  </div>
                )}
                {t.loadedFiles.length > 0 && (
                  <p
                    className="mt-4 border-t pt-3 font-mono text-[0.65rem] leading-relaxed"
                    style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}
                  >
                    읽은 문서 {t.loadedFiles.length}개 · {t.loadedFiles.map((f) => f.title).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {busy && (
        <p className="mt-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          원장을 읽는 중…
        </p>
      )}

      <p className="mt-12 font-mono text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
        ↓ 지금까지 만든 것
      </p>

      {cite && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          style={{ background: "var(--overlay-bg)" }}
          onClick={() => setCite(null)}
        >
          <div
            className="my-auto w-full max-w-3xl rounded-xl border shadow-2xl"
            style={{ background: "var(--modal-bg)", borderColor: "var(--panel-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-4 border-b px-5 py-4"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <p className="min-w-0 truncate font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                {cite.ref}
              </p>
              <button
                type="button"
                onClick={() => setCite(null)}
                className="shrink-0 cursor-pointer text-xl leading-none"
                style={{ color: "var(--text-muted)" }}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <pre
              className="max-h-[70vh] overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {cite.content}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
