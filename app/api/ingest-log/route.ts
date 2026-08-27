import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BRANE_ROOT } from "@/lib/bundle";
import type { IngestTraceEntry } from "@/lib/ingest";

const LOG_DIR = path.join(BRANE_ROOT, ".ingest-logs");

interface TraceFile {
  source: string;
  ranAt: string;
  trace: IngestTraceEntry[];
}

export async function GET() {
  // Traces name private bundle files (personal/*, notes/*) and quote the
  // planner's reasoning about them. Never off-machine.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "local-only" }, { status: 403 });
  }
  if (!fs.existsSync(LOG_DIR)) return NextResponse.json([]);
  const files = fs
    .readdirSync(LOG_DIR)
    .filter((f) => f.endsWith(".trace.json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(LOG_DIR, f), "utf-8");
      return JSON.parse(raw) as TraceFile;
    })
    .sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1));
  return NextResponse.json(files);
}
