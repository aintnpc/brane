import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { buildGraphFrom } from "@/lib/graph";
import { parseConcept } from "@/lib/ingest-core";
import { makeZip } from "@/lib/zip";

// Read, export, and destroy one visitor's brane.
//
// These three are what turn the storage concession into an honest promise.
// Persisting a stranger's conversations is only defensible if they can see
// exactly what was kept, take the whole thing with them, and delete it on
// demand — so all three ship together, not as a later hardening pass.

export const maxDuration = 60;

function notFound() {
  // Same answer for wrong and expired, so a guesser learns nothing from it.
  return NextResponse.json(
    { error: "이 brane을 찾을 수 없습니다 — 링크가 잘못됐거나 만료되어 삭제되었습니다." },
    { status: 404 },
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const snapshot = await getStore().get(token);
  if (!snapshot) return notFound();

  const format = req.nextUrl.searchParams.get("format");

  if (format === "zip") {
    // bundle/ and archive/ together on purpose: every sentence the compiler
    // wrote carries a `^[archive/...]` citation, and a bundle shipped without
    // its sources is a pile of assertions with dangling footnotes.
    const files = [
      ...snapshot.concepts.map((c) => ({ path: `bundle/${c.relPath}`, content: c.raw })),
      ...snapshot.sources.map((s) => ({ path: `archive/${s.name}`, content: s.text })),
      {
        path: "README.md",
        content: [
          `# ${snapshot.label}`,
          "",
          "당신의 brane입니다. 마크다운 파일 그대로 — 열어서 읽고, 고치고, git에 넣으세요.",
          "",
          "```",
          "bundle/    소화된 개념. 사람이 읽고 고치도록 만들어진 결과물.",
          "archive/   원본 대화. bundle의 모든 `^[archive/...]` 인용이 여기를 가리킵니다.",
          "```",
          "",
          `- 생성: ${snapshot.createdAt.slice(0, 10)}`,
          `- 소화에 사용한 모델: ${snapshot.provider}`,
          `- 개념 ${snapshot.concepts.length}개 · 원본 ${snapshot.sources.length}개`,
          "",
          "이 파일들은 어떤 서비스에도 묶여 있지 않습니다. 호스팅된 사본은 만료되면 삭제되지만,",
          "이 zip은 당신 것이고 만료되지 않습니다.",
          "",
          "생성: brane — https://brane.my",
          "",
        ].join("\n"),
      },
    ];

    const zip = makeZip(files, new Date(snapshot.updatedAt));
    const safeLabel = snapshot.label.replace(/[^\w가-힣.\-]/g, "-").slice(0, 40) || "brane";
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        // RFC 5987 form as well, so a Korean label survives the download.
        "Content-Disposition": `attachment; filename="brane.zip"; filename*=UTF-8''${encodeURIComponent(safeLabel)}.zip`,
        "Content-Length": String(zip.length),
        "Cache-Control": "no-store",
      },
    });
  }

  const records = snapshot.concepts.map((c) => parseConcept(c.relPath, c.raw));
  return NextResponse.json({
    label: snapshot.label,
    createdAt: snapshot.createdAt,
    expiresAt: snapshot.expiresAt,
    provider: snapshot.provider,
    hasEmail: Boolean(snapshot.email),
    sources: snapshot.sources.map((s) => ({ name: s.name, chars: s.text.length })),
    concepts: records.map((r) => ({
      relPath: r.relPath,
      title: r.title,
      description: r.description,
      category: r.category,
      tags: r.tags,
      timestamp: r.timestamp,
      content: r.content,
    })),
    graph: buildGraphFrom(records),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const snapshot = await getStore().get(token);
  if (!snapshot) return notFound();
  await getStore().remove(token);
  return NextResponse.json({ deleted: true });
}
