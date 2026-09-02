"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// The visitor's first sixty seconds.
//
// The one thing this screen must not do is show a spinner. Digestion takes
// tens of seconds, and the difference between "this is broken" and "this is
// thinking" is entirely whether the reader can watch it work. So every event
// the engine emits lands on screen the moment it arrives, in order — planned
// concepts first, then each file as it is compiled.

interface ProviderOption {
  id: string;
  label: string;
  real: boolean;
}

interface Limits {
  maxSources: number;
  maxCharsPerSource: number;
  maxTotalChars: number;
  retentionDays: number;
}

interface Draft {
  id: number;
  name: string;
  text: string;
}

type LogLine =
  | { kind: "info"; text: string }
  | { kind: "plan"; text: string }
  | { kind: "concept"; title: string; path: string; judgment: string }
  | { kind: "question"; text: string }
  | { kind: "error"; text: string };

const JUDGMENT_TONE: Record<string, string> = {
  NEW: "var(--accent-text)",
  UPDATE: "#5a9e6f",
  REFINE: "#c9973f",
};

let nextId = 1;

// The way back in.
//
// There are no accounts here, so a lost link is a lost brane — which makes
// this the only recovery path that exists. The reply is deliberately the same
// whether or not the address is known, so nobody can use it to find out who
// has a brane on this site.
function RecoverLink() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    setState("sending");
    try {
      const res = await fetch("/api/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(d.error ?? "다시 시도해주세요.");
        return;
      }
      setState("sent");
      setMessage(d.message ?? "메일함을 확인해주세요.");
    } catch {
      setState("error");
      setMessage("연결에 실패했습니다.");
    }
  }

  if (!open) {
    return (
      <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        전에 만든 brane이 있나요?{" "}
        <button onClick={() => setOpen(true)} className="underline" style={{ color: "var(--accent-text)" }}>
          링크 다시 받기
        </button>
      </p>
    );
  }

  return (
    <div
      className="mt-6 rounded-lg border p-4"
      style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
    >
      {state === "sent" ? (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              brane을 만들 때 등록한 이메일
            </span>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email.includes("@") && void submit()}
                placeholder="you@example.com"
                className="flex-1 rounded border px-2 py-1.5 text-sm"
                style={{
                  borderColor: "var(--panel-border)",
                  background: "var(--hover-bg)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => void submit()}
                disabled={!email.includes("@") || state === "sending"}
                className="shrink-0 rounded px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                style={{ background: "var(--brane-accent)", color: "#fff" }}
              >
                {state === "sending" ? "보내는 중…" : "보내기"}
              </button>
            </div>
          </label>
          {state === "error" && (
            <p className="mt-2 text-xs" style={{ color: "#b0698a" }}>
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function TryBrane() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([{ id: nextId++, name: "", text: "" }]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [provider, setProvider] = useState<string>("");
  const [limits, setLimits] = useState<Limits | null>(null);
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/try")
      .then((r) => r.json())
      .then((d: { providers: ProviderOption[]; limits: Limits }) => {
        setProviders(d.providers ?? []);
        setLimits(d.limits ?? null);
        const firstReal = (d.providers ?? []).find((p) => p.real) ?? d.providers?.[0];
        if (firstReal) setProvider(firstReal.id);
      })
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log]);

  const filled = drafts.filter((d) => d.text.trim().length > 0);
  const totalChars = filled.reduce((a, d) => a + d.text.length, 0);
  const overBudget = limits ? totalChars > limits.maxTotalChars : false;
  const canRun = filled.length > 0 && !running && !overBudget && provider !== "";

  const addDraft = () =>
    setDrafts((d) =>
      d.length >= (limits?.maxSources ?? 8) ? d : [...d, { id: nextId++, name: "", text: "" }],
    );

  const readFiles = useCallback(
    async (files: FileList | File[]) => {
      const incoming: Draft[] = [];
      for (const file of Array.from(files).slice(0, limits?.maxSources ?? 8)) {
        const text = await file.text();
        if (!text.trim()) continue;
        incoming.push({ id: nextId++, name: file.name, text });
      }
      if (incoming.length === 0) return;
      setDrafts((d) => {
        // Drop the untouched starter row rather than leaving an empty card
        // above the files the reader just dropped in.
        const kept = d.filter((x) => x.text.trim().length > 0);
        return [...kept, ...incoming].slice(0, limits?.maxSources ?? 8);
      });
    },
    [limits],
  );

  async function run() {
    setRunning(true);
    setFatal(null);
    setLog([{ kind: "info", text: "대화를 읽는 중…" }]);

    try {
      const res = await fetch("/api/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          label: label.trim() || undefined,
          email: email.trim() || undefined,
          sources: filled.map((d, i) => ({
            name: d.name || `conversation-${i + 1}.md`,
            text: d.text,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "요청에 실패했습니다." }));
        setFatal(err.error ?? "요청에 실패했습니다.");
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // NDJSON: one JSON object per line. A chunk can split a line in half, so
      // the tail stays in the buffer until its newline arrives.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          handleEvent(ev);
        }
      }
    } catch (err) {
      setFatal(`연결이 끊겼습니다: ${String(err)}`);
      setRunning(false);
    }
  }

  function handleEvent(ev: Record<string, unknown>) {
    const type = ev.type as string;
    if (type === "source_start") {
      const i = (ev.index as number) + 1;
      setLog((l) => [
        ...l,
        { kind: "info", text: `[${i}/${ev.total}] ${ev.source} — 무엇이 남을지 판단하는 중…` },
      ]);
    } else if (type === "planned") {
      const concepts = (ev.concepts as { title: string }[]) ?? [];
      setLog((l) => [
        ...l,
        {
          kind: "plan",
          text:
            concepts.length === 0
              ? "남길 만한 개념 없음 — 일회성 내용으로 판단"
              : `개념 ${concepts.length}개 발견 — 파일로 쓰는 중`,
        },
      ]);
    } else if (type === "concept") {
      setLog((l) => [
        ...l,
        {
          kind: "concept",
          title: ev.title as string,
          path: ev.relPath as string,
          judgment: ev.judgment as string,
        },
      ]);
    } else if (type === "question") {
      setLog((l) => [
        ...l,
        { kind: "question", text: `${ev.concept} — ${ev.report}` },
      ]);
    } else if (type === "note") {
      setLog((l) => [...l, { kind: "info", text: ev.message as string }]);
    } else if (type === "error") {
      setLog((l) => [...l, { kind: "error", text: ev.message as string }]);
      setFatal(ev.message as string);
      setRunning(false);
    } else if (type === "done") {
      if (ev.empty) {
        setFatal(ev.message as string);
        setRunning(false);
        return;
      }
      router.push(`/b/${ev.token as string}`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <header className="mb-10">
        <p
          className="mb-3 font-mono text-xs uppercase tracking-[0.16em]"
          style={{ color: "var(--text-muted)" }}
        >
          brane
        </p>
        <h1
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ color: "var(--text-primary)" }}
        >
          네 대화를 두뇌로
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          ChatGPT·Claude·Gemini에서 나눈 대화를 넣으면, 일회성 잡담은 버리고 남을 것만 골라
          마크다운 개념 파일로 소화합니다. 끝나면 다른 AI가 읽을 수 있는 주소가 나옵니다 —
          <span style={{ color: "var(--text-primary)" }}> 오늘 Claude에게 말한 걸 내일 ChatGPT가 압니다.</span>
        </p>
      </header>

      {!running && (
        <>
          <div
            className="mb-4 rounded-lg border border-dashed p-5 text-center text-sm"
            style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void readFiles(e.dataTransfer.files);
            }}
          >
            대화 파일(.md, .txt)을 여기로 끌어다 놓거나, 아래에 그대로 붙여넣으세요.
            <label className="ml-2 cursor-pointer underline" style={{ color: "var(--accent-text)" }}>
              파일 선택
              <input
                type="file"
                multiple
                accept=".md,.txt,.json"
                className="hidden"
                onChange={(e) => e.target.files && void readFiles(e.target.files)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {drafts.map((d, i) => (
              <div
                key={d.id}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <input
                    value={d.name}
                    onChange={(e) =>
                      setDrafts((all) =>
                        all.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    placeholder={`대화 ${i + 1} 제목 (선택)`}
                    className="flex-1 bg-transparent font-mono text-xs outline-none"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {d.text.length.toLocaleString()}자
                  </span>
                  {drafts.length > 1 && (
                    <button
                      onClick={() => setDrafts((all) => all.filter((x) => x.id !== d.id))}
                      className="px-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="이 대화 제거"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <textarea
                  value={d.text}
                  onChange={(e) =>
                    setDrafts((all) =>
                      all.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)),
                    )
                  }
                  rows={d.text ? 6 : 4}
                  placeholder="대화 내용을 붙여넣으세요…"
                  className="w-full resize-y bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={addDraft}
              disabled={drafts.length >= (limits?.maxSources ?? 8)}
              className="rounded border px-3 py-1.5 text-xs disabled:opacity-40"
              style={{ borderColor: "var(--panel-border)", color: "var(--text-secondary)" }}
            >
              + 대화 추가
            </button>
            <span className="font-mono text-[11px]" style={{ color: overBudget ? "#b0698a" : "var(--text-muted)" }}>
              {totalChars.toLocaleString()}
              {limits ? ` / ${limits.maxTotalChars.toLocaleString()}자` : ""}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                소화할 모델
              </span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="rounded border px-2 py-1.5 text-sm"
                style={{
                  borderColor: "var(--panel-border)",
                  background: "var(--panel-bg)",
                  color: "var(--text-primary)",
                }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                모델은 교체 가능한 부품입니다. 원하는 걸 고르세요.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                이름 (선택)
              </span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="내 brane"
                className="rounded border px-2 py-1.5 text-sm"
                style={{
                  borderColor: "var(--panel-border)",
                  background: "var(--panel-bg)",
                  color: "var(--text-primary)",
                }}
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                이메일 (선택 — 링크 복구용)
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded border px-2 py-1.5 text-sm"
                style={{
                  borderColor: "var(--panel-border)",
                  background: "var(--panel-bg)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                계정은 만들지 않습니다. 링크를 잃어버렸을 때 다시 보내는 용도로만 씁니다.
                {limits ? ` 저장된 brane은 ${limits.retentionDays}일 뒤 자동 삭제됩니다.` : ""}
              </span>
            </label>
          </div>

          <button
            onClick={() => void run()}
            disabled={!canRun}
            className="mt-8 w-full rounded-lg px-4 py-3 text-sm font-medium transition disabled:opacity-40"
            style={{ background: "var(--brane-accent)", color: "#fff" }}
          >
            내 brane 만들기
          </button>

          <RecoverLink />
        </>
      )}

      {(running || log.length > 0) && (
        <div
          className="mt-8 rounded-lg border p-4"
          style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            {running && (
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full"
                style={{ background: "var(--brane-accent)" }}
              />
            )}
            <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {running ? "소화 중" : "중단됨"}
            </span>
          </div>

          <ol className="flex flex-col gap-2">
            {log.map((line, i) => (
              <li key={i} className="text-sm leading-relaxed">
                {line.kind === "concept" ? (
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{
                        color: JUDGMENT_TONE[line.judgment] ?? "var(--text-muted)",
                        background: `${JUDGMENT_TONE[line.judgment] ?? "#71717a"}22`,
                      }}
                    >
                      {line.judgment}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>{line.title}</span>
                    <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {line.path}
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      color:
                        line.kind === "error"
                          ? "#b0698a"
                          : line.kind === "question"
                            ? "#c9973f"
                            : line.kind === "plan"
                              ? "var(--text-secondary)"
                              : "var(--text-muted)",
                    }}
                  >
                    {line.kind === "question" ? "? " : ""}
                    {line.text}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div ref={logEndRef} />
        </div>
      )}

      {fatal && (
        <div
          className="mt-4 rounded-lg border p-4 text-sm"
          style={{ borderColor: "#b0698a55", color: "var(--text-secondary)" }}
        >
          {fatal}
          <button
            onClick={() => {
              setFatal(null);
              setLog([]);
            }}
            className="ml-3 underline"
            style={{ color: "var(--accent-text)" }}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
