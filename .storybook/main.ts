import type { StorybookConfig } from "@storybook/nextjs-vite";

// ADR-005: Storybook to develop, document and test reusable UI components.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/nextjs-vite",
};

export default config;
