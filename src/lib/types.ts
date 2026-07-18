export type SkillType = "code" | "docs" | "data" | "ui" | "infra" | "ai";
export type SkillStatus = "draft" | "in_review" | "published" | "rejected";

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
  status: SkillStatus;
  installCount: number;
  createdAt: number;
  publishedAt: number | null;
}

export const CATEGORY_META: Record<SkillType, { label: string; color: string; icon: string }> = {
  code:  { label: "Code",          color: "#3B6EFF", icon: "⌨" },
  docs:  { label: "Docs",          color: "#2ECC8A", icon: "📄" },
  data:  { label: "Data",          color: "#4AB8E8", icon: "🗄" },
  ui:    { label: "UI / Frontend", color: "#C45FD4", icon: "🖥" },
  infra: { label: "Infra",         color: "#E88B3A", icon: "⚙" },
  ai:    { label: "AI & Agents",   color: "#E8503A", icon: "🤖" },
};
