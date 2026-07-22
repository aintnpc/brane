import fs from "fs";
import path from "path";
import { listConcepts, getArchiveSource, ARCHIVE_DIR, type ConceptFile } from "./bundle";

// Rough, documented heuristic — Korean/English mixed content tokenizes at
// roughly 2.5 chars/token on Claude's tokenizer (see dev_log cost estimate
// from earlier this session). This is an estimate for *this diagnostic
// tool only*; real per-call token counts (once API credits exist) come
// from `response.usage`, not this function.
const CHARS_PER_TOKEN_ESTIMATE = 2.5;
function estimateTokens(text: string): number {
  return Math.round(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

// No-API-call concept selection: score by keyword overlap against
// frontmatter only (title/description/tags), same fields /load's real
// selector would scan. Lets this diagnostic run before credits exist —
// the real `/api/ask` still uses the LLM selector for actual answers.
function selectByKeyword(query: string, concepts: ConceptFile[], limit = 5): ConceptFile[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = concepts.map((c) => {
    const haystack = `${c.title} ${c.description} ${c.tags.join(" ")}`.toLowerCase();
    const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
    return { concept: c, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.concept);
}

// Every `^[archive/a.md, archive/b.md]` footnote in a concept's body,
// deduped, resolved to real archive files.
function citedArchiveRefs(content: string): string[] {
  const refs = new Set<string>();
  const re = /\^\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    for (const raw of m[1].split(",")) {
      const ref = raw.trim();
      if (ref.startsWith("archive/")) refs.add(ref);
    }
  }
  return Array.from(refs);
}

export interface ProvenanceNode {
  ref: string; // "archive/2026-...md"
  chars: number;
  tokensEst: number;
  exists: boolean;
}

export interface ConceptTrace {
  relPath: string;
  title: string;
  bundleChars: number;
  bundleTokensEst: number;
  citedArchive: ProvenanceNode[];
}

export interface ContextCostComparison {
  query: string;
  selectedConcepts: ConceptTrace[];
  digested: { tokensEst: number; fileCount: number };
  raw: { tokensEst: number; fileCount: number };
  compressionRatio: number; // raw / digested
}

// The actual comparison: for the concepts /load would pick, how many
// tokens does the digested bundle cost vs. the raw archive material those
// same concepts are built from? Same underlying sources, two
// representations — this isolates the compaction effect from everything
// else (model choice, prompt overhead, etc).
export function compareContextCost(query: string): ContextCostComparison {
  const concepts = listConcepts();
  const selected = selectByKeyword(query, concepts);

  const selectedConcepts: ConceptTrace[] = selected.map((c) => {
    const refs = citedArchiveRefs(c.content);
    const citedArchive: ProvenanceNode[] = refs.map((ref) => {
      const source = getArchiveSource(ref);
      const chars = source?.length ?? 0;
      return { ref, chars, tokensEst: estimateTokens(source ?? ""), exists: source !== null };
    });
    return {
      relPath: c.relPath,
      title: c.title,
      bundleChars: c.content.length,
      bundleTokensEst: estimateTokens(c.content),
      citedArchive,
    };
  });

  const digestedTokens = selectedConcepts.reduce((sum, c) => sum + c.bundleTokensEst, 0);
  // dedupe archive refs across concepts — two concepts citing the same
  // source shouldn't double-count the raw side
  const allArchiveRefs = new Set<string>();
  let rawTokens = 0;
  for (const c of selectedConcepts) {
    for (const node of c.citedArchive) {
      if (allArchiveRefs.has(node.ref)) continue;
      allArchiveRefs.add(node.ref);
      rawTokens += node.tokensEst;
    }
  }

  return {
    query,
    selectedConcepts,
    digested: { tokensEst: digestedTokens, fileCount: selectedConcepts.length },
    raw: { tokensEst: rawTokens, fileCount: allArchiveRefs.size },
    compressionRatio: digestedTokens > 0 ? rawTokens / digestedTokens : 0,
  };
}

// Whole-corpus number, independent of any query — the headline stat.
export function overallCompressionStats() {
  const concepts = listConcepts();
  const bundleChars = concepts.reduce((sum, c) => sum + c.content.length, 0);

  function walkChars(dir: string): number {
    if (!fs.existsSync(dir)) return 0;
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += walkChars(full);
      else if (entry.name.endsWith(".md")) total += fs.statSync(full).size;
    }
    return total;
  }
  const archiveChars = walkChars(ARCHIVE_DIR);

  return {
    bundleFileCount: concepts.length,
    bundleTokensEst: estimateTokens("x".repeat(bundleChars)),
    archiveTokensEst: estimateTokens("x".repeat(archiveChars)),
    compressionRatio: bundleChars > 0 ? archiveChars / bundleChars : 0,
  };
}
