# Cargar Skill Local Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the "Cargar Skill local" screen (`/publish` step 0) to align 100% with `Cargar Skill.dc.html`, implementing an interactive Drag & Drop dropzone, styled terminal structure guide, elevated selection cards, and a green glassmorphism preview confirmation card.

**Tech Stack:** Next.js (App Router), React, TypeScript, Vanilla CSS, Vitest.

---

### Task 1: Enhance `LocalSkillLoader.tsx` with Drag & Drop & Refined Preview

**Files:**
- Modify: `src/components/wizard/LocalSkillLoader.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/components/wizard/LocalSkillLoader.tsx`**

Implement drag-and-drop state, terminal structure visual guide, elevated upload cards, and preview card:

```tsx
"use client";

import { useRef, useState } from "react";

export interface LoadedFile {
  path: string;
  fileType: "resource" | "script";
  content: string;
}

export interface LoadedSkill {
  skillMd: string;
  files: LoadedFile[];
  sourceLabel: string;
}

interface Props {
  onLoaded: (skill: LoadedSkill) => void;
  onSkip: () => void;
}

export function LocalSkillLoader({ onLoaded, onSkip }: Props) {
  const folderRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ label: string; fileCount: number } | null>(null);
  const [pending, setPending] = useState<LoadedSkill | null>(null);

  // File loading handlers...
  // (processFiles, processZip implementation)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        // Handle folder drop or zip drop
      }}
      style={{
        border: isDragging ? "2px dashed var(--accent)" : "1px solid transparent",
        borderRadius: "12px",
        padding: "8px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          Cargar skill local
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
          Selecciona o arrastra una carpeta con tu <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>SKILL.md</code> o un archivo <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>.zip</code> con la estructura del skill.
        </p>
      </div>

      {/* Terminal Structure Card */}
      <div
        style={{
          background: "var(--raised)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "24px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.8,
        }}
      >
        <div style={{ color: "var(--faint)", marginBottom: "6px", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>
          Estructura esperada
        </div>
        <div><span style={{ color: "var(--accent)" }}>mi-skill/</span></div>
        <div>&nbsp;&nbsp;<span style={{ color: "var(--green)", fontWeight: 600 }}>SKILL.md</span> <span style={{ color: "var(--faint)" }}>← requerido</span></div>
        <div>&nbsp;&nbsp;resources/</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;reference.md</div>
        <div>&nbsp;&nbsp;scripts/</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;process.py</div>
      </div>

      {/* Upload Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
        <UploadCard
          icon="📁"
          label="Seleccionar carpeta"
          hint="Sube toda la carpeta del skill"
          onClick={() => folderRef.current?.click()}
          loading={loading}
        />
        <UploadCard
          icon="📦"
          label="Subir archivo .zip"
          hint="ZIP con estructura mi-skill/SKILL.md"
          onClick={() => zipRef.current?.click()}
          loading={loading}
        />
      </div>

      {/* Hidden inputs */}
      <input ref={folderRef} type="file" webkitdirectory="" multiple style={{ display: "none" }} onChange={handleFolder} />
      <input ref={zipRef} type="file" accept=".zip" style={{ display: "none" }} onChange={handleZip} />

      {/* Preview Card */}
      {preview && pending && (
        <div
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid var(--green)",
            borderRadius: "10px",
            padding: "20px 22px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", color: "var(--green)" }}>✓</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px", fontWeight: 600, color: "var(--green)" }}>
              {preview.label}
            </span>
          </div>
          <button
            type="button"
            onClick={confirmLoad}
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13.5px",
              fontWeight: 700,
              padding: "11px 22px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Cargar en el wizard →
          </button>
        </div>
      )}

      {/* Skip button */}
      <div style={{ textAlign: "center", paddingTop: "8px" }}>
        <button
          type="button"
          onClick={onSkip}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            color: "var(--muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Empezar desde cero sin cargar archivos
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/components/wizard/LocalSkillLoader.tsx
git commit -m "feat(ui): update LocalSkillLoader with drag-and-drop dropzone and visual preview"
```

---

### Task 2: Integrate `PublishPage` Layout & App Shell Breadcrumbs

**Files:**
- Modify: `src/app/publish/page.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/app/publish/page.tsx`**

Integrate top bar breadcrumbs and styled container in `PublishPage`:

```tsx
export default function PublishPage() {
  // ...
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/app/publish/page.tsx
git commit -m "feat(ui): align PublishPage header and step 0 layout with App Shell redesign"
```

---

### Task 3: UI Smoke Tests & End-to-End Verification

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/lib/review/ui-smoke.test.ts`**

Add smoke test assertions verifying `LocalSkillLoader` exports and renders structure guide and upload options.

- [ ] **Step 2: Run full verification suite**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS (49+ tests passing)

- [ ] **Step 3: Commit changes**

```bash
git add src/lib/review/ui-smoke.test.ts
git commit -m "test(ui): add smoke tests for LocalSkillLoader redesign"
```
