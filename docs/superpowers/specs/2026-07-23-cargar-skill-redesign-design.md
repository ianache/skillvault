# Design Spec: Cargar Skill Local Page Redesign

**Date:** 2026-07-23  
**Status:** Approved  
**Branch:** `master`  

---

## 1. Overview & Context

This design spec details the UI and functional enhancements for the "Cargar Skill local" screen (`/publish` step 0), matching the `Cargar Skill.dc.html` design specifications with 100% visual fidelity.

---

## 2. Navigation & Layout Integration

### 2.1 App Shell Breadcrumb Alignment
- Uses the standard App Shell navigation header bar (`AppTopBar.tsx`).
- Breadcrumb route trail: `🏠 Inicio / Publicar skill / Cargar Skill local`.

---

## 3. Dropzone & Selection UI (`src/components/wizard/LocalSkillLoader.tsx`)

### 3.1 Drag & Drop Zone
- Implements interactive drag-and-drop state (`isDragging: boolean`).
- Handles folder drops (via `DataTransferItem.webkitGetAsEntry()`) and `.zip` file drops.
- Displays responsive border highlights (`border: 2px dashed var(--accent)`).

### 3.2 Expected Structure Guide
Displays a styled terminal-like code box with required folder structure:
```text
mi-skill/
  ├── SKILL.md          ← requerido
  ├── resources/
  │   └── reference.md
  └── scripts/
      └── process.py
```

### 3.3 Upload Cards (`UploadCard`)
- **Seleccionar carpeta**: Uses `<input type="file" webkitdirectory />`.
- **Subir archivo .zip**: Uses `<input type="file" accept=".zip" />`.
- Styled with hover elevation and SVG vector icons.

---

## 4. Skill Preview & Confirmation (`LocalSkillLoader.tsx`)

### 4.1 Automated Classification & Preview
- Validates existence of `SKILL.md`.
- Classifies attached files into `resources` (`📄`) and `scripts` (`⚡`).
- Renders green glassmorphism success card with source label and file counts.
- Displays primary action button `Cargar en el wizard →`.
- Provides secondary option *"Empezar desde cero sin cargar archivos"*.

---

## 5. Verification Strategy

1. **TypeScript Check**: `npx tsc --noEmit` must pass with 0 errors.
2. **Smoke & Unit Tests (`src/lib/review/ui-smoke.test.ts`)**:
   - Verify `LocalSkillLoader` and `PublishPage` components render and process local skill files without error.
3. **Full Test Suite**: `pnpm test` must pass all tests cleanly.
