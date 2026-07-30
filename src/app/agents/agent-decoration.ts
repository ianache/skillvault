import { AIAgent } from "@/lib/agents/store";
import { SkillRow } from "@/lib/types";

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  dotColor: string;
  pulse: boolean;
}

export const STATUS_META: Record<AIAgent["status"], StatusMeta> = {
  active: { label: "ACTIVO", color: "var(--green)", bg: "rgba(var(--sv-teal-rgb),0.12)", dotColor: "var(--green)", pulse: true },
  draft: { label: "BORRADOR", color: "var(--muted)", bg: "var(--raised)", dotColor: "var(--faint)", pulse: false },
  paused: { label: "PAUSADO", color: "var(--red)", bg: "rgba(179,57,47,0.1)", dotColor: "var(--red)", pulse: false },
};

const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: "rgba(var(--sv-teal-rgb),0.16)", fg: "var(--green)" },
  { bg: "rgba(var(--sv-accent-rgb),0.14)", fg: "var(--accent-dim)" },
  { bg: "var(--raised)", fg: "var(--muted)" },
  { bg: "rgba(59,110,255,0.14)", fg: "#3B6EFF" },
];

function hashString(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(/\.$/, "");
}

export interface DecoratedAgent {
  id: string;
  name: string;
  model: string;
  description: string;
  owner: string;
  responsibility: string;
  deliverables: string[];
  dateLabel: string;
  initials: string;
  avatarBg: string;
  avatarFg: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  statusDotColor: string;
  statusPulse: boolean;
  skillsResolved: SkillRow[];
  skillsPreview: SkillRow[];
  hasSkills: boolean;
  hasNoSkills: boolean;
  hasMoreSkills: boolean;
  extraSkillsCount: number;
  hasDeliverables: boolean;
  hasNoDeliverables: boolean;
  isSelected: boolean;
}

export function decorateAgent(agent: AIAgent, skillCatalog: SkillRow[], isSelected: boolean): DecoratedAgent {
  const meta = STATUS_META[agent.status] ?? STATUS_META.paused;
  const tint = AVATAR_PALETTE[hashString(agent.id) % AVATAR_PALETTE.length];
  const skills = agent.skills ?? [];
  const deliverables = agent.deliverables ?? [];
  const skillsResolved = skills
    .map((slug) => skillCatalog.find((sk) => sk.slug === slug))
    .filter((sk): sk is SkillRow => Boolean(sk));

  return {
    id: agent.id,
    name: agent.name,
    model: agent.model,
    description: agent.description,
    owner: agent.owner ?? "",
    responsibility: agent.responsibility ?? "",
    deliverables,
    dateLabel: formatDateLabel(agent.createdAt),
    initials: getInitials(agent.name),
    avatarBg: tint.bg,
    avatarFg: tint.fg,
    statusLabel: meta.label,
    statusColor: meta.color,
    statusBg: meta.bg,
    statusDotColor: meta.dotColor,
    statusPulse: meta.pulse,
    skillsResolved,
    skillsPreview: skillsResolved.slice(0, 2),
    hasSkills: skillsResolved.length > 0,
    hasNoSkills: skillsResolved.length === 0,
    hasMoreSkills: skillsResolved.length > 2,
    extraSkillsCount: Math.max(0, skillsResolved.length - 2),
    hasDeliverables: deliverables.length > 0,
    hasNoDeliverables: deliverables.length === 0,
    isSelected,
  };
}
