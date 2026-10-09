---
artifact: react-component-architecture
okf: google-okf-v0.2
id: RCA-DSP-2026-001
title: "React component architecture — package components"
generated:
  by: web-atomic-component-designer/0.3.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
  - /knowledge-base/design/atomic-components/micro-ui-boundary-analysis.md
  - /knowledge-base/design/atomic-components/angular-library-architecture.md
provenance:
  created_by: web-atomic-component-designer/0.3.0
  method: reconciliation-with-adr-004-adr-005
  confidence: medium
human-reviewed: false
---

# React component architecture — package components

Reemplaza a `angular-library-architecture.md` (ALA-DSP-2026-001), invalidado por `ADR-004` (Next.js sobre React). Todo lo no decidido por las ADR figura como propuesta o pregunta abierta.

## Decisiones aplicables

- `ADR-004`: Next.js sobre React es la tecnología del frontend web; Angular descartado.
- `ADR-005`: Storybook para desarrollar, documentar y probar los componentes UI.
- No decididos: sistema de diseño o biblioteca de componentes, renderizado por ruta (SSR/SSG/CSR), extracción a otra librería o framework.

## Boundary (propuesta)

Los componentes viven **dentro del portal**, en `src/components/packages/`, junto a los `*Client.tsx` existentes. No hay librería independiente ni entry point `@skillvault/ui/packages`.

## Layers

- Atoms: `PackageStatus`, icono, selector de filtro.
- Molecules: meta, acciones, resultado de Skill, fila de Skill seleccionada.
- Organisms: `PackageCard`, `PackageSearchPanel`, `PackageSkillPicker`, grid de tarjetas.
- Templates: layouts de catálogo y editor.
- Pages: rutas de `src/app/packages/**`; no se extraen.

Estructura de carpetas por capa: pendiente de decisión (no se asume).

## Dependency policy

Los componentes presentacionales dependen solo de React y de los tokens del sistema de diseño. Clientes de API, autenticación, rutas, permisos y servicios de paquetes permanecen en las páginas y en los `*Client.tsx`. Dirección: `page → template → organism → molecule → atom`.

## Servidor y cliente

`PackageStatus` es puro y compatible con Server Components. Los organismos con estado o eventos requieren límite de cliente (`"use client"`). La estrategia de renderizado por ruta no está decidida.

## Pruebas

Storybook (`ADR-005`): una story por variante y estado de cada spec `CMP-*`; pruebas de interacción y accesibilidad. Se mantienen `next build` y la suite `tsx --test`.

## Unknowns

Versión de Storybook y compatibilidad con Next.js 16/React 19, addons y ejecutor, regresión visual, CI, sistema de diseño y tokens oficiales, estructura de carpetas, equipo propietario. Estado: `REQUIRES_REVIEW`.
