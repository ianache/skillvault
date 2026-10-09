import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

// globals.css provides the portal tokens (--bg, --surface, --raised, --accent, ...) and the global
// `:focus-visible` ring (D-12). `data-theme` switches light/dark exactly like the portal's ThemeToggle (D-7).
const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Tema del portal",
      toolbar: {
        title: "Tema",
        icon: "mirror",
        items: [
          { value: "dark", title: "Oscuro" },
          { value: "light", title: "Claro" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "dark" },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "light" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      document.body.style.background = "var(--bg)";
      return (
        <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sv-font-display, sans-serif)", padding: 24, minHeight: "100vh" }}>
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: { disabled: true },
  },
};

export default preview;
