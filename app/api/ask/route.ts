import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/load";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  try {
    const result = await ask(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "brane read-path failed", detail: String(err) },
      { status: 500 },
    );
  }
}
