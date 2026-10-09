---
type: ADR
id: ADR-005
title: Usar Storybook para las pruebas de componentes UI
description: SkillVault utilizará Storybook como herramienta para desarrollar, documentar y probar los componentes UI reutilizables del frontend Next.js/React.
tags: [architecture, adr, frontend, testing, storybook]
status: draft
verified: false
adr_status: Aceptado
decision: { by: human:ianache, at: 2026-10-08T00:00:00-05:00 }
related: [ADR-004]
generated: { by: architecture-adr-writer/1.0, at: 2026-10-08T00:00:00-05:00 }
sources:
  - id: ADR-004
    resource: /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
    title: Usar Next.js y React para el frontend web
  - id: PRJ-001
    resource: /package.json
    title: Manifesto del proyecto SkillVault
  - id: DSP-2026-002
    resource: /knowledge-base/implementation/DSP-2026-002-componentes-ui-paquetes.md
    title: Componentes UI reutilizables de paquetes de Skills
---

# ADR-005 — Usar Storybook para las pruebas de componentes UI

- **Estado:** Aceptado (decisión humana); texto de la ADR pendiente de revisión.
- **Fecha:** 2026-10-08
- **Decisor:** human:ianache
- **Redacción:** `architecture-adr-writer/1.0`, a partir de una decisión humana explícita.
- **Revisión humana del texto:** pendiente; `verified: false`.

## Contexto

`ADR-004` fija Next.js sobre React como tecnología del frontend web y exige, en su impacto en pruebas, verificar accesibilidad WCAG 2.2 AA, interacción visual conforme a las especificaciones UX/UI y regresión sobre componentes compartidos. El repositorio no dispone hoy de herramientas para probar componentes: `package.json` solo incluye `tsx` para `tsx --test` (suite del flujo de revisión), sin React Testing Library, Playwright, axe ni Storybook.

El `DSP-2026-002` acota cuatro componentes reutilizables (`CMP-ATOM-001`, `CMP-ORG-001`, `CMP-ORG-002`, `CMP-ORG-003`) cuya evidencia de QA requiere ese tooling.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas.

### Opción A — Storybook (seleccionada)

- Un único entorno para desarrollar, documentar y probar cada componente por variante y estado, alineado con las matrices de variantes, estados y accesibilidad de las specs `CMP-*`.
- Permite contrastar cada componente con su diseño visual de Stitch.
- Añade dependencias de desarrollo y el mantenimiento de las stories.

### Opción B — Pruebas con React Testing Library y Playwright, sin catálogo de componentes

- Menos dependencias de herramienta de documentación.
- No ofrece un catálogo navegable de variantes y estados para revisión de UX.

### Opción C — Otro catálogo de componentes

- Posible alternativa ligera.
- Menor integración conocida con el ecosistema Next.js/React y con las revisiones de accesibilidad y regresión visual.

## Decisión

**SkillVault utilizará Storybook para desarrollar, documentar y probar los componentes UI reutilizables del frontend Next.js/React.**

**Justificación:** Decisión humana expresada en la solicitud: “incluir en las decisiones el uso de Storybook para las pruebas de componentes”.

### Alcance inicial

- Los componentes del `DSP-2026-002`: `CMP-ATOM-001`, `CMP-ORG-001`, `CMP-ORG-002` y `CMP-ORG-003`.
- Una story por variante y estado relevante de cada spec `CMP-*`.

### No se decide todavía

- Versión de Storybook y su compatibilidad con Next.js 16 y React 19.
- Addons y ejecutor de pruebas concretos (interacción, accesibilidad).
- Servicio o método de regresión visual.
- Integración en el pipeline de CI y umbrales de cobertura.
- Extensión a los componentes existentes del portal.
- Cualquier sustitución de `next build` o de la suite `tsx --test` existente.

## Metas de calidad

[PENDIENTE]: no se ha vinculado un ASR aprobado con una métrica específica para esta decisión.

## Consecuencias

### Positivas

- Cubre el impacto en pruebas exigido por ADR-004 con una herramienta definida.
- Cada variante y estado de las specs queda ejecutable y revisable por Dev, QA y UX.

### Negativas y riesgos

- Nuevas dependencias de desarrollo, scripts y configuración que hoy no existen.
- Las stories requieren mantenimiento junto con los componentes.
- La compatibilidad con la versión actual de Next.js y React debe validarse antes de comprometer la evidencia.
- No sustituye `next build` ni las pruebas existentes.

## Impacto en pruebas

- Los componentes en alcance deben tener stories para sus variantes y estados.
- Las pruebas de interacción y accesibilidad de esos componentes se ejecutan sobre Storybook.
- Debe mantenerse `next build` y la suite `tsx --test` existente.
- La evidencia de QA del `DSP-2026-002` se apoya en Storybook una vez resueltos los puntos de "No se decide todavía".

## Implementación inicial (2026-10-09)

Se instaló y verificó Storybook en la rama `feat/storybook-package-status` (sin commit). Estas elecciones de implementación cubren parte de "No se decide todavía" y quedan **pendientes de revisión de esta ADR** (`verified: false`):

- Versión: `storybook` y `@storybook/*` 10.6.1; framework `@storybook/nextjs-vite` (con `vite` 8.3.4); addons `@storybook/addon-a11y` y `@storybook/addon-docs`.
- Compatibilidad: el build (`storybook build`) funciona con Next.js 16.2.10 y React 19.2.4.
- Preview (`.storybook/preview.tsx`): carga `src/app/globals.css` (tokens del portal y anillo de foco global) y alterna `data-theme` claro/oscuro desde la barra de herramientas, como el `ThemeToggle` del portal. Las fuentes se cargan desde `.storybook/preview-head.html`.
- Scripts: `storybook` (puerto 6006) y `build-storybook`. `storybook-static/` y `*storybook.log` están en `.gitignore`.
- Primera story: `src/components/packages/PackageStatus.stories.tsx` (una story por variante y estado).
- Siguen sin decidir: ejecutor de pruebas automatizado (por ejemplo el addon de Vitest), método de regresión visual, integración en CI y extensión a los componentes existentes del portal.
