"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import GraphErrorBoundary from "./GraphErrorBoundary";
import { colorFor, iconFor } from "@/lib/graphColors";

const BrainGraph3D = dynamic(() => import("./BrainGraph3D"), { ssr: false });
const BrainGraph = dynamic(() => import("./BrainGraph"), { ssr: false });

// What a visitor gets back. The order on this page is an argument:
//
//   1. the MCP address, because "your other AI can read this now" is the
//      thing that makes brane different from a summarizer,
//   2. the concepts, because the reader needs to see it got their life right,
//   3. take it and destroy it, because that's what makes storing it honest.

interface Concept {
  relPath: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  timestamp: string;
  content: string;
}

interface Payload {
  label: string;
  createdAt: string;
  expiresAt: string;
  provider: string;
  hasEmail: boolean;
  sources: { name: string; chars: number }[];
  concepts: Concept[];
  graph: { nodes: { id: string; title: string; category: string; hasConflict: boolean; contentLength: number }[]; links: { source: string; target: string }[] };
}

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function BraneResult({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // origin is read here rather than at render time because the server pass
    // has no window, and it's set inside the async callback so the effect body
    // itself stays free of synchronous state updates.
    fetch(`/api/brane/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "불러오지 못했습니다.");
        return r.json();
      })
      .then((payload: Payload) => {
        setOrigin(window.location.origin);
        setData(payload);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  const mcpUrl = origin ? `${origin}/api/mcp/${token}` : "";

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  async function destroy() {
    const res = await fetch(`/api/brane/${token}`, { method: "DELETE" });
    if (res.ok) router.push("/try");
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        <a href="/try" className="mt-4 inline-block underline" style={{ color: "var(--accent-text)" }}>
          새로 만들기
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center" style={{ color: "var(--text-muted)" }}>
        불러오는 중…
      </div>
    );
  }

  const remaining = daysLeft(data.expiresAt);
  const current = data.concepts.find((c) => c.relPath === selected) ?? null;

  const clientConfig = JSON.stringify(
    { mcpServers: { brane: { url: mcpUrl } } },
    null,
    2,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      <header className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
          your brane
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          {data.label}
        </h1>
        <p className="mt-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          개념 {data.concepts.length}개 · 원본 {data.sources.length}개 · {data.provider}로 소화 ·{" "}
          {remaining}일 후 자동 삭제
        </p>
      </header>

      {/* 1. The connection. */}
      <section
        className="mb-8 rounded-xl border p-5"
        style={{ borderColor: "var(--accent-line, var(--panel-border))", background: "var(--panel-bg)" }}
      >
        <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          다른 AI에 연결하기
        </h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          이 주소를 MCP 커넥터로 등록하면, Claude·ChatGPT·Cursor가 이 brane을 읽습니다.
          <span style={{ color: "var(--text-primary)" }}> &ldquo;어제 우리 마지막에 뭐 했지?&rdquo;라고 물어보세요.</span>
        </p>

        <div className="mt-3 flex items-stretch gap-2">
          <code
            className="flex-1 overflow-x-auto whitespace-nowrap rounded border px-3 py-2 font-mono text-xs"
            style={{
              borderColor: "var(--panel-border)",
              background: "var(--hover-bg)",
              color: "var(--text-primary)",
            }}
          >
            {mcpUrl || "…"}
          </code>
          <button
            onClick={() => void copy(mcpUrl, "url")}
            className="shrink-0 rounded px-3 py-2 text-xs font-medium"
            style={{ background: "var(--brane-accent)", color: "#fff" }}
          >
            {copied === "url" ? "복사됨" : "복사"}
          </button>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-xs" style={{ color: "var(--accent-text)" }}>
            클라이언트별 등록 방법
          </summary>
          <div className="mt-3 flex flex-col gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <p>
              <b style={{ color: "var(--text-primary)" }}>Claude · ChatGPT</b> — 설정 → 커넥터 →
              커스텀 커넥터 추가에 위 주소를 붙여넣습니다.
            </p>
            <div>
              <p className="mb-1">
                <b style={{ color: "var(--text-primary)" }}>Cursor · Claude Code</b> — MCP 설정 파일에:
              </p>
              <pre
                className="overflow-x-auto rounded border p-2 font-mono text-[11px]"
                style={{ borderColor: "var(--panel-border)", background: "var(--hover-bg)" }}
              >
                {clientConfig}
              </pre>
              <button
                onClick={() => void copy(clientConfig, "cfg")}
                className="mt-1 underline"
                style={{ color: "var(--accent-text)" }}
              >
                {copied === "cfg" ? "복사됨" : "설정 복사"}
              </button>
            </div>
            <p style={{ color: "var(--text-muted)" }}>
              이 주소를 아는 사람은 누구나 이 brane을 읽을 수 있습니다. 링크 자체가 열쇠이니
              공유에 주의하세요.
            </p>
          </div>
        </details>
      </section>

      {/* 2. What it made. */}
      {data.graph.nodes.length > 0 && (
        <section className="mb-8">
          <div
            className="h-[300px] overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <GraphErrorBoundary
              fallback={<BrainGraph onSelect={setSelected} graph={data.graph} focusRelPath={selected} />}
            >
              <BrainGraph3D onSelect={setSelected} graph={data.graph} focusRelPath={selected} />
            </GraphErrorBoundary>
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          소화된 개념
        </h2>
        <ul className="flex flex-col gap-2">
          {data.concepts.map((c) => (
            <li key={c.relPath}>
              <button
                onClick={() => setSelected(selected === c.relPath ? null : c.relPath)}
                className="w-full rounded-lg border p-3 text-left transition"
                style={{
                  borderColor: selected === c.relPath ? colorFor(c.category) : "var(--panel-border)",
                  background: "var(--panel-bg)",
                }}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span aria-hidden>{iconFor(c.category)}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {c.title}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {c.relPath}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {c.description}
                  </p>
                )}
              </button>
              {selected === c.relPath && current && (
                <pre
                  className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg border p-3 text-xs leading-relaxed"
                  style={{
                    borderColor: "var(--panel-border)",
                    background: "var(--hover-bg)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {current.content}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Take it, or destroy it. */}
      <section
        className="rounded-xl border p-5"
        style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
      >
        <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          이건 당신 것입니다
        </h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          zip에는 <code className="font-mono">bundle/</code>(소화된 개념)과{" "}
          <code className="font-mono">archive/</code>(원본 대화)가 함께 들어갑니다 — 모든 인용이
          오프라인에서도 그대로 열립니다. 내려받은 파일은 만료되지 않습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/brane/${token}?format=zip`}
            className="rounded border px-3 py-2 text-xs font-medium"
            style={{ borderColor: "var(--panel-border)", color: "var(--text-primary)" }}
          >
            zip으로 내려받기
          </a>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded border px-3 py-2 text-xs"
              style={{ borderColor: "var(--panel-border)", color: "var(--text-muted)" }}
            >
              지금 삭제
            </button>
          ) : (
            <span className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              되돌릴 수 없습니다.
              <button
                onClick={() => void destroy()}
                className="rounded px-3 py-2 text-xs font-medium"
                style={{ background: "#b0698a", color: "#fff" }}
              >
                영구 삭제
              </button>
              <button onClick={() => setConfirmDelete(false)} className="underline" style={{ color: "var(--text-muted)" }}>
                취소
              </button>
            </span>
          )}
        </div>
      </section>

      <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        {data.hasEmail
          ? "이 링크는 등록한 이메일로 다시 받을 수 있습니다."
          : "이 링크를 저장해두세요 — 계정이 없어서 잃어버리면 복구할 수 없습니다."}
      </p>
    </div>
  );
}
