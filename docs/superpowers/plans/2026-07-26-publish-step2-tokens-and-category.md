# Publicar Skill — Mockup Tokens + Category Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded hex colors in the "Publicar Skill.dc.html" Claude Design mockup with CSS custom-property tokens matching the live app's light theme, and add a working "Categoría del skill" selector to the real `Step2Editor.tsx` component.

**Architecture:** Task 1 pushes a fully re-tokenized version of the remote mockup file via the `DesignSync` tool (read-only visual change, no logic). Tasks 2-3 modify `src/components/wizard/Step2Editor.tsx` to fetch `/api/categories` (same pattern as `Step1Metadata.tsx`) and render a tag-button category selector that reads/writes `metadata.type` in the raw `content` string via regex (same pattern as `buildContent()` in `src/app/publish/page.tsx`).

**Tech Stack:** Next.js 15 (App Router), React, TypeScript, inline styles with CSS custom properties (no CSS-in-JS library, no Tailwind for this component), `gray-matter` for frontmatter parsing. Claude Design mockups (`.dc.html`) are static HTML+JS previews, edited via the `DesignSync` MCP tool.

## Global Constraints

- Do not change any rendered color value in the mockup — this is a reference-only change (hex literal → `var(--token)`), never a visual redesign. Spec: `docs/superpowers/specs/2026-07-26-publish-step2-tokens-and-category-design.md`.
- Only tokenize hex values that exactly match an existing `src/app/globals.css` light-theme token. Leave every other hex/rgba literal untouched (sidebar dark palette, near-miss colors) — do not invent new tokens or approximate.
- Do not touch the local file `.designs/SkillVault Publicar Skill (Light).dc.html` — confirmed unrelated content (a stale `/signin` dashboard mockup, not a mirror of this design).
- Category selector must use the tag-button visual style already used by `Step1Metadata.tsx:126-154`, not a plain `<select>` (matches the design doc's explicit choice for wizard-wide consistency).
- No automated test suite exists for wizard UI components (the repo's only test suite covers the review workflow, per `CLAUDE.md`) — verification for both tasks is manual (`pnpm lint` + dev-server check).

---

### Task 1: Tokenize the remote "Publicar Skill.dc.html" mockup

**Files:**
- Modify (remote, via `DesignSync`): `Publicar Skill.dc.html` in Claude Design project `7fb6161e-1057-4869-b0b0-224b134dfeb3`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing consumed by later tasks (this is the design-tool side, independent of Tasks 2-3).

- [ ] **Step 1: Write the fully re-tokenized file content**

Call `DesignSync` with `method: "finalize_plan"`, `projectId: "7fb6161e-1057-4869-b0b0-224b134dfeb3"`, `writes: ["Publicar Skill.dc.html"]` to obtain a `planId`.

Then call `DesignSync` with `method: "write_files"`, the same `projectId`, the `planId` from above, and `files: [{ path: "Publicar Skill.dc.html", data: <content below> }]` — where `<content below>` is this **exact** file content (every hex literal that exactly matched a `globals.css` light-theme token has been replaced with `var(--token)`; every hex with no exact token match, and the entire sidebar's dark palette, is left as-is on purpose — see the Global Constraints section):

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f7f5f0;
      --surface: #ffffff;
      --border: #e6e1d8;
      --border-subtle: #d8d2c5;
      --accent: #a9772e;
      --text: #1a1d21;
      --muted: #5c6270;
      --faint: #8a8f99;
      --green: #0f9488;
      --font-geist: 'Space Grotesk', sans-serif;
      --font-jetbrains-mono: 'JetBrains Mono', monospace;
    }
    body { margin: 0; background: var(--bg); }
    a { color: var(--accent); }
    a:hover { color: #7a5f26; }
  </style>
</helmet>

<div style="min-height: 100vh; width: 100%; background: var(--bg); font-family: var(--font-geist); color: var(--text); display: flex;">

  <aside style="width: 264px; flex-shrink: 0; background: #1c1a17; color: #c9c5bd; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; box-sizing: border-box;">
    <div style="display: flex; align-items: center; gap: 10px; padding: 18px 20px; flex-shrink: 0;">
      <div style="width: 30px; height: 30px; border-radius: 8px; background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; font-size: 13px; color: #1c1a17;">SV</div>
      <span style="font-weight: 700; font-size: 16px; color: #f2efe9; white-space: nowrap;">SkillVault</span>
      <div style="flex: 1;"></div>
      <button type="button" aria-label="Colapsar menú" style="background: none; border: none; padding: 4px; cursor: pointer; color: #8a8578;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
      </button>
    </div>

    <div style="flex: 1; overflow-y: auto; padding: 8px 14px 14px;">
      <sc-for list="{{ menuGroups }}" as="group" hint-placeholder-count="4">
        <div style="margin-top: 18px;">
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: #6f6a5d; text-transform: uppercase; padding: 0 10px 8px;">{{ group.title }}</div>
          <sc-for list="{{ group.items }}" as="item" hint-placeholder-count="2">
            <div style="display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: 13.5px; font-weight: 500; color: {{ item.color }}; background: {{ item.bg }}; cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{{ item.color }}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="{{ item.iconPath }}"></path></svg>
              <span style="white-space: nowrap;">{{ item.label }}</span>
            </div>
          </sc-for>
        </div>
      </sc-for>
    </div>

    <div style="display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid #302c26; flex-shrink: 0;">
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #3a352c; color: #e8e4da; font-size: 11.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">N</div>
      <span style="font-family: var(--font-jetbrains-mono); font-size: 11.5px; color: #6f6a5d;">SkillVault v0.3.0</span>
    </div>
  </aside>

  <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">

    <div style="display: flex; align-items: center; gap: 20px; height: 64px; padding: 0 28px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; flex-shrink: 0;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; flex-shrink: 0;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"></path><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"></path></svg>
        <span style="color: var(--muted);">Inicio</span>
        <span style="color: #c9c2b3;">/</span>
        <span style="font-weight: 600;">Publicar skill</span>
      </div>
      <div style="flex: 1; max-width: 520px; margin: 0 auto; position: relative;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.3-4.3"></path></svg>
        <input type="text" placeholder="Buscar skills, triggers, herramientas..." style="width: 100%; box-sizing: border-box; padding: 9px 14px 9px 36px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); font-family: var(--font-geist); font-size: 13.5px; color: var(--text);">
      </div>
      <div style="display: flex; align-items: center; gap: 14px; flex-shrink: 0;">
        <button type="button" aria-label="Modo oscuro" style="background: none; border: none; padding: 4px; cursor: pointer; color: var(--muted); display: flex;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path></svg>
        </button>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #ffffff; font-weight: 700; font-size: 12.5px; display: flex; align-items: center; justify-content: center;">AS</div>
        <button type="button" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); font-family: var(--font-geist); font-size: 13px; font-weight: 600; color: var(--text); cursor: pointer;">Salir</button>
      </div>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 44px; flex-wrap: wrap; row-gap: 16px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 34px; height: 34px; border-radius: 9px; background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </div>
        <span style="font-size: 18px;"><span style="font-weight: 700;">SkillVault</span> <span style="color: #c9c2b3;">/</span> <span style="font-weight: 700;">Publicar Skill</span></span>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <sc-for list="{{ steps }}" as="step" hint-placeholder-count="4">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: {{ step.bg }}; color: {{ step.fg }}; border: {{ step.border }};">
                <sc-if value="{{ step.isDone }}" hint-placeholder-val="{{ false }}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                </sc-if>
                <sc-if value="{{ step.isNotDone }}" hint-placeholder-val="{{ true }}">
                  <span>{{ step.number }}</span>
                </sc-if>
              </div>
              <span style="font-size: 13.5px; font-weight: {{ step.labelWeight }}; color: {{ step.labelColor }}; white-space: nowrap;">{{ step.label }}</span>
            </div>
            <sc-if value="{{ step.hasConnector }}" hint-placeholder-val="{{ true }}">
              <div style="width: 32px; height: 2px; background: {{ step.connectorColor }};"></div>
            </sc-if>
          </div>
        </sc-for>
      </div>
    </div>

    <main style="flex: 1; padding: 8px 44px 60px; box-sizing: border-box; min-width: 0; overflow-x: auto;">

      <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 8px 0;">Paso 2 — Editor SKILL.md</h1>
      <p style="margin: 0 0 26px 0; color: var(--muted); font-size: 14.5px; max-width: 70ch;">Edita el contenido completo. El unico bloqueo para continuar es superar 300 lineas.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start;">

        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
          <div style="display: flex; gap: 4px; padding: 10px 16px 0; border-bottom: 1px solid var(--border);">
            <button type="button" style="background: none; border: none; padding: 8px 4px 12px; margin-right: 20px; font-size: 13.5px; font-weight: 600; color: var(--accent); border-bottom: 2px solid var(--accent); cursor: pointer;">Editor</button>
            <button type="button" style="background: none; border: none; padding: 8px 4px 12px; font-size: 13.5px; font-weight: 500; color: var(--muted); cursor: pointer;">Preview</button>
          </div>
          <div style="font-family: var(--font-jetbrains-mono); font-size: 13px; line-height: 1.7; max-height: 620px; overflow: auto; padding: 16px 0;">
            <sc-for list="{{ codeLines }}" as="line" hint-placeholder-count="21">
              <div style="display: flex; background: {{ line.rowBg }};">
                <div style="width: 42px; flex-shrink: 0; text-align: right; padding: 0 14px; color: #b3ab99; user-select: none; border-right: 1px solid #eee9dd;">{{ line.num }}</div>
                <div style="flex: 1; min-width: 0; padding: 0 16px; white-space: pre; color: var(--text);">{{ line.text }}</div>
              </div>
            </sc-for>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px;">
            <label style="font-size: 11px; font-weight: 600; color: var(--faint); text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 8px;">Categoría del skill</label>
            <select value="{{ category }}" onChange="{{ onCategoryChange }}" style="width: 100%; box-sizing: border-box; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border-subtle); background: #faf7f0; font-family: var(--font-geist); font-size: 13.5px; color: var(--text); cursor: pointer;">
              <sc-for list="{{ categoryOptions }}" as="opt" hint-placeholder-count="6">
                <option value="{{ opt.value }}">{{ opt.label }}</option>
              </sc-for>
            </select>
            <div style="font-size: 12px; color: var(--muted); margin-top: 8px;">Se aplica a <span style="font-family: var(--font-jetbrains-mono); color: var(--accent);">metadata.type</span> en el editor.</div>
          </div>

          <div style="background: #eefaf7; border: 1px solid #b9e5da; border-radius: 12px; padding: 18px 20px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; margin-bottom: 16px;">
              <span style="color: var(--green);">OK</span>
              <span style="font-family: var(--font-jetbrains-mono); font-weight: 600; color: var(--text);">Dentro del limite</span>
            </div>

            <div style="background: var(--surface); border: 1px solid #b9e5da; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
              <div style="font-family: var(--font-jetbrains-mono); font-size: 11.5px; color: var(--green); margin-bottom: 4px;">lineas</div>
              <div style="font-size: 13px; color: var(--text);">{{ lineCount }} de 300 lineas permitidas.</div>
            </div>

            <div style="background: var(--surface); border: 1px solid #b9e5da; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
              <div style="font-family: var(--font-jetbrains-mono); font-size: 11.5px; color: var(--green); margin-bottom: 4px;">descripcion (frontmatter)</div>
              <div style="font-size: 13px; color: var(--text);">94 de 20-280 caracteres permitidos.</div>
            </div>

            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text); cursor: pointer;">
              <input type="checkbox" checked="{{ acceptChecked }}" onChange="{{ onToggleAccept }}">
              Acepto continuar con la publicacion
            </label>
          </div>

          <div style="text-align: right; font-family: var(--font-jetbrains-mono); font-size: 12px; color: var(--muted);">{{ charCount }} chars · {{ lineCount }} lineas</div>

        </div>
      </div>
    </main>
  </div>
</div>

</x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;$preview&quot;: {&quot;width&quot;: 1440, &quot;height&quot;: 900}}">
const STEPS = [
  { number: 1, label: 'Metadatos', status: 'done' },
  { number: 2, label: 'Editor', status: 'active' },
  { number: 3, label: 'Requisitos', status: 'pending' },
  { number: 4, label: 'Revisión', status: 'pending' },
];

const CATEGORY_OPTIONS = [
  { value: 'code', label: 'Code' },
  { value: 'infra', label: 'Infra' },
  { value: 'ui', label: 'UI / Frontend' },
  { value: 'ai-agents', label: 'AI / Agentes' },
  { value: 'security', label: 'Seguridad' },
  { value: 'data', label: 'Datos' },
  { value: 'docs', label: 'Documentación' },
  { value: 'testing', label: 'Testing' },
];

const MENU_GROUPS = [
  { title: 'Exploración', items: [
    { label: 'Catálogo', iconPath: 'M4 4h16v4H4zM4 12h16v8H4z', active: false },
    { label: 'Publicar skill', iconPath: 'M12 5v14M5 12h14', active: true },
  ] },
  { title: 'Mi contenido', items: [
    { label: 'Mis Skills', iconPath: 'M12 2l2.9 6.06 6.6.77-4.86 4.6 1.25 6.57L12 16.9l-5.9 3.1 1.25-6.57-4.86-4.6 6.6-.77z', active: false },
    { label: 'Mis propuestas', iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6M9 11h2', active: false },
  ] },
  { title: 'Revisión', items: [
    { label: 'Cola de revisión', iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', active: false },
    { label: 'Categorías', iconPath: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z', active: false },
  ] },
  { title: 'Administración', items: [
    { label: 'Usuarios y roles', iconPath: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', active: false },
  ] },
];

function buildLines(category) {
  const raw = [
    '---',
    'name: "code-review"',
    'description: "Revisa el diff actual buscando bugs, problemas de seguridad y\n  oportunidades de simplificación."',
    'version: "2.1.0"',
    'schema_version: "1.1"',
    'author: "@anthropic"',
    'metadata:',
    `  type: ${category}`,
    '  triggers:',
    '  - "/code-review"',
    '  - "revisar código"',
    '  - "review diff"',
    '  - "buscar bugs"',
    '  tools:',
    '  - "Read"',
    '  - "Grep"',
    '  - "Glob"',
    '  - "Edit"',
    '  - "Agent"',
    'compatibility:',
    '  - "claude"',
    '  - "chatgpt"',
    '---',
    '',
    '# Code Review',
    '',
    'Analiza el diff actual del repositorio y reporta:',
    '',
    '1. Bugs y errores lógicos',
    '2. Problemas de seguridad',
    '3. Oportunidades de simplificación',
    '4. Cobertura de tests faltante',
    '',
    'Usa `git diff` para obtener el contexto y prioriza los hallazgos',
    'por severidad.',
  ];
  return raw.map((text, i) => ({
    num: i + 1,
    text,
    rowBg: i === 7 ? '#f4ede0' : 'transparent',
  }));
}

class Component extends DCLogic {
  state = { category: 'code', acceptChecked: false };

  onCategoryChange = (e) => this.setState({ category: e.target.value });
  onToggleAccept = () => this.setState((s) => ({ acceptChecked: !s.acceptChecked }));

  renderVals() {
    const activeIndex = STEPS.findIndex((s) => s.status === 'active');
    const steps = STEPS.map((s, i) => ({
      number: s.number,
      label: s.label,
      isDone: s.status === 'done',
      isNotDone: s.status !== 'done',
      bg: s.status === 'done' ? 'var(--green)' : s.status === 'active' ? 'var(--accent)' : 'var(--surface)',
      fg: s.status === 'pending' ? 'var(--faint)' : '#ffffff',
      border: s.status === 'pending' ? '1px solid var(--border-subtle)' : 'none',
      labelWeight: s.status === 'active' ? 700 : 500,
      labelColor: s.status === 'pending' ? 'var(--faint)' : 'var(--text)',
      hasConnector: i < STEPS.length - 1,
      connectorColor: i < activeIndex ? 'var(--green)' : 'var(--border)',
    }));

    const menuGroups = MENU_GROUPS.map((g) => ({
      title: g.title,
      items: g.items.map((it) => ({
        label: it.label,
        iconPath: it.iconPath,
        color: it.active ? '#e8ab6a' : '#c9c5bd',
        bg: it.active ? 'rgba(169,119,46,0.28)' : 'transparent',
      })),
    }));

    const codeLines = buildLines(this.state.category);
    const charCount = codeLines.map((l) => l.text).join('\n').length;

    return {
      steps,
      menuGroups,
      categoryOptions: CATEGORY_OPTIONS,
      category: this.state.category,
      onCategoryChange: this.onCategoryChange,
      codeLines,
      lineCount: codeLines.length,
      charCount,
      acceptChecked: this.state.acceptChecked,
      onToggleAccept: this.onToggleAccept,
    };
  }
}

</script>
</body>
</html>
```

- [ ] **Step 2: Verify the write succeeded**

Call `DesignSync` with `method: "get_file"`, the same `projectId`, `path: "Publicar Skill.dc.html"`. Confirm the returned content contains `:root {` and `var(--accent)` and no longer contains a bare `background: #f7f5f0;` on the outer wrapper div (it should now read `background: var(--bg);`).

- [ ] **Step 3: Commit note** (no local files changed — nothing to commit for this task; the change lives only in the remote Claude Design project)

---

### Task 2: Fetch categories in Step2Editor

**Files:**
- Modify: `src/components/wizard/Step2Editor.tsx:1-21`

**Interfaces:**
- Consumes: `Category` type from `src/lib/types.ts` (`{ slug: string; label: string; icon: string; color: string; description: string; sort_order: number }`), `/api/categories` endpoint (`GET` → `{ categories: Category[] }`, confirmed at `src/app/api/categories/route.ts:5-10`).
- Produces: `categories: Category[]` state, available to Task 3's JSX in the same component.

- [ ] **Step 1: Add the import and state**

In `src/components/wizard/Step2Editor.tsx`, change the top imports and add state:

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import matter from "gray-matter";
import { Category } from "@/lib/types";
```

Inside the component, right after the existing `useState` declarations (after `const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");`), add:

```tsx
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);
```

- [ ] **Step 2: Typecheck/lint**

Run: `pnpm lint`
Expected: no new errors or warnings reported for `src/components/wizard/Step2Editor.tsx` (the file had zero lint issues before this change — compare against a `pnpm lint` run before this edit if unsure).

- [ ] **Step 3: Commit**

```bash
git add src/components/wizard/Step2Editor.tsx
git commit -m "feat: fetch categories in Step2Editor for the upcoming selector"
```

---

### Task 3: Render the category selector and wire it to `metadata.type`

**Files:**
- Modify: `src/components/wizard/Step2Editor.tsx` (the sticky right-column JSX, currently starting at what is line 273 before Task 2's edit — re-locate by searching for `{/* Publication responsibility panel */}`)

**Interfaces:**
- Consumes: `categories: Category[]` state and the `fm` object from Task 2 / the existing `const { fm, body } = renderPreview(content);` call (`fm.metadata?.type` reads the current category slug).
- Produces: nothing consumed by later tasks — this is the last task in the plan.

- [ ] **Step 1: Add the content-rewrite handler**

Directly below the existing `handleAcceptanceChange` function in `Step2Editor.tsx` (currently right before the `return (` of the component), add:

```tsx
  function handleCategoryChange(slug: string) {
    if (/  type: .+/m.test(content)) {
      onChange(content.replace(/  type: .+/m, `  type: ${slug}`));
    }
  }
```

- [ ] **Step 2: Render the selector above the responsibility panel**

Find this block (the sticky right column):

```tsx
        {/* Publication responsibility panel */}
        <div style={{ position: "sticky", top: "72px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: `1px solid ${lineLimitExceeded ? "var(--red)" : "var(--green)"}`,
```

Insert a new sibling `<div>` immediately after the `<div style={{ position: "sticky", top: "72px" }}>` opening tag and before the responsibility panel's `<div>`:

```tsx
        {/* Publication responsibility panel */}
        <div style={{ position: "sticky", top: "72px" }}>
          {/* Category selector */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "8px",
              }}
            >
              Categoría del skill
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {categories.map((cat) => {
                const active = fm.metadata?.type === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleCategoryChange(cat.slug)}
                    style={{
                      fontFamily: "var(--font-geist), sans-serif",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      padding: "7px 12px",
                      borderRadius: "7px",
                      border: `1px solid ${active ? cat.color : "var(--border)"}`,
                      background: active ? `${cat.color}18` : "var(--bg)",
                      color: active ? cat.color : "var(--muted)",
                      cursor: "pointer",
                      transition: "all .1s",
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: `1px solid ${lineLimitExceeded ? "var(--red)" : "var(--green)"}`,
```

(the rest of that `<div>` and everything after it stays exactly as it already is — only the new category-selector `<div>` is inserted before it).

- [ ] **Step 3: Typecheck/lint**

Run: `pnpm lint`
Expected: no new errors or warnings for `src/components/wizard/Step2Editor.tsx`.

- [ ] **Step 4: Manual verification**

Run: `pnpm dev --port 3010`

1. Sign in with a `editor`/`admin` Keycloak account and open `/publish`.
2. Click "Empezar desde cero sin cargar archivos" to skip the loader, fill in Paso 1 with any valid values including a category (e.g. "Code"), click "Siguiente → Editor".
3. On Paso 2, confirm the new "Categoría del skill" panel appears above "Dentro del límite", with the category chosen in Paso 1 shown as active (colored border/background matching that category's color).
4. Click a different category tag. Confirm: (a) it becomes the active one, (b) switching to the "Preview" tab shows the updated `Tipo` value in the frontmatter summary card, matching the newly selected category's slug.
5. Confirm no console errors in the browser devtools during any of the above.

Expected: all four checks pass. If the loaded/created skill's frontmatter doesn't have a `metadata:`/`type:` line in some edge case (e.g. a hand-edited `SKILL.md` missing that block), clicking a category tag is a no-op — this is the documented, accepted behavior from the design spec, not a bug.

- [ ] **Step 5: Commit**

```bash
git add src/components/wizard/Step2Editor.tsx
git commit -m "feat: add category selector to Step2Editor, wired to metadata.type"
```

---

## Self-Review Notes

- **Spec coverage:** Parte A → Task 1 (remote-only, per user's clarification that the local `.designs` file is unrelated). Parte B → Tasks 2-3 (fetch categories, render selector, regex-rewrite `metadata.type`). Edge case (missing `type:` line) documented in Task 3 Step 4, matching the spec's "Fuera de alcance" note.
- **No placeholders:** the full tokenized mockup content is given verbatim in Task 1; the exact code diffs are given verbatim in Tasks 2-3.
- **Type consistency:** `Category` (`slug`, `label`, `icon`, `color`) is used identically in Task 3's JSX as it's defined in `src/lib/types.ts` and already consumed the same way in `Step1Metadata.tsx`. `handleCategoryChange(slug: string)` in Task 3 matches the `cat.slug` (string) passed to it.
