// Copies exactly the allowlisted slice of the brane ledger into public-data/,
// which is what gets committed and deployed.
//
// Before this, the whole private ledger — 1,082 personal logs — was shipped to
// the serverless function as a git submodule, and lib/visibility.ts was the only
// thing standing between it and a public request. That's one bug away from a
// leak, and it also broke the deploy outright: my-brane is private, Vercel
// couldn't clone the submodule, and the build silently produced an app with no
// data at all.
//
// Shipping only the public files fixes both. The private data never leaves the
// author's machine, and there is nothing for a future routing mistake to expose.
//
// Run from app/:  BRANE_DATA_DIR=/Users/jw/brane node scripts/sync-public-data.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = process.env.BRANE_DATA_DIR;
if (!SRC) {
  console.error("BRANE_DATA_DIR is required (path to the brane ledger).");
  process.exit(1);
}

// Parse the allowlists straight out of visibility.ts so there is exactly one
// place to edit. A second hand-maintained list here would drift, and the
// direction it drifts is "publishes something nobody meant to publish".
const vis = fs.readFileSync(path.join(APP_DIR, "lib/visibility.ts"), "utf-8");
function parseSet(name) {
  const m = vis.match(new RegExp(`const ${name}[^=]*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) throw new Error(`could not find ${name} in lib/visibility.ts`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}
const concepts = parseSet("PUBLIC_CONCEPTS");
const archives = parseSet("PUBLIC_ARCHIVE");

const OUT = path.join(APP_DIR, "public-data");
fs.rmSync(OUT, { recursive: true, force: true });

let copied = 0;
const missing = [];
function copy(relFrom, relTo) {
  const from = path.join(SRC, relFrom);
  if (!fs.existsSync(from)) { missing.push(relFrom); return; }
  const to = path.join(OUT, relTo);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied++;
}
for (const rel of concepts) copy(path.join("bundle", rel), path.join("bundle", rel));
for (const f of archives) copy(path.join("archive", f), path.join("archive", f));

console.log(`public-data/: ${copied} files (concepts ${concepts.length}, archive ${archives.length})`);
if (missing.length) {
  // Not fatal — PUBLIC_CONCEPTS lists a couple of paths defensively — but it
  // should be visible rather than silently producing a thinner site.
  console.log(`허용 목록에 있으나 원본에 없음 (${missing.length}): ${missing.join(", ")}`);
}
