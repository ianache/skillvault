import {
  hasCapability,
  type SkillVaultCapability,
} from "@/lib/auth/access-policy";

export type NavigationItem = {
  label: string;
  href: string;
  iconPath: string;
  capability?: SkillVaultCapability;
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const NAVIGATION: NavigationGroup[] = [
  {
    title: "Exploración y Contenido",
    items: [
      { label: "Catálogo", href: "/", iconPath: "M4 4h16v4H4zM4 12h16v8H4z" },
      {
        label: "Agentes IA",
        href: "/agents",
        iconPath: "M12 3l-1.912 5.813a2 2 0 01-1.275 1.275L3 12l5.813 1.912a2 2 0 011.275 1.275L12 21l1.912-5.813a2 2 0 011.275-1.275L21 12l-5.813-1.912a2 2 0 01-1.275-1.275Z",
        capability: "content:manage",
      },
      {
        label: "Publicar skill",
        href: "/publish",
        iconPath: "M12 5v14M5 12h14",
        capability: "publish:create",
      },
      {
        label: "Mis Skills",
        href: "/dashboard",
        iconPath: "M12 2l2.9 6.06 6.6.77-4.86 4.6 1.25 6.57L12 16.9l-5.9 3.1 1.25-6.57-4.86-4.6 6.6-.77z",
        capability: "content:manage",
      },
      {
        label: "Mis propuestas",
        href: "/proposals",
        iconPath: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6M9 11h2",
        capability: "content:manage",
      },
    ],
  },
  {
    title: "Gestión y Administración",
    items: [
      {
        label: "Cola de revisión",
        href: "/review",
        iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        capability: "review:manage",
      },
      {
        label: "Categorías",
        href: "/categories",
        iconPath: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
        capability: "admin:manage",
      },
      {
        label: "Usuarios y roles",
        href: "/users",
        iconPath: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
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
