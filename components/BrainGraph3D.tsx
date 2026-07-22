"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { colorFor } from "@/lib/graphColors";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface GNode {
  id: string;
  title: string;
  category: string;
  degree?: number;
  hasConflict?: boolean;
  x?: number;
  y?: number;
  z?: number;
}
interface GLink {
  source: string;
  target: string;
}

export default function BrainGraph3D({
  onSelect,
  focusRelPath,
}: {
  onSelect: (relPath: string) => void;
  focusRelPath?: string | null;
}) {
  const [data, setData] = useState<{ nodes: GNode[]; links: GLink[] } | null>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
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
    // slow ambient auto-rotate + depth fog, applied once the scene exists
    const t = setTimeout(() => {
      const controls = fgRef.current?.controls?.();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
      const scene = fgRef.current?.scene?.();
      if (scene) {
        // fog is what turns a flat void into something with depth/distance —
        // the single biggest lever for "serious instrument" over "toy demo"
        scene.fog = new THREE.FogExp2(0x00000a, 0.0028);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    if (!focusRelPath || !data) return;
    const node = data.nodes.find((n) => n.id === focusRelPath);
    if (!node || node.x === undefined) return;
    const controls = fgRef.current?.controls?.();
    if (controls) controls.autoRotate = false;
    const distRatio = 1 + 80 / Math.hypot(node.x ?? 1, node.y ?? 1, node.z ?? 1);
    fgRef.current?.cameraPosition?.(
      { x: (node.x ?? 0) * distRatio, y: (node.y ?? 0) * distRatio, z: (node.z ?? 0) * distRatio },
      node,
      900,
    );
  }, [focusRelPath, data]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      <div className="pointer-events-none absolute left-4 top-4 z-10 text-zinc-400">
        <div className="text-lg font-semibold text-zinc-100">this is my brane</div>
        <div className="text-xs">
          {data ? `${data.nodes.length} concepts · ${data.links.length} links` : "loading..."}
        </div>
      </div>
      {data && (
        <ForceGraph3D
          ref={fgRef}
          graphData={data}
          width={dims.width}
          height={dims.height}
          backgroundColor="#00000a"
          showNavInfo={false}
          nodeLabel={(n) => `${(n as unknown as GNode).title}`}
          nodeColor={(n) => colorFor((n as unknown as GNode).category)}
          nodeVal={(n) => 2.4 + Math.sqrt((n as unknown as GNode).degree ?? 0) * 1.4}
          nodeOpacity={0.9}
          nodeResolution={20}
          linkColor={() => "rgba(140, 150, 170, 0.18)"}
          linkOpacity={0.35}
          linkWidth={0.4}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={1}
          linkDirectionalParticleColor={() => "rgba(200, 210, 230, 0.5)"}
          nodeThreeObjectExtend={true}
          nodeThreeObject={(n) => {
            const node = n as unknown as GNode;
            // empty group for non-conflict nodes — extend mode still
            // requires an Object3D return, this just adds nothing visible
            if (!node.hasConflict) return new THREE.Group();
            // this is the one visual thing no Obsidian-plugin-style RAG
            // viewer can show: a concept the engine refused to silently
            // resolve because two sources actually disagree.
            const group = new THREE.Group();
            const ringGeo = new THREE.TorusGeometry(6, 0.35, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xf59e0b,
              transparent: true,
              opacity: 0.85,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            group.add(ring);
            const label = new SpriteText("⚠ QUESTION");
            label.color = "#f59e0b";
            label.textHeight = 2.2;
            label.position.set(0, 8, 0);
            group.add(label);
            return group;
          }}
          onNodeClick={(n) => {
            const controls = fgRef.current?.controls?.();
            if (controls) controls.autoRotate = false;
            onSelect((n as unknown as GNode).id);
          }}
        />
      )}
    </div>
  );
}
