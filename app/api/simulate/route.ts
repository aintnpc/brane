import { NextRequest, NextResponse } from "next/server";
import { runSuite } from "@/lib/simulate";
import { providerMenu } from "@/lib/llm";
import { PERSONAS } from "@/lib/personas";

// Local-only. The suite spends real tokens on whichever provider it's pointed
// at, and an open endpoint that bills per request is exactly how the API
// balance hit zero the first time. It is a development instrument, not a
// product surface.
function guard() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "local-only" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return NextResponse.json({
    providers: providerMenu(),
    personas: PERSONAS.map((p) => ({
      id: p.id,
      label: p.label,
      probes: p.probes,
      sources: p.sources.length,
    })),
  });
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as {
    provider?: string;
    personas?: string[];
  };

  try {
    const suite = await runSuite(body.provider, { personaIds: body.personas });
    return NextResponse.json(suite);
  } catch (err) {
    return NextResponse.json(
      { error: "simulation failed", detail: String(err) },
      { status: 500 },
    );
  }
}
