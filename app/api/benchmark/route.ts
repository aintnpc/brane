import { NextRequest, NextResponse } from "next/server";
import { compareContextCost, overallCompressionStats } from "@/lib/benchmark";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  const overall = overallCompressionStats();
  if (!query) {
    return NextResponse.json({ overall, query: null, comparison: null });
  }
  const comparison = compareContextCost(query);
  return NextResponse.json({ overall, comparison });
}
