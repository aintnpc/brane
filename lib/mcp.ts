// A minimal MCP server over Streamable HTTP, hand-rolled.
//
// No SDK on purpose. MCP is JSON-RPC 2.0 over an HTTP POST, and the surface a
// read-only brane needs is four tools and three methods — small enough that a
// dependency would cost more than it saves, and this has to run unchanged on
// Vercel's serverless runtime and (later) on a Worker.
//
// Streamable HTTP, not SSE: the March 2025 spec made Streamable HTTP the
// standard remote transport and clients are dropping SSE. A server built on
// the legacy transport today is a server that stops working during the
// judging window.
//
// Everything here is read-only. An MCP endpoint handed out behind a bearer
// token in a URL is exactly the wrong place to expose writes.

import { BraneSnapshot } from "./store";

export const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"];
const DEFAULT_PROTOCOL = PROTOCOL_VERSIONS[0];

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const TOOLS = [
  {
    name: "recent_work",
    description:
      "What this person worked on most recently, newest first. Use this to answer questions like " +
      "'what were we doing last?', 'where did I leave off?', or to pick up a thread from another " +
      "AI session. Returns concept titles, dates, and summaries.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "How many entries to return (default 5, max 20)." },
      },
    },
  },
  {
    name: "search_brane",
    description:
      "Search this person's brane for concepts relevant to a query — decisions, strategy, project " +
      "state, working context. Call this before answering anything that depends on what they have " +
      "already decided or built, instead of asking them to re-explain.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you are looking for." },
        limit: { type: "number", description: "Max results (default 5, max 20)." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_concept",
    description:
      "Read one concept in full, by its path (as returned by search_brane or list_concepts). " +
      "Use when a summary is not enough and you need the whole record including its citations.",
    inputSchema: {
      type: "object",
      properties: {
        relPath: { type: "string", description: "e.g. ventures/pricing.md" },
      },
      required: ["relPath"],
    },
  },
  {
    name: "list_concepts",
    description:
      "The full index of this brane — every concept's path, title, and one-line description. " +
      "Cheap. Use it to orient before searching.",
    inputSchema: { type: "object", properties: {} },
  },
];

interface Parsed {
  relPath: string;
  title: string;
  description: string;
  tags: string[];
  timestamp: string;
  body: string;
  raw: string;
}

function parse(snapshot: BraneSnapshot): Parsed[] {
  return snapshot.concepts.map((c) => {
    // Deliberately not gray-matter: this runs per tool call on a hot path and
    // only needs four scalar fields. A malformed header degrades to an
    // untitled-but-readable concept instead of throwing.
    const fm = c.raw.match(/^---\n([\s\S]*?)\n---\n?/);
    const head = fm?.[1] ?? "";
    const body = fm ? c.raw.slice(fm[0].length) : c.raw;
    const field = (k: string) => head.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
    const strip = (s: string) => s.replace(/^["']|["']$/g, "");
    const tagsRaw = field("tags");
    return {
      relPath: c.relPath,
      title: strip(field("title")) || c.relPath,
      description: strip(field("description")),
      tags: tagsRaw
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      timestamp: strip(field("timestamp")),
      body: body.trim(),
      raw: c.raw,
    };
  });
}

function score(c: Parsed, query: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return 0;
  const title = c.title.toLowerCase();
  const desc = c.description.toLowerCase();
  const tags = c.tags.join(" ").toLowerCase();
  const body = c.body.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (title.includes(t)) s += 8;
    if (desc.includes(t)) s += 4;
    if (tags.includes(t)) s += 3;
    // Body matches count, but with diminishing weight — a term repeated
    // fifty times in a long file shouldn't outrank a title match.
    const hits = body.split(t).length - 1;
    if (hits > 0) s += Math.min(3, 1 + Math.log2(hits));
  }
  return s;
}

function byNewest(a: Parsed, b: Parsed): number {
  return (b.timestamp || "").localeCompare(a.timestamp || "");
}

function clampLimit(v: unknown, def: number): number {
  const n = typeof v === "number" ? v : def;
  return Math.max(1, Math.min(20, Math.floor(n)));
}

function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function callTool(snapshot: BraneSnapshot, name: string, args: Record<string, unknown>): ToolResult {
  const concepts = parse(snapshot);

  if (name === "list_concepts") {
    if (concepts.length === 0) return textResult("This brane is empty.");
    return textResult(
      `${snapshot.label} — ${concepts.length} concepts\n\n` +
        concepts
          .slice()
          .sort(byNewest)
          .map((c) => `- ${c.relPath} — ${c.title}${c.description ? `: ${c.description}` : ""}`)
          .join("\n"),
    );
  }

  if (name === "recent_work") {
    const limit = clampLimit(args.limit, 5);
    const recent = concepts.slice().sort(byNewest).slice(0, limit);
    if (recent.length === 0) return textResult("This brane is empty.");
    return textResult(
      `Most recent work in ${snapshot.label}:\n\n` +
        recent
          .map(
            (c, i) =>
              `${i + 1}. ${c.title}${c.timestamp ? ` (${c.timestamp})` : ""}\n` +
              `   path: ${c.relPath}\n` +
              (c.description ? `   ${c.description}\n` : "") +
              `   ${c.body.slice(0, 400).replace(/\n+/g, " ")}${c.body.length > 400 ? "…" : ""}`,
          )
          .join("\n\n"),
    );
  }

  if (name === "search_brane") {
    const query = typeof args.query === "string" ? args.query : "";
    if (!query.trim()) return { ...textResult("search_brane requires a query."), isError: true };
    const limit = clampLimit(args.limit, 5);
    const ranked = concepts
      .map((c) => ({ c, s: score(c, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit);
    if (ranked.length === 0) {
      return textResult(
        `No concept in this brane matches "${query}". Use list_concepts to see what is here.`,
      );
    }
    return textResult(
      `${ranked.length} match(es) for "${query}":\n\n` +
        ranked
          .map(
            ({ c }) =>
              `## ${c.title}\npath: ${c.relPath}${c.timestamp ? ` · ${c.timestamp}` : ""}\n` +
              (c.description ? `${c.description}\n` : "") +
              `\n${c.body.slice(0, 1200)}${c.body.length > 1200 ? "\n…(use get_concept for the full text)" : ""}`,
          )
          .join("\n\n---\n\n"),
    );
  }

  if (name === "get_concept") {
    const relPath = typeof args.relPath === "string" ? args.relPath : "";
    const found = concepts.find((c) => c.relPath === relPath);
    if (!found) {
      return {
        ...textResult(`No concept at "${relPath}". Use list_concepts to see valid paths.`),
        isError: true,
      };
    }
    return textResult(found.raw);
  }

  return { ...textResult(`Unknown tool: ${name}`), isError: true };
}

export interface McpOutcome {
  /** null for notifications, which get 202 and an empty body. */
  body: unknown | null;
  status: number;
}

export function handleMcp(snapshot: BraneSnapshot, req: JsonRpcRequest): McpOutcome {
  const id = req.id ?? null;
  const ok = (result: unknown): McpOutcome => ({
    body: { jsonrpc: "2.0", id, result },
    status: 200,
  });
  const fail = (code: number, message: string): McpOutcome => ({
    body: { jsonrpc: "2.0", id, error: { code, message } },
    status: 200,
  });

  switch (req.method) {
    case "initialize": {
      // Echo the client's protocol version when we speak it, so a newer client
      // isn't forced down to ours over a difference that doesn't matter here.
      const asked = (req.params?.protocolVersion as string) ?? "";
      const version = PROTOCOL_VERSIONS.includes(asked) ? asked : DEFAULT_PROTOCOL;
      return ok({
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "brane", version: "0.1.0" },
        instructions:
          `This is ${snapshot.label} — a personal brane: markdown concepts digested from this ` +
          `person's own AI conversations. Before answering anything that depends on their prior ` +
          `decisions, projects, or working context, search it instead of asking them to repeat ` +
          `themselves. Start with recent_work to see where they left off.`,
      });
    }

    case "notifications/initialized":
    case "notifications/cancelled":
      return { body: null, status: 202 };

    case "ping":
      return ok({});

    case "tools/list":
      return ok({ tools: TOOLS });

    case "tools/call": {
      const name = req.params?.name;
      if (typeof name !== "string") return fail(-32602, "tools/call requires a tool name");
      const args = (req.params?.arguments as Record<string, unknown>) ?? {};
      try {
        return ok(callTool(snapshot, name, args));
      } catch (err) {
        return ok({
          content: [{ type: "text", text: `Tool failed: ${String(err)}` }],
          isError: true,
        });
      }
    }

    // Declared unsupported rather than left to time out — a client that probes
    // for resources or prompts should get a clear answer immediately.
    case "resources/list":
    case "prompts/list":
      return fail(-32601, `Method not supported: ${req.method}`);

    default:
      return fail(-32601, `Method not found: ${req.method}`);
  }
}
