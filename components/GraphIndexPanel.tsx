"use client";

import { useEffect, useMemo, useState } from "react";
import { colorFor } from "@/lib/graphColors";

interface IndexItem {
  relPath: string;
  title: string;
  category: string;
  tags?: string[];
}

export default function GraphIndexPanel({
  onSelect,
  onFocus,
}: {
  onSelect: (relPath: string) => void;
  onFocus?: (relPath: string) => void;
}) {
  const [items, setItems] = useState<IndexItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/concepts")
      .then((r) => r.json())
      .then((data: IndexItem[]) => setItems(data));
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter((i) => i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      : items;
    const groups: Record<string, IndexItem[]> = {};
    for (const i of filtered) {
      (groups[i.category] ??= []).push(i);
    }
    return groups;
  }, [items, query]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of items) counts[i.category] = (counts[i.category] ?? 0) + 1;
    return counts;
  }, [items]);

  return (
    <div className="flex h-full w-72 flex-col border-l border-white/10 bg-zinc-950/95 font-mono text-xs text-zinc-300">
      <div className="border-b border-white/10 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Index</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search concepts / category..."
          className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-white/30 focus:outline-none"
        />
      </div>

      <div className="border-b border-white/10 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Legend</div>
        <div className="flex flex-col gap-1">
          {Object.entries(categoryCounts).map(([cat, n]) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorFor(cat) }}
                />
                {cat}
              </span>
              <span className="text-zinc-600">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-3">
            <div
              className="mb-1 text-[10px] uppercase tracking-widest"
              style={{ color: colorFor(cat) }}
            >
              {cat} · {list.length}
            </div>
            {list.map((item) => (
              <button
                key={item.relPath}
                onMouseEnter={() => onFocus?.(item.relPath)}
                onClick={() => onSelect(item.relPath)}
                className="flex w-full items-center gap-1 truncate rounded px-2 py-1 text-left text-zinc-300 hover:bg-white/5 hover:text-white"
                title={item.title}
              >
                {item.tags?.includes("unresolved-conflict") && (
                  <span className="text-amber-500" title="미해결 QUESTION">
                    ⚠
                  </span>
                )}
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
        ))}
        {items.length === 0 && <div className="text-zinc-600">loading index...</div>}
      </div>
    </div>
  );
}
