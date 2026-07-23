import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ingest } from "@/lib/ingest";

// write path — local only. It writes to and commits nothing itself; it just
// edits files under BRANE_DATA_DIR/bundle and moves the source into
// BRANE_DATA_DIR/archive. On the deployed site, BRANE_DATA_DIR is a
// read-only git submodule checkout, so this would either fail or silently
// write into an ephemeral container that's gone on the next cold start —
// neither is useful. Guard it off in production until there's a real
// server-side write+commit story.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "write path is local-only for now — see dev_log for why" },
      { status: 403 },
    );
  }

  const { filename } = await req.json();
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const BRANE_ROOT = process.env.BRANE_DATA_DIR
    ? path.resolve(process.env.BRANE_DATA_DIR)
    : path.join(process.cwd(), "..");
  const inboxDir = path.join(BRANE_ROOT, "inbox");
  const sourceAbsPath = path.join(inboxDir, filename);

  if (!sourceAbsPath.startsWith(inboxDir) || !fs.existsSync(sourceAbsPath)) {
    return NextResponse.json({ error: "file not found in inbox/" }, { status: 404 });
  }

  try {
    const result = await ingest(sourceAbsPath);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "ingest failed", detail: String(err) },
      { status: 500 },
    );
  }
}
