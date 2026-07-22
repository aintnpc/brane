import path from "path";
import { listConcepts, BUNDLE_DIR } from "./bundle";

export interface GraphNode {
  id: string; // relPath
  title: string;
  category: string;
  hasConflict: boolean; // tagged "unresolved-conflict" — a QUESTION the engine refused to auto-resolve
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
  const fromDir = path.dirname(path.join(BUNDLE_DIR, fromRelPath));
  while ((m = linkRe.exec(content))) {
    const href = m[1];
    if (!href.endsWith(".md") || href.startsWith("http") || href.startsWith("archive/")) {
      continue;
    }
    const resolved = path.resolve(fromDir, href);
    if (!resolved.startsWith(BUNDLE_DIR)) continue;
    targets.push(path.relative(BUNDLE_DIR, resolved).replace(/\\/g, "/"));
  }
  return targets;
}

export function buildGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const concepts = listConcepts();
  const validIds = new Set(concepts.map((c) => c.relPath));

  const nodes: GraphNode[] = concepts.map((c) => ({
    id: c.relPath,
    title: c.title,
    category: c.category,
    hasConflict: c.tags?.includes("unresolved-conflict") ?? false,
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
