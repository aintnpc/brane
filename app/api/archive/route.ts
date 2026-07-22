import { NextRequest, NextResponse } from "next/server";
import { getArchiveSource } from "@/lib/bundle";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref"); // e.g. "archive/2026-07-04-x.md"
  if (!ref) {
    return NextResponse.json({ error: "ref is required" }, { status: 400 });
  }
  const content = getArchiveSource(ref);
  if (content === null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ref, content });
}
