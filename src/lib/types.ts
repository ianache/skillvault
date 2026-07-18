export type SkillType = string; // dynamic — loaded from categories table
export type SkillStatus = "draft" | "in_review" | "published" | "rejected";

export interface Category {
  slug: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  sort_order: number;
}

export interface SkillRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  type: SkillType;
  authorHandle: string | null;
  version: string;
  triggers: string[];
  tools: string[];
  compatibility: string[];
  configRequirements: Record<string, unknown>[];
  status: SkillStatus;
  installCount: number;
  createdAt: number;
  publishedAt: number | null;
}

// Fallback used only when categories haven't loaded yet
export const CATEGORY_META_FALLBACK: Record<string, { label: string; color: string; icon: string }> = {
  code:  { label: "Code",          color: "#3B6EFF", icon: "⌨" },
  docs:  { label: "Docs",          color: "#2ECC8A", icon: "📄" },
  data:  { label: "Data",          color: "#4AB8E8", icon: "🗄" },
  ui:    { label: "UI / Frontend", color: "#C45FD4", icon: "🖥" },
  infra: { label: "Infra",         color: "#E88B3A", icon: "⚙" },
  ai:    { label: "AI & Agents",   color: "#E8503A", icon: "🤖" },
};

// Legacy alias kept for components not yet migrated
export const CATEGORY_META = CATEGORY_META_FALLBACK;
