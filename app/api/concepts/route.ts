import { NextRequest, NextResponse } from "next/server";
import { listConcepts, getConcept } from "@/lib/bundle";

export async function GET(req: NextRequest) {
  const relPath = req.nextUrl.searchParams.get("path");
  if (relPath) {
    const concept = getConcept(relPath);
    if (!concept) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(concept);
  }
  const concepts = listConcepts();
  return NextResponse.json(concepts);
}
