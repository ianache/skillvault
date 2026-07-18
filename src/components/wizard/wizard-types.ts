export const VALID_TYPES = ["code", "docs", "data", "ui", "infra", "ai"] as const;
export const VALID_HARNESSES = ["claude", "codex", "opencode", "agy", "cursor"] as const;

export const CATEGORY_META_WIZARD: Record<string, { label: string; color: string; icon: string }> = {
  code:  { label: "Code",          color: "#3B6EFF", icon: "⌨" },
  docs:  { label: "Docs",          color: "#2ECC8A", icon: "📄" },
  data:  { label: "Data",          color: "#4AB8E8", icon: "🗄" },
  ui:    { label: "UI / Frontend", color: "#C45FD4", icon: "🖥" },
  infra: { label: "Infra",         color: "#E88B3A", icon: "⚙" },
  ai:    { label: "AI & Agents",   color: "#E8503A", icon: "🤖" },
};
