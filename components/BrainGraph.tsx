"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { NodeObject, LinkObject } from "react-force-graph-2d";
import { colorFor } from "@/lib/graphColors";

// react-force-graph-2d touches `window`/canvas at import time — must be
// client-only, no SSR.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GNode extends NodeObject {
  id: string;
  title: string;
  category: string;
  degree?: number;
  contentLength?: number;
  hasConflict?: boolean;
}
interface GLink extends LinkObject {
  source: string;
  target: string;
}

// how much is actually written for a concept matters as much as how
// connected it is — a stub with 3 links shouldn't outsize a 2000-word
// concept with 1 link.
function sizeFor(n: GNode, base: number, degreeWeight: number, contentWeight: number): number {
  return (
    base +
    Math.sqrt(n.degree ?? 0) * degreeWeight +
    Math.sqrt((n.contentLength ?? 0) / 150) * contentWeight
  );
}

const THEME_BG = { dark: "#00000a", light: "#e4e4e7" };

export default function BrainGraph({
  onSelect,
  focusRelPath,
  hideLabel,
  theme = "dark",
}: {
  onSelect: (relPath: string) => void;
  focusRelPath?: string | null;
  hideLabel?: boolean;
  theme?: "dark" | "light";
}) {
  const [data, setData] = useState<{ nodes: GNode[]; links: GLink[] } | null>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  // dynamic() erases the underlying component's generics, so the ref type
  // has to stay loose here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((raw: { nodes: GNode[]; links: GLink[] }) => {
        const degree: Record<string, number> = {};
        for (const l of raw.links) {
          degree[l.source] = (degree[l.source] ?? 0) + 1;
          degree[l.target] = (degree[l.target] ?? 0) + 1;
        }
        setData({
          nodes: raw.nodes.map((n) => ({ ...n, degree: degree[n.id] ?? 0 })),
          links: raw.links,
        });
      });
  }, []);

  useEffect(() => {
    function resize() {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    // early feedback while the force sim is still spreading nodes out from
    // their initial (0,0) cluster — this alone isn't enough on its own,
    // since nodes keep drifting outward past whatever we fit to here.
    const t = setTimeout(() => fgRef.current?.zoomToFit(600, 60), 800);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    if (!focusRelPath || !data) return;
    const node = data.nodes.find((n) => n.id === focusRelPath);
    if (!node) return;
    fgRef.current?.centerAt(node.x, node.y, 700);
    fgRef.current?.zoom(4, 700);
  }, [focusRelPath, data]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[var(--graph-bg)]">
      {!hideLabel && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 text-zinc-400">
          <div className="text-lg font-semibold text-zinc-100">this is my brane</div>
          <div className="text-xs">
            {data ? `${data.nodes.length} concepts · ${data.links.length} links` : "loading..."}
          </div>
        </div>
      )}
      {data && (
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={dims.width}
          height={dims.height}
          backgroundColor={THEME_BG[theme]}
          nodeLabel={(n) => (n as GNode).title}
          nodeRelSize={4}
          linkColor={() => "rgba(140, 150, 170, 0.18)"}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1}
          linkDirectionalParticleColor={() => "rgba(200, 210, 230, 0.5)"}
          onNodeClick={(n) => onSelect((n as GNode).id)}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 60)}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GNode;
            const color = colorFor(n.category);
            const radius = sizeFor(n, 3, 1.3, 1.7);

            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
            // no permanent text labels — hover (nodeLabel) + the index
            // panel are the ways to identify a node, so the canvas stays
            // clean at rest instead of turning into a wall of text.

            // unresolved-conflict marker — the one thing a plain Obsidian
            // graph view structurally cannot show: a concept the engine
            // refused to silently resolve because two sources disagree.
            if (n.hasConflict) {
              ctx.save();
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 1.5 / globalScale;
              ctx.beginPath();
              ctx.arc(n.x ?? 0, n.y ?? 0, radius + 4, 0, 2 * Math.PI);
              ctx.stroke();
              if (globalScale > 1) {
                const fontSize = 10 / globalScale;
                ctx.font = `${fontSize}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillStyle = "#f59e0b";
                ctx.fillText("⚠ QUESTION", n.x ?? 0, (n.y ?? 0) - radius - 12 / globalScale);
              }
              ctx.restore();
            }
          }}
        />
      )}
    </div>
  );
}
