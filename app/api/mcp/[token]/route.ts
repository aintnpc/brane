import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { handleMcp, JsonRpcRequest } from "@/lib/mcp";

// The endpoint a visitor pastes into Claude, ChatGPT, Cursor, or any other MCP
// client. Streamable HTTP: one POST carrying a JSON-RPC request, one JSON
// response. The token in the path is the whole credential — there is no
// account behind it, which is the point.

export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// Clients may open a GET for server-initiated messages. This server never
// pushes anything, so say so plainly instead of holding a stream open.
export async function GET() {
  return new Response("this brane's MCP endpoint does not stream server-initiated messages", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS" },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = (await req.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400, headers: CORS },
    );
  }

  const snapshot = await getStore().get(token);
  if (!snapshot) {
    // One message for "never existed" and "expired" alike: distinguishing them
    // would confirm that a given token was once real, which is exactly the
    // thing a random guesser is trying to learn.
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: Array.isArray(body) ? null : (body.id ?? null),
        error: {
          code: -32001,
          message:
            "This brane is not available — the link is wrong, or it has expired and been deleted.",
        },
      },
      { status: 404, headers: CORS },
    );
  }

  // JSON-RPC allows a batch; clients use it during handshake often enough that
  // rejecting it looks like a broken server.
  if (Array.isArray(body)) {
    const results = body
      .map((r) => handleMcp(snapshot, r))
      .filter((o) => o.body !== null)
      .map((o) => o.body);
    if (results.length === 0) return new Response(null, { status: 202, headers: CORS });
    return NextResponse.json(results, { headers: CORS });
  }

  const outcome = handleMcp(snapshot, body);
  if (outcome.body === null) {
    return new Response(null, { status: outcome.status, headers: CORS });
  }
  return NextResponse.json(outcome.body, { status: outcome.status, headers: CORS });
}
