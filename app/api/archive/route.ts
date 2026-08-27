import { NextRequest, NextResponse } from "next/server";
import { getArchiveSource } from "@/lib/bundle";
import { isPublicArchive, privateAccessAllowed } from "@/lib/visibility";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref"); // e.g. "archive/2026-07-04-x.md"
  if (!ref) {
    return NextResponse.json({ error: "ref is required" }, { status: 400 });
  }
  if (!privateAccessAllowed() && !isPublicArchive(ref)) {
    return NextResponse.json({ error: "not-public" }, { status: 403 });
  }
  const content = getArchiveSource(ref);
  if (content === null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ref, content });
}
