import path from "path";
import { listConcepts } from "./bundle";

export interface GraphNode {
  id: string; // relPath
  title: string;
  category: string;
  hasConflict: boolean; // tagged "unresolved-conflict" — a QUESTION the engine refused to auto-resolve
  contentLength: number; // chars in the concept body — how much is actually written here
}

export interface GraphLink {
  source: string;
  target: string;
}

// Extract [text](relative/path.md) links from a concept's body and resolve
// them to other bundle relPaths. Citation footnotes (^[archive/...]) are a
// different syntax and never touched here — this only follows real
// cross-links between concepts, which is what should shape the graph.
function extractLinkTargets(content: string, fromRelPath: string): string[] {
  const targets: string[] = [];
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  // Resolve against a virtual "/" root rather than the real bundle directory:
  // the arithmetic is identical, but it works for concepts that only exist in
  // memory. posix.resolve clamps at the root, so `../../../etc/passwd` lands
  // inside the namespace and is then dropped by the validIds check.
  const fromDir = path.posix.dirname(path.posix.join("/", fromRelPath));
  while ((m = linkRe.exec(content))) {
    const href = m[1];
    if (!href.endsWith(".md") || href.startsWith("http") || href.startsWith("archive/")) {
      continue;
    }
    targets.push(path.posix.resolve(fromDir, href).replace(/^\//, ""));
  }
  return targets;
}

/** Shape buildGraphFrom needs — satisfied by both on-disk concepts and a visitor's in-memory ones. */
export interface GraphInput {
  relPath: string;
  title: string;
  category: string;
  tags?: string[];
  content: string;
}

export function buildGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  return buildGraphFrom(listConcepts());
}

/**
 * The graph, over any set of concepts.
 *
 * Split out from buildGraph so a visitor's brane — which never touches disk —
 * renders through the identical code as the author's. The only thing the old
 * version needed BUNDLE_DIR for was resolving relative links, and that is pure
 * path arithmetic on the relPaths themselves.
 */
export function buildGraphFrom(concepts: GraphInput[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const validIds = new Set(concepts.map((c) => c.relPath));

  const nodes: GraphNode[] = concepts.map((c) => ({
    id: c.relPath,
    title: c.title,
    category: c.category,
    hasConflict: c.tags?.includes("unresolved-conflict") ?? false,
    contentLength: c.content.trim().length,
  }));

  const linkSet = new Set<string>();
  const links: GraphLink[] = [];
  for (const c of concepts) {
    const targets = extractLinkTargets(c.content, c.relPath);
    for (const target of targets) {
      if (!validIds.has(target) || target === c.relPath) continue;
      const key = [c.relPath, target].sort().join("::");
      if (linkSet.has(key)) continue;
      linkSet.add(key);
      links.push({ source: c.relPath, target });
    }
  }

  return { nodes, links };
}
