export const VALID_HARNESSES = ["claude", "codex", "opencode", "agy", "cursor"] as const;

export const CATEGORY_META_WIZARD: Record<string, { label: string; color: string; icon: string }> = {
  code:  { label: "Code",          color: "#3B6EFF", icon: "âŒ¨" },
  docs:  { label: "Docs",          color: "#2ECC8A", icon: "ðŸ“„" },
  data:  { label: "Data",          color: "#4AB8E8", icon: "ðŸ—„" },
  ui:    { label: "UI / Frontend", color: "#C45FD4", icon: "ðŸ–¥" },
  infra: { label: "Infra",         color: "#E88B3A", icon: "âš™" },
  ai:    { label: "AI & Agents",   color: "#E8503A", icon: "ðŸ¤–" },
};
