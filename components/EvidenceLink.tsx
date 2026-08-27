"use client";

import { useEffect, useState } from "react";

// A quoted line in the portfolio is a claim; this opens the raw log it came
// from so the claim can be checked. Fetches on click rather than inlining the
// text at build time — the whole point is that the reader is looking at the
// actual file the API serves, not a copy the page could have edited.

interface Props {
  archiveRef: string;
  quote: string;
}

export default function EvidenceLink({ archiveRef, quote }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || content !== null || error) return;
    fetch(`/api/archive?ref=${encodeURIComponent(archiveRef)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { content: string }) => setContent(d.content))
      .catch(() => setError(true));
  }, [open, content, error, archiveRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filename = archiveRef.replace(/^archive\//, "");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/ev block w-full cursor-pointer rounded-lg border px-4 py-3 text-left transition-colors"
        style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)" }}
      >
        <span
          className="block font-mono text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          &ldquo;{quote}&rdquo;
        </span>
        <span
          className="mt-2 block font-mono text-[0.65rem] transition-colors group-hover/ev:underline"
          style={{ color: "var(--accent-text)" }}
        >
          원본 로그 열기 →
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          style={{ background: "var(--overlay-bg)" }}
          onClick={() => setOpen(false)}
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
              <div className="min-w-0">
                <p className="font-mono text-[0.65rem] tracking-wider" style={{ color: "var(--accent-text)" }}>
                  RAW SOURCE
                </p>
                <p
                  className="mt-1 truncate font-mono text-xs"
                  style={{ color: "var(--text-secondary)" }}
                  title={filename}
                >
                  {filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
              {error
                ? "(비공개 원본 — 이 인용의 출처는 공개 범위에 포함되지 않았습니다.)"
                : content ?? "여는 중…"}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
