import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PackageStatus } from "./PackageStatus";

// CMP-ATOM-001. One story per variant/state of the spec. Switch light/dark with the toolbar "Tema".
const meta = {
  title: "Packages/PackageStatus",
  component: PackageStatus,
  tags: ["autodocs"],
  args: { value: "published" },
} satisfies Meta<typeof PackageStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = { args: { value: "draft" } };
export const Published: Story = { args: { value: "published" } };
export const Retired: Story = { args: { value: "retired" } };

export const WithVersion: Story = { args: { value: "published", version: "1.2.0" } };

export const RetiredWithWarning: Story = {
  args: { value: "retired", version: "1.0.0", warning: "Ya no se admiten nuevas instalaciones de este paquete." },
};

export const Compact: Story = { args: { value: "published", version: "1.2.0", compact: true } };

/** D-14: an unknown status is a visible error; the received value is never rendered. */
export const UnknownStatusError: Story = { args: { value: "archived" as never } };

/** Spec: inline and wrap-safe in a narrow (360px) container. */
export const NarrowContainer: Story = {
  args: { value: "retired", version: "1.0.0", warning: "Ya no se admiten nuevas instalaciones de este paquete ni de sus Skills dependientes." },
  decorators: [(Story) => <div style={{ width: 360, border: "1px dashed var(--border)", padding: 8 }}><Story /></div>],
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <PackageStatus value="draft" />
      <PackageStatus value="published" version="1.2.0" />
      <PackageStatus value="retired" version="1.0.0" warning="Ya no se admiten nuevas instalaciones." />
    </div>
  ),
};
