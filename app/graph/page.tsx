"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrainGraph from "@/components/BrainGraph";
import BrainGraph3D from "@/components/BrainGraph3D";
import GraphErrorBoundary from "@/components/GraphErrorBoundary";
import GraphIndexPanel from "@/components/GraphIndexPanel";

export default function GraphPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"2d" | "3d">("3d");
  const [focusRelPath, setFocusRelPath] = useState<string | null>(null);
  const openConcept = (relPath: string) => router.push(`/?open=${encodeURIComponent(relPath)}`);

  return (
    <div className="flex h-screen w-full">
      <div className="relative flex-1">
        {mode === "3d" ? (
          <GraphErrorBoundary fallback={<BrainGraph onSelect={openConcept} focusRelPath={focusRelPath} />}>
            <BrainGraph3D onSelect={openConcept} focusRelPath={focusRelPath} />
          </GraphErrorBoundary>
        ) : (
          <BrainGraph onSelect={openConcept} focusRelPath={focusRelPath} />
        )}

        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <a
            href="/"
            className="rounded bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            ← 뷰어로 돌아가기
          </a>
          <button
            onClick={() => setMode(mode === "3d" ? "2d" : "3d")}
            className="rounded bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            {mode === "3d" ? "2D로 전환" : "3D로 전환"}
          </button>
        </div>
      </div>

      <GraphIndexPanel onSelect={openConcept} onFocus={setFocusRelPath} />
    </div>
  );
}
