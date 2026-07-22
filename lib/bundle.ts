import fs from "fs";
import path from "path";
import matter from "gray-matter";

// brane's core rule: the app never owns data, it only reads brane's files.
// bundle/ and archive/ are siblings of this app/ directory.
const BRANE_ROOT = path.join(process.cwd(), "..");
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
    const raw = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(BUNDLE_DIR, filePath).replace(/\\/g, "/");
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
      content,
    });
  }
  return concepts.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export function getConcept(relPath: string): ConceptFile | null {
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
    content,
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
  const filename = archiveRelPath.replace(/^archive\//, "");
  const filePath = path.join(ARCHIVE_DIR, filename);
  if (!filePath.startsWith(ARCHIVE_DIR) || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}
