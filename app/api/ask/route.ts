import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/load";

// This endpoint is open on a public domain and every call bills Anthropic
// tokens, so it needs a ceiling that isn't "nobody finds it". The limiter is
// per-instance and in-memory — serverless spreads requests across instances, so
// it can't be exact — but it turns an unbounded bill into a bounded one per
// instance, which is the difference that matters. A real fix (KV/Durable
// Object) can come when there's traffic worth spending on.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const MAX_QUERY_CHARS = 400;

const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_CHARS) {
    return NextResponse.json(
      { error: `질문이 너무 깁니다 (최대 ${MAX_QUERY_CHARS}자)` },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요 (분당 6회 제한)" },
      { status: 429 },
    );
  }

  try {
    const result = await ask(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const msg = String(err);
    // Billing and quota failures aren't the reader's problem and aren't a bug in
    // the query — say the feature is unavailable rather than leaking the reason.
    const unavailable =
      msg.includes("credit balance") ||
      msg.includes("rate_limit") ||
      msg.includes("authentication_error") ||
      msg.includes("overloaded");
    if (unavailable) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "brane read-path failed", detail: msg },
      { status: 500 },
    );
  }
}
