import { NextRequest, NextResponse } from "next/server";
import { ingestCore, SourceDoc, IngestEvent, parseConcept } from "@/lib/ingest-core";
import { buildGraphFrom } from "@/lib/graph";
import { getProvider, providerMenu, classifyError } from "@/lib/llm";
import {
  getStore,
  newToken,
  expiryFrom,
  capSnapshot,
  normalizeEmail,
  BraneSnapshot,
  RETENTION_DAYS,
} from "@/lib/store";

// The visitor path: drop in your own conversations, watch a brane get built
// one concept at a time, walk away with an MCP endpoint your other AI can read.
//
// Streams NDJSON rather than answering once at the end. That is a product
// decision, not a technical one — digestion takes tens of seconds, and a
// progress bar that only knows "working" feels broken, while a list that grows
// a line at a time feels like something is thinking. The engine already emits
// per-concept events; this just forwards them.

export const maxDuration = 300;

// Bounds. These exist because this endpoint is open on a public domain and
// every call spends someone's inference budget.
const MAX_SOURCES = 8;
const MAX_CHARS_PER_SOURCE = 60_000;
const MAX_TOTAL_CHARS = 200_000;
const MAX_LABEL = 80;

// Per-instance and therefore approximate — serverless spreads requests around,
// so this converts an unbounded bill into a bounded one per instance rather
// than enforcing a true global cap. Good enough to stop a scraper; not good
// enough for the judging window, where the daily ceiling needs to live in the
// shared store before the link goes public.
const WINDOW_MS = 60_000;
const MAX_RUNS_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_RUNS_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET() {
  // What the upload screen needs to render itself: which models this
  // deployment can actually offer, and what the limits are.
  return NextResponse.json({
    providers: providerMenu().filter((p) => p.real || process.env.NODE_ENV !== "production"),
    limits: {
      maxSources: MAX_SOURCES,
      maxCharsPerSource: MAX_CHARS_PER_SOURCE,
      maxTotalChars: MAX_TOTAL_CHARS,
      retentionDays: RETENTION_DAYS,
    },
  });
}

interface TryRequest {
  sources?: { name?: string; text?: string }[];
  provider?: string;
  label?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  let body: TryRequest;
  try {
    body = (await req.json()) as TryRequest;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const raw = Array.isArray(body.sources) ? body.sources : [];
  if (raw.length === 0) {
    return NextResponse.json({ error: "대화를 하나 이상 넣어주세요." }, { status: 400 });
  }
  if (raw.length > MAX_SOURCES) {
    return NextResponse.json(
      { error: `한 번에 최대 ${MAX_SOURCES}개까지 처리합니다.` },
      { status: 400 },
    );
  }

  const sources: SourceDoc[] = [];
  let total = 0;
  for (let i = 0; i < raw.length; i++) {
    const text = typeof raw[i].text === "string" ? raw[i].text!.trim() : "";
    if (!text) continue;
    if (text.length > MAX_CHARS_PER_SOURCE) {
      return NextResponse.json(
        { error: `대화 하나가 너무 깁니다 (최대 ${MAX_CHARS_PER_SOURCE.toLocaleString()}자).` },
        { status: 400 },
      );
    }
    total += text.length;
    if (total > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: `전체 분량이 너무 큽니다 (최대 ${MAX_TOTAL_CHARS.toLocaleString()}자).` },
        { status: 400 },
      );
    }
    // Sanitize the name: it becomes a filename in the downloadable bundle and
    // the target of every `^[archive/...]` citation.
    const safeName =
      (typeof raw[i].name === "string" ? raw[i].name! : "")
        .replace(/[^\w가-힣.\- ]/g, "")
        .slice(0, 80) || `conversation-${i + 1}.md`;
    sources.push({ name: safeName.endsWith(".md") ? safeName : `${safeName}.md`, text });
  }

  if (sources.length === 0) {
    return NextResponse.json({ error: "내용이 있는 대화가 없습니다." }, { status: 400 });
  }

  if (rateLimited(clientKey(req))) {
    return NextResponse.json(
      { error: `잠시 후 다시 시도해주세요 (분당 ${MAX_RUNS_PER_WINDOW}회 제한).` },
      { status: 429 },
    );
  }

  let provider;
  try {
    provider = getProvider(body.provider);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }

  const email = typeof body.email === "string" && body.email.includes("@")
    ? normalizeEmail(body.email).slice(0, 200)
    : undefined;
  const label =
    (typeof body.label === "string" ? body.label.trim() : "").slice(0, MAX_LABEL) ||
    `brane ${new Date().toISOString().slice(0, 10)}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "start", provider: provider.id, sources: sources.length });

      try {
        const result = await ingestCore({
          sources,
          existingConcepts: [], // a first-time visitor starts from nothing
          provider,
          onEvent: (e: IngestEvent) => send(e),
        });

        const concepts = [...result.files.entries()].map(([relPath, rawText]) => ({
          relPath,
          raw: rawText,
        }));

        if (concepts.length === 0) {
          send({
            type: "done",
            empty: true,
            message:
              "durable한 개념이 나오지 않았습니다 — 올린 대화가 대부분 일회성 내용이라는 뜻입니다. " +
              "결정이나 방향이 담긴 대화를 넣어보세요.",
            usage: result.usage,
          });
          controller.close();
          return;
        }

        const records = concepts.map((c) => parseConcept(c.relPath, c.raw));
        const graph = buildGraphFrom(records);

        const now = new Date();
        const snapshot: BraneSnapshot = capSnapshot({
          token: newToken(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: expiryFrom(now),
          email,
          label,
          provider: provider.id,
          concepts,
          sources,
        });

        await getStore().put(snapshot);

        send({
          type: "done",
          token: snapshot.token,
          label: snapshot.label,
          expiresAt: snapshot.expiresAt,
          retentionDays: RETENTION_DAYS,
          emailSaved: Boolean(email),
          provider: provider.id,
          usage: result.usage,
          questions: result.questions,
          trace: result.trace,
          graph,
          concepts: records.map((r) => ({
            relPath: r.relPath,
            title: r.title,
            description: r.description,
            category: r.category,
            tags: r.tags,
            chars: r.content.length,
          })),
        });
      } catch (err) {
        // The stream has already started, so this can't become an HTTP status.
        // Say which failure it was — a visitor who hits a dead free-tier quota
        // should be told that, not shown a generic "something went wrong".
        const kind = classifyError(err);
        send({
          type: "error",
          kind,
          message:
            kind === "credit" || kind === "rate_limit"
              ? "지금 이 모델의 사용량 한도에 걸렸습니다. 다른 모델을 선택하거나 잠시 후 다시 시도해주세요."
              : kind === "auth"
                ? "모델 인증에 실패했습니다. 서버 설정 문제입니다."
                : "소화 중 오류가 발생했습니다.",
          detail: process.env.NODE_ENV === "production" ? undefined : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no", // don't let a proxy defeat the point of streaming
    },
  });
}
