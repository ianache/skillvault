import {
  hasCapability,
  type SkillVaultCapability,
} from "@/lib/auth/access-policy";

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  capability?: SkillVaultCapability;
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const NAVIGATION: NavigationGroup[] = [
  {
    title: "Exploraci\u00f3n",
    items: [
      { label: "Cat\u00e1logo", href: "/", icon: "\u{1F50D}" },
      {
        label: "Publicar skill",
        href: "/publish",
        icon: "\u2795",
        capability: "publish:create",
      },
    ],
  },
  {
    title: "Mi Contenido",
    items: [
      {
        label: "Mis Skills",
        href: "/dashboard",
        icon: "\u{1F4E6}",
        capability: "content:manage",
      },
      {
        label: "Mis propuestas",
        href: "/proposals",
        icon: "\u{1F4DD}",
        capability: "content:manage",
      },
    ],
  },
  {
    title: "Revisi\u00f3n",
    items: [
      {
        label: "Cola de revisi\u00f3n",
        href: "/review",
        icon: "\u{1F6E1}\uFE0F",
        capability: "review:manage",
      },
      {
        label: "Categor\u00edas",
        href: "/categories",
        icon: "\u{1F3F7}\uFE0F",
        capability: "admin:manage",
      },
    ],
  },
  {
    title: "Administraci\u00f3n",
    items: [
      {
        label: "Usuarios y roles",
        href: "/users",
        icon: "\u{1F465}",
        capability: "admin:manage",
      },
    ],
  },
];

export function getNavigationGroups(roles: readonly string[]): NavigationGroup[] {
  return NAVIGATION
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.capability || hasCapability(roles, item.capability),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
