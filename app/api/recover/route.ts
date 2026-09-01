import { NextRequest, NextResponse } from "next/server";
import { getStore, normalizeEmail } from "@/lib/store";

// "Send me my link again."
//
// The security shape matters more than the feature. An endpoint that takes an
// email and returns the tokens registered to it would mean anyone who knows
// your email address owns your brane — the token is the entire credential, so
// handing it to an unauthenticated caller is handing over the brane. So the
// links only ever leave through the mailbox itself, and the response is
// identical whether or not the address is known.

export const maxDuration = 30;

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 3;
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
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

function baseUrl(req: NextRequest): string {
  return (
    process.env.BRANE_PUBLIC_ORIGIN ??
    req.nextUrl.origin ??
    "https://brane.my"
  );
}

async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.BRANE_MAIL_FROM;
  if (!key || !from) {
    // Not configured. In development that's expected and the link is logged
    // to the server console; in production it's a real failure and the caller
    // is told the feature is unavailable rather than being left waiting for
    // mail that will never arrive.
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[recover] would email ${to}:\n${text}\n`);
      return true;
    }
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) {
    console.error(`[recover] mail send failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!email.includes("@") || email.length > 200) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  // Deliberately uniform: the same reply for a known and an unknown address,
  // so this can't be used to test whether someone has a brane here.
  const uniform = NextResponse.json({
    ok: true,
    message: "등록된 주소라면 링크를 보냈습니다. 메일함을 확인해주세요.",
  });

  const store = getStore();
  const tokens = await store.tokensForEmail(email);
  if (tokens.length === 0) return uniform;

  const live: { label: string; url: string; mcp: string; expiresAt: string }[] = [];
  for (const token of tokens) {
    const snapshot = await store.get(token);
    if (!snapshot) continue; // expired and swept
    live.push({
      label: snapshot.label,
      url: `${baseUrl(req)}/b/${token}`,
      mcp: `${baseUrl(req)}/api/mcp/${token}`,
      expiresAt: snapshot.expiresAt,
    });
  }
  if (live.length === 0) return uniform;

  const text = [
    "당신의 brane 링크입니다.",
    "",
    ...live.flatMap((b) => [
      `## ${b.label}`,
      `열기:      ${b.url}`,
      `MCP 주소:  ${b.mcp}`,
      `만료:      ${b.expiresAt.slice(0, 10)}`,
      "",
    ]),
    "이 링크를 아는 사람은 누구나 이 brane을 읽을 수 있습니다 — 공유에 주의하세요.",
    "만료 전에 zip으로 내려받으면 그 파일은 만료되지 않습니다.",
    "",
    "brane — https://brane.my",
  ].join("\n");

  const sent = await sendMail(email, "brane 링크", text);
  if (!sent) {
    return NextResponse.json(
      { error: "지금은 메일을 보낼 수 없습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }
  return uniform;
}
