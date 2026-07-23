// Shared, muted palette for the graph views + index panel — deliberately
// desaturated (enterprise dataviz, not neon-toy) so it reads as a serious
// instrument rather than a demo widget.
export const CATEGORY_COLOR: Record<string, string> = {
  identity: "#8b7bb8", // muted lavender — the self
  ventures: "#4a9eb5", // muted teal — the outputs
  architecture: "#c9973f", // muted gold — the core
  roadmap: "#5a9e6f", // muted sage — where it's going
  playbooks: "#b0698a", // muted rose
  notes: "#5f7fa8", // muted steel blue
};
export const DEFAULT_CATEGORY_COLOR = "#6b7280";

export function colorFor(category: string): string {
  return CATEGORY_COLOR[category] ?? DEFAULT_CATEGORY_COLOR;
}

export const CATEGORY_ICON: Record<string, string> = {
  identity: "🪪",
  ventures: "🚀",
  architecture: "🏛",
  roadmap: "🗺",
  playbooks: "📘",
  notes: "📝",
  personal: "👤",
};
export const DEFAULT_CATEGORY_ICON = "🔹";

export function iconFor(category: string): string {
  return CATEGORY_ICON[category] ?? DEFAULT_CATEGORY_ICON;
}
