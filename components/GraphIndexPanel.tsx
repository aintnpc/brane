"use client";

import { useEffect, useMemo, useState } from "react";
import { colorFor, iconFor } from "@/lib/graphColors";

interface IndexItem {
  relPath: string;
  title: string;
  category: string;
  tags?: string[];
}

export default function GraphIndexPanel({
  onSelect,
  onFocus,
  glass,
  selectedRelPath,
}: {
  onSelect: (relPath: string) => void;
  onFocus?: (relPath: string) => void;
  glass?: boolean;
  selectedRelPath?: string | null;
}) {
  const [items, setItems] = useState<IndexItem[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/concepts")
      .then((r) => r.json())
      .then((data: IndexItem[]) => setItems(data));
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((i) => {
      if (activeCategory && i.category !== activeCategory) return false;
      if (!q) return true;
      return i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    });
    const groups: Record<string, IndexItem[]> = {};
    for (const i of filtered) {
      (groups[i.category] ??= []).push(i);
    }
    return groups;
  }, [items, query, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of items) counts[i.category] = (counts[i.category] ?? 0) + 1;
    return counts;
  }, [items]);

  return (
    <div
      className={
        glass
          ? "flex h-full w-72 flex-col overflow-hidden rounded-xl border border-[rgba(var(--brane-accent-rgb),0.2)] bg-[var(--panel-bg)] font-mono text-xs text-[var(--text-secondary)] shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          : "flex h-full w-72 flex-col border-l border-[var(--panel-border)] bg-[var(--modal-bg)] font-mono text-xs text-[var(--text-secondary)]"
      }
    >
      <div className="border-b border-[var(--panel-border)] p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          Index
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="뭘 찾고 있어? (제목으로 검색)"
          className="w-full rounded border border-[var(--panel-border)] bg-[var(--hover-bg)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--brane-accent-rgb),0.4)] focus:outline-none"
        />
      </div>

      <div className="border-b border-[var(--panel-border)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          <span>Legend</span>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="normal-case tracking-normal text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              필터 해제
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {Object.entries(categoryCounts).map(([cat, n]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`flex items-center justify-between rounded px-1.5 py-1 text-left transition-colors ${
                activeCategory === cat
                  ? "bg-[rgba(var(--brane-accent-rgb),0.15)] text-[var(--text-primary)]"
                  : "hover:bg-[var(--hover-bg)]"
              }`}
              title={`${cat}만 보기`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorFor(cat) }}
                />
                <span>{iconFor(cat)}</span>
                {cat}
              </span>
              <span className="text-[var(--text-muted)]">{n}</span>
            </button>
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
              {iconFor(cat)} {cat} · {list.length}
            </div>
            {list.map((item) => (
              <button
                key={item.relPath}
                onMouseEnter={() => onFocus?.(item.relPath)}
                onClick={() => onSelect(item.relPath)}
                className={`flex w-full items-center gap-1 truncate rounded px-2 py-1 text-left hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] ${
                  selectedRelPath === item.relPath
                    ? "bg-[rgba(var(--brane-accent-rgb),0.15)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
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
        {Object.keys(grouped).length === 0 && items.length > 0 && (
          <div className="text-[var(--text-muted)]">조건에 맞는 concept이 없어</div>
        )}
        {items.length === 0 && <div className="text-[var(--text-muted)]">loading index...</div>}
      </div>
    </div>
  );
}
