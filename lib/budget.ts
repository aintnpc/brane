// The spend ceiling, and what happens when it's reached.
//
// The competition rule this exists for is blunt: if the submitted link does
// not work during judging, the entry is not evaluated. That makes "the demo
// returned an error" and "the demo was too popular" the same outcome, which
// is the worst possible way to lose.
//
// So the ceiling never produces an error. When the day's budget is spent, a
// visitor is handed a real brane — one the engine actually produced, frozen
// as a fixture — with an honest note about why it isn't theirs. The link
// stays alive, the product still demonstrates itself, and the bill stops.

import fs from "fs";
import path from "path";
import { BraneSnapshot, Store } from "./store";

/** Reserved token. Always resolvable, never expires, cannot be deleted. */
export const SAMPLE_TOKEN = "sample";

const DEFAULT_DAILY_RUNS = 300;

export function dailyRunLimit(): number {
  const raw = Number(process.env.BRANE_DAILY_RUN_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_RUNS;
}

let cachedSample: BraneSnapshot | null = null;

/**
 * The fallback brane.
 *
 * Genuinely engine-produced — two chess conversations digested into one
 * concept, citations intact — then frozen. Showing hand-written filler on a
 * page that claims to digest conversations would be a lie told at exactly the
 * moment someone is evaluating whether the claim is true.
 */
export function sampleSnapshot(): BraneSnapshot {
  if (cachedSample) return cachedSample;
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "lib", "sample-brane.json"), "utf-8"),
  ) as Pick<BraneSnapshot, "label" | "provider" | "concepts" | "sources">;

  const now = new Date().toISOString();
  cachedSample = {
    token: SAMPLE_TOKEN,
    createdAt: now,
    updatedAt: now,
    // Far enough out that isExpired() never trips on it.
    expiresAt: new Date(Date.now() + 3650 * 86_400_000).toISOString(),
    label: raw.label,
    provider: raw.provider,
    concepts: raw.concepts,
    sources: raw.sources,
  };
  return cachedSample;
}

export interface BudgetVerdict {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Claim one run against today's budget.
 *
 * Counts every attempt, including ones that later fail — a failed run still
 * spent tokens on the calls it made before dying, and a ceiling that only
 * counted successes could be walked straight through by a broken provider.
 *
 * A store that cannot be reached fails OPEN. Losing the counter should
 * degrade cost control, not take the endpoint down; the per-IP limiter is
 * still in front of it.
 */
export async function claimRun(store: Store): Promise<BudgetVerdict> {
  const limit = dailyRunLimit();
  const day = new Date().toISOString().slice(0, 10);
  try {
    const used = await store.incr(`runs:${day}`, 36 * 60 * 60);
    return { allowed: used <= limit, used, limit };
  } catch (err) {
    console.error("[budget] counter unavailable, allowing run:", err);
    return { allowed: true, used: 0, limit };
  }
}

/**
 * Look up a brane, transparently serving the reserved sample token.
 *
 * Lives here rather than inside the Store so the fixture stays out of the
 * persistence layer — the sample is a product decision about what to show
 * when the budget runs out, not a row that happens to be in the database.
 */
export async function resolveSnapshot(
  store: Store,
  token: string,
): Promise<BraneSnapshot | null> {
  if (token === SAMPLE_TOKEN) return sampleSnapshot();
  return store.get(token);
}

export function isSample(token: string): boolean {
  return token === SAMPLE_TOKEN;
}
