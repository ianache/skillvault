import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PackageCard, type PackageCardPackage } from "./PackageCard";

// CMP-ORG-001. One story per variant/state of the spec. Switch light/dark with the toolbar "Tema".
const published: PackageCardPackage = {
  slug: "qa-starter",
  name: "QA Starter",
  description: "Conjunto base de Skills de pruebas para equipos de QA: diseño de casos, revisión y reporte de defectos.",
  role: "QA",
  status: "published",
  version: "1.2.0",
  skillCount: 8,
};

const allActions = { edit: true, duplicate: true, review: true, retire: true };

const meta = {
  title: "Packages/PackageCard",
  component: PackageCard,
  tags: ["autodocs"],
  args: { package: published, actions: allActions, variant: "maintenance", onEvent: fn() },
  // Single-card stories are width-limited; stories that show a layout set `parameters.wide`.
  decorators: [(Story, context) => <div style={{ maxWidth: context.parameters.wide ? undefined : 420 }}><Story /></div>],
} satisfies Meta<typeof PackageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = {};

export const Draft: Story = {
  args: { package: { ...published, slug: "data-kit", name: "Data Kit", role: "Data", status: "draft", version: null, skillCount: 3 } },
};

export const RetiredWithWarning: Story = {
  args: {
    package: { ...published, slug: "legacy-bridge", name: "Legacy Bridge", role: "Infraestructura", status: "retired", version: "0.9.1", skillCount: 2, retiredSkillCount: 1 },
    warningText: "Paquete obsoleto: no instalar en entornos productivos.",
    actions: { edit: true, duplicate: true, review: true },
  },
};

export const WithRetiredSkills: Story = {
  args: { package: { ...published, retiredSkillCount: 2 } },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledWithExplanation: Story = {
  args: { disabled: true, warningText: "Pendiente de revalidación por el equipo de seguridad." },
};

export const PublicReadonly: Story = {
  args: { variant: "public-readonly" },
};

export const LongContent: Story = {
  args: {
    package: {
      ...published,
      name: "Paquete con un nombre extraordinariamente largo que no debe romper el diseño de la tarjeta",
      description: "Descripción larga ".repeat(40),
    },
  },
};

/** Spec: one column on mobile (~360px); the content wraps instead of overflowing. */
export const NarrowContainer: Story = {
  decorators: [(Story) => <div style={{ width: 360 }}><Story /></div>],
};

/** Spec: grid of columns on desktop. Responsive with intrinsic grid (D-13), no media queries. */
export const GridDesktop: Story = {
  parameters: { wide: true },
  decorators: [
    () => (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 1100 }}>
        <PackageCard package={published} actions={allActions} />
        <PackageCard package={{ ...published, slug: "data-kit", name: "Data Kit", role: "Data", status: "draft", version: null, skillCount: 3 }} actions={allActions} />
        <PackageCard package={{ ...published, slug: "legacy-bridge", name: "Legacy Bridge", role: "Infra", status: "retired", version: "0.9.1", retiredSkillCount: 1 }} actions={allActions} />
      </div>
    ),
  ],
};

/** Interaction: keyboard order (title link, then actions) and event payloads. */
export const KeyboardAndEvents: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "QA Starter" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Editar QA Starter" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onEvent).toHaveBeenCalledWith({ type: "edit", slug: "qa-starter" });
    await userEvent.click(canvas.getByRole("button", { name: "Retirar QA Starter" }));
    await expect(args.onEvent).toHaveBeenCalledWith({ type: "retire", slug: "qa-starter" });
  },
};

/** Interaction: disabled actions do not emit events. */
export const DisabledEmitsNothing: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const edit = canvas.getByRole("button", { name: "Editar QA Starter" });
    await expect(edit).toBeDisabled();
    await userEvent.click(edit);
    await expect(args.onEvent).not.toHaveBeenCalled();
  },
};
