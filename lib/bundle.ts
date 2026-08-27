import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isPublicConcept, isPublicArchive, privateAccessAllowed } from "./visibility";

// brane's core rule: the app never owns data, it only reads a client's brane files.
// The app repo and the personal data repo are separate — BRANE_DATA_DIR points
// at the client instance (e.g. a checkout of the private my-brane repo).
export const BRANE_ROOT = process.env.BRANE_DATA_DIR
  ? path.resolve(process.env.BRANE_DATA_DIR)
  : path.join(process.cwd(), "..");
export const BUNDLE_DIR = path.join(BRANE_ROOT, "bundle");
export const ARCHIVE_DIR = path.join(BRANE_ROOT, "archive");

export interface ConceptFile {
  category: string; // top-level bundle subdirectory, e.g. "identity"
  slug: string; // filename without extension
  relPath: string; // e.g. "identity/founder.md"
  title: string;
  description: string;
  tags: string[];
  timestamp: string;
  status?: string;
  content: string; // markdown body (frontmatter stripped)
}

// Public concepts cross-link to private ones — ventures/pegasus.md points at
// identity/life-plan.md, playbooks link to roadmap/thiel-fellowship.md. Serving
// that markup verbatim publishes the private files' names and paths even though
// getConcept() refuses their contents, and leaves the reader clicking links that
// 404. Demote those links to plain text; leave `^[archive/...]` citations alone
// (different syntax, and they have their own gate in getArchiveSource).
function redactPrivateLinks(content: string, fromRelPath: string): string {
  if (privateAccessAllowed()) return content;
  const fromDir = path.dirname(path.join(BUNDLE_DIR, fromRelPath));
  return content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (whole, text: string, href: string) => {
    if (!href.endsWith(".md") || href.startsWith("http") || href.startsWith("archive/")) {
      return whole;
    }
    const resolved = path.resolve(fromDir, href);
    if (!resolved.startsWith(BUNDLE_DIR)) return whole;
    const target = path.relative(BUNDLE_DIR, resolved).replace(/\\/g, "/");
    return isPublicConcept(target) ? whole : text;
  });
}

function walkMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

export function listConcepts(): ConceptFile[] {
  const files = walkMarkdownFiles(BUNDLE_DIR);
  const concepts: ConceptFile[] = [];
  for (const filePath of files) {
    const relPath = path.relative(BUNDLE_DIR, filePath).replace(/\\/g, "/");
    // Filter before reading, not after — a private file's contents should
    // never sit in this process's memory on a public request.
    if (!privateAccessAllowed() && !isPublicConcept(relPath)) continue;
    const raw = fs.readFileSync(filePath, "utf-8");
    let data: Record<string, unknown>;
    let content: string;
    try {
      const parsed = matter(raw);
      data = parsed.data;
      content = parsed.content;
    } catch (err) {
      // Bad frontmatter (e.g. an unquoted ": " inside a value breaks YAML)
      // shouldn't take down the whole listing — skip and surface it in logs
      // so it can be fixed at the source instead of failing silently.
      console.warn(`[bundle] skipping ${relPath}: frontmatter parse failed —`, (err as Error).message);
      continue;
    }
    const category = relPath.split("/")[0];
    const slug = path.basename(filePath, ".md");
    concepts.push({
      category,
      slug,
      relPath,
      title: (data.title as string) ?? slug,
      description: (data.description as string) ?? "",
      tags: (data.tags as string[]) ?? [],
      timestamp: data.timestamp ? String(data.timestamp) : "",
      status: data.status as string | undefined,
      content: redactPrivateLinks(content, relPath),
    });
  }
  return concepts.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export function getConcept(relPath: string): ConceptFile | null {
  if (!privateAccessAllowed() && !isPublicConcept(relPath)) return null;
  const filePath = path.join(BUNDLE_DIR, relPath);
  if (!filePath.startsWith(BUNDLE_DIR) || !fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  let data: Record<string, unknown>;
  let content: string;
  try {
    const parsed = matter(raw);
    data = parsed.data;
    content = parsed.content;
  } catch (err) {
    console.warn(`[bundle] ${relPath}: frontmatter parse failed —`, (err as Error).message);
    return null;
  }
  const category = relPath.split("/")[0];
  const slug = path.basename(filePath, ".md");
  return {
    category,
    slug,
    relPath,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    tags: (data.tags as string[]) ?? [],
    timestamp: data.timestamp ? String(data.timestamp) : "",
    status: data.status as string | undefined,
    content: redactPrivateLinks(content, relPath),
  };
}

export function groupByCategory(concepts: ConceptFile[]): Record<string, ConceptFile[]> {
  const groups: Record<string, ConceptFile[]> = {};
  for (const c of concepts) {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  }
  return groups;
}

// Reads an archive source file referenced by a `^[archive/...]` citation.
export function getArchiveSource(archiveRelPath: string): string | null {
  // archiveRelPath looks like "archive/2026-07-04-market-and-hyre.md"
  if (!privateAccessAllowed() && !isPublicArchive(archiveRelPath)) return null;
  const filename = archiveRelPath.replace(/^archive\//, "");
  const filePath = path.join(ARCHIVE_DIR, filename);
  if (!filePath.startsWith(ARCHIVE_DIR) || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}
