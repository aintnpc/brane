import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Capture endpoint — deliberately dumb and cheap (no LLM calls, just a
// filesystem write). This is where the browser extension drops raw
// conversation exports. Processing (the actual write-path judgment) is a
// separate concern handled by /api/ingest, triggered later by the Stop
// hook — keeping "get data in" decoupled from "the LLM call that costs
// money and can rewrite bundle files" means the extension can run
// unattended without silently spending API credits.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "local-only" }, { status: 403 });
  }

  const { filename, content } = await req.json();
  if (!filename || typeof filename !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "filename and content are required" }, { status: 400 });
  }
  if (filename.includes("..") || path.isAbsolute(filename)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }

  const BRANE_ROOT = process.env.BRANE_DATA_DIR
    ? path.resolve(process.env.BRANE_DATA_DIR)
    : path.join(process.cwd(), "..");
  const inboxDir = path.join(BRANE_ROOT, "inbox");
  const targetPath = path.join(inboxDir, filename);

  if (!targetPath.startsWith(inboxDir)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  // Don't clobber a same-named file already waiting to be processed.
  let finalPath = targetPath;
  let n = 1;
  while (fs.existsSync(finalPath)) {
    const ext = path.extname(targetPath);
    const base = targetPath.slice(0, -ext.length);
    finalPath = `${base}-${n}${ext}`;
    n++;
  }
  fs.writeFileSync(finalPath, content, "utf-8");

  return NextResponse.json({ saved: path.relative(inboxDir, finalPath) });
}
