---
type: ADR
id: ADR-004
title: Usar Next.js y React para el frontend web
description: SkillVault utilizará Next.js sobre React como tecnología base para el desarrollo frontend web.
tags: [architecture, adr, frontend, nextjs, react]
status: draft
verified: true
adr_status: Aceptado
decision: { by: human:ianache, at: 2026-10-08T00:00:00-05:00 }
related: []
generated: { by: architecture-adr-writer/1.0, at: 2026-10-08T00:00:00-05:00 }
sources:
  - id: PRJ-001
    resource: /package.json
    title: Manifesto del proyecto SkillVault
  - id: APP-001
    resource: /src/app/layout.tsx
    title: Root layout del frontend web
  - id: ADR-001
    resource: /architecture/adrs/ADR-001-rbac-por-capacidades-y-middleware.md
    title: Aplicar RBAC mediante capacidades y middleware de rutas
---

# ADR-004 — Usar Next.js y React para el frontend web

- **Estado:** Aceptado
- **Fecha:** 2026-10-08
- **Decisor:** human:ianache
- **Redacción:** `architecture-adr-writer/1.0`, a partir de una decisión humana explícita.
- **Revisión humana del texto:** Aprobada por `human:ianache` el 2026-10-08; `verified: true`.

## Contexto

SkillVault requiere una tecnología base para el desarrollo del frontend web. El repositorio ya contiene una aplicación Next.js que utiliza React: `package.json` declara `next`, `react` y `react-dom`, además de los scripts de desarrollo, construcción y ejecución; `src/app/layout.tsx` utiliza el layout raíz de Next.js, `next/font`, autenticación y el `AppShell` de la aplicación.

La arquitectura existente separa las responsabilidades de presentación, sesión y protección de rutas. Esta ADR fija la tecnología del frontend y no sustituye las decisiones de autorización documentadas en otras ADR.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas.

### Opción A — Next.js sobre React (seleccionada)

- Se alinea con la implementación existente y con las dependencias actuales del repositorio.
- Integra el modelo de aplicación de Next.js con React, layouts, fuentes, sesión y construcción del frontend.
- Permite mantener un pipeline único para desarrollo, construcción y ejecución web.

### Opción B — Angular

- Es una alternativa madura para aplicaciones web empresariales.
- Requeriría establecer un workspace y un pipeline frontend diferentes, además de migrar la implementación actual.

### Opción C — React con otro bundler como SPA independiente

- Mantendría React como biblioteca de UI.
- Perdería la alineación directa con el App Router y el layout raíz ya implementados en Next.js, introduciendo una migración innecesaria.

## Decisión

**SkillVault utilizará Next.js sobre React como tecnología base para el desarrollo frontend web.**

**Justificación:** Decisión humana expresada en la solicitud: “defina el uso de Next.js/React para el desarrollo frontend web”. La implementación actual ya evidencia el uso de ambas tecnologías.

### No se decide todavía

- La biblioteca concreta de componentes o el sistema de diseño.
- La estrategia de renderizado específica de cada ruta (SSR, SSG o CSR).
- Convenciones adicionales del App Router más allá de las ya presentes en el código.
- Una eventual extracción futura de componentes hacia otro framework.

## Metas de calidad

[PENDIENTE]: no se ha vinculado un ASR aprobado con una métrica específica para esta decisión.

## Consecuencias

### Positivas

- Se consolida la implementación actual bajo una tecnología explícitamente decidida.
- Se conserva la integración existente entre React, Next.js, layouts, fuentes, sesión y `AppShell`.
- Se mantiene un flujo coherente de desarrollo, construcción y ejecución para el frontend web.

### Negativas y riesgos

- La evolución de Next.js y React debe gestionarse como una dependencia acoplada.
- Las actualizaciones mayores pueden requerir validar compatibilidad del App Router, layouts, autenticación y componentes.
- Las decisiones sobre sistema de diseño, renderizado por ruta y extracción de componentes quedan fuera de esta ADR y deberán documentarse si se convierten en decisiones arquitectónicas.

## Impacto en pruebas

- El pipeline debe ejecutar `next build` y las pruebas existentes del frontend.
- Deben mantenerse pruebas de humo de navegación y autenticación sobre el layout raíz y las rutas protegidas.
- Las nuevas pantallas deben verificarse en comportamiento responsive, accesibilidad WCAG 2.2 AA e interacción visual conforme a sus especificaciones UX/UI.
- Las actualizaciones de Next.js o React deben incluir validación de regresión sobre layouts, sesión, middleware y componentes compartidos.
