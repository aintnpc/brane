// The single gate between "what's on disk" and "what a request can reach".
//
// brane's data dir is a personal ledger — diaries going back to 2022, a life
// plan, relationship notes, raw agent sessions that occasionally contain a
// pasted email signature with a phone number in it. Almost none of that is
// meant for strangers, but the app is deployed on a public domain with no auth.
//
// So this module fails CLOSED: a path is private unless it is named here.
// That matters specifically because the write path (/api/ingest) creates new
// bundle files on its own schedule — a category-based rule like "ventures/* is
// public" would silently publish whatever tomorrow's auto-ingest decides to
// file under a public category. An explicit list can't do that.

/** Bundle concepts a stranger may read, by relPath. Everything else is private. */
const PUBLIC_CONCEPTS: ReadonlySet<string> = new Set([
  // The ventures shown on the portfolio. pegasus and hyre are deliberately not
  // here: the résumé dropped them, and a ledger that still serves them puts them
  // back in the graph and in /api/ask answers, which is where they kept
  // reappearing after being cut from the page.
  "ventures/brane.md", // may not exist; harmless if absent
  "ventures/clozet.md",
  "ventures/green-apple.md",
  "ventures/share2dm.md",
  "ventures/playit.md",
  "ventures/befficient.md",
  // The work itself, written as ledger documents so the ask path can reach it.
  // lib/cases.ts renders these on the page; without them in the ledger, /api/ask
  // answered questions about the settlement work by saying there was no record.
  "work/clozet-settlement.md",
  "work/share2dm-queue.md",
  "work/green-apple-prescription.md",
  // How the work gets done.
  "architecture/brane.md",
  "playbooks/sales-activation-method.md",
  "playbooks/bottleneck-relay-investing-framework.md",
  "playbooks/idea-backlog.md",
  "playbooks/brane-paper-and-conference.md",
  // The AI-usage evidence trail. This one is the point of the whole portfolio.
  "identity/ai-native-workflow.md",
]);

// Deliberately NOT public, for the record, so nobody re-adds them by accident:
//   personal/gate-illusion-pattern.md      — self-diagnosis
//   notes/relationship-loneliness-pattern.md, notes/lifestyle-taste.md,
//   notes/worldview-money-markets.md, notes/intangible-asset-selling-psychology.md
//   identity/founder.md                    — quoted in the portfolio, not served raw
//   identity/life-plan.md, identity/korea-reform-vision.md
//   roadmap/*                              — includes the 편입 exam plan

/**
 * Archive sources a stranger may open, by bare filename.
 *
 * The 2025 coursework sessions used to be here — they were the only openable
 * citations for a while, which made the record's verifiable half its weakest
 * half. Agent sessions carry the claims worth checking now.
 *
 * NOT derived from "is it cited by a public concept" — that rule is what put a
 * personal phone number (archive/2026-07-21-mybrane-io-prd-hyre.md, cited by
 * architecture/brane.md) and a ChatGPT profile dump (2026-06-03-사용자-정보-요약.md,
 * cited by ventures/pegasus.md) on the public internet. Citation reachability is
 * not a privacy boundary.
 *
 * These 12 are the coursework sessions behind identity/ai-native-workflow.md's
 * claims about verification habits. Each is 161B–2.9KB and has been read in full.
 */
const PUBLIC_ARCHIVE: ReadonlySet<string> = new Set([
  // 2026 — the agent-orchestration claim, in his own prompts.
  "2026-07-14-현재-brix-폴더를-분석한-결과-앱-코드-apps-packages-는-이미-모노레포.md",
]);

/**
 * Whether this process may serve private files.
 *
 * Two independent conditions, both required. The env var alone would be a
 * footgun — one stray Vercel environment variable and the whole ledger is
 * public again — so production can never opt in regardless of how it's
 * configured.
 */
export function privateAccessAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.BRANE_ALLOW_PRIVATE === "1";
}

export function isPublicConcept(relPath: string): boolean {
  return PUBLIC_CONCEPTS.has(relPath);
}

/** Accepts either "archive/foo.md" (as it appears in a `^[...]` tag) or "foo.md". */
export function isPublicArchive(archiveRelPath: string): boolean {
  return PUBLIC_ARCHIVE.has(archiveRelPath.replace(/^archive\//, ""));
}

export function publicConceptCount(): number {
  return PUBLIC_CONCEPTS.size;
}
