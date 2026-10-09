---
artifact: development-scope-pack
okf: google-okf-v0.2
id: DSP-2026-002
title: "Componentes UI reutilizables de paquetes de Skills: PackageStatus, PackageCard, PackageSearchPanel y PackageSkillPicker"
generated: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageStatus.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageCard.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageSearchPanel.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageSkillPicker.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/atomic-component-catalog.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/visual-design-registry.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
provenance:
  created_by: development-scope-pack-builder
  method: derived-from-dsp-2026-001-and-component-specifications
  confidence: medium
human-reviewed: false
scope_state: DRAFT
sprint:
  id: null
  name: null
---

# Componentes UI reutilizables de paquetes de Skills

## Scope and Identity

- Scope ID: `DSP-2026-002`
- Product: `SkillVault`
- Scope state: `DRAFT`
- Sprint: No asignado; alcance candidato para planificación Scrum.
- Relación: subconjunto de implementación de `DSP-2026-001`. No amplía su alcance funcional; acota los componentes UI reutilizables que necesitan sus pantallas `SCR-001` y `SCR-002`.
- Audiencia: Developers, QA, UX y Arquitectura.

## Objective

Construir 4 componentes React presentacionales reutilizables (Next.js 16 / React 19, `ADR-004`), implementados contra su especificación `CMP-*` **y** su diseño visual en Google Stitch, sin lógica de negocio, sin acceso a servicios ni decisiones de permisos.

## Source RCPs

- `RCP-2026-10-05-SKILLS-PACKAGES` — Catálogo de paquetes de Skills relacionados por rol.

## Included User Stories

- `US-001` — Mantener un catálogo de paquetes de Skills por rol (los 4 componentes).
- `US-002` — Consumir un paquete público de Skills (solo `CMP-ATOM-001`, vía `SCR-005`).

## Architecture Decisions Applied

`ADR-004` (Aceptado, 2026-10-08): el frontend web usa **Next.js sobre React**; Angular fue descartado. Consecuencias para este DSP:

- Las specs `CMP-*` conservan su contrato TypeScript, pero los selectores Angular, `@skillvault/ui/packages`, NPM, standalone, signals y semver de librería quedan **no normativos**. Cada spec incluye ahora la sección "Reconciliación con ADR-004".
- Los componentes viven en el portal (propuesta: `src/components/packages/`, junto a los `*Client.tsx` existentes), no en una librería independiente.
- Sistema de diseño canónico: `_ds/skillvault` (decisión humana (human:ianache), 2026-10-08); sustituye al sistema azul de Stitch en los diseños de referencia.
- ADR-004 **no decide** el sistema de diseño ni la biblioteca de componentes, el renderizado por ruta (SSR/SSG/CSR) ni una futura extracción a otro framework o librería; esos puntos siguen abiertos.
- `ADR-005` (decisión humana; texto pendiente de revisión): **Storybook** es la herramienta para desarrollar, documentar y probar estos componentes; una story por variante y estado de cada spec. No decide versión, addons, regresión visual ni CI.
- Impacto en pruebas exigido por ADR-004: `next build`, pruebas existentes, regresión de componentes compartidos, WCAG 2.2 AA y verificación visual contra la especificación UX/UI.

## Included Components

| Orden | ID | Componente React | Nivel | Spec | Diseño Stitch (proyecto `1874775286672335993`) | Pantallas que lo consumen |
|---|---|---|---|---|---|---|
| 1 | CMP-ATOM-001 | `PackageStatus` | atom | `design/components/CMP-PackageStatus.md` | `b7be4588b6cf4bb7bb978c5061a3dc0b` y `aef5a5f1b84c4b57900c216cca0892cb` | SCR-001, SCR-005 |
| 2a | CMP-ORG-001 | `PackageCard` | organism | `design/components/CMP-PackageCard.md` | `ee54232acf3a4329a697efa9a1c40230` y `9d68e663c80c4b768859ad536998dc97` | SCR-001 |
| 2b | CMP-ORG-002 | `PackageSearchPanel` | organism | `design/components/CMP-PackageSearchPanel.md` | `56719e4f643d400e95bc6252657b9666` y `af91096679544801a9ef8918f7ede828` | SCR-001 |
| 3 | CMP-ORG-003 | `PackageSkillPicker` | organism | `design/components/CMP-PackageSkillPicker.md` | `21ff5a2089e24deb886c2d1506985c82` y `ef6203dda288420090f3b991a025bd44` | SCR-002 |

URL de cada diseño: `https://stitch.withgoogle.com/projects/1874775286672335993?node-id=<id>`.

Orden de construcción: `CMP-ATOM-001` primero (lo usan los tres organismos); `CMP-ORG-001` y `CMP-ORG-002` pueden ir en paralelo; `CMP-ORG-003` al final, cuando su diseño esté corregido.

### Contrato por componente (resumen; la fuente es cada spec; entradas = props, salidas = callbacks)

- **CMP-ATOM-001:** entrada `value: draft | published | retired`, `version?`, `warning?`, `compact`. Sin salidas. Un valor desconocido es un error, no un fallback silencioso.
- **CMP-ORG-001:** entrada `package`, `actions`, `disabled`, `warningText?`; salida `event` discriminada (`open`, `edit`, `duplicate`, `review`, `retire`). Variantes `maintenance` y `public-readonly`.
- **CMP-ORG-002:** entrada `value`, `roles`, `statuses`, `disabled`; salidas `filtersChange` y `clear`. Sin consulta a APIs; el debounce es responsabilidad de la página.
- **CMP-ORG-003:** entrada `availableSkills`, `selectedSkills`, `loading`, `disabled`; salida `selectionChange` con orden y política `latest | pinned`. Evita duplicados; conserva la selección ante errores.

### Regla visual transversal

Los estados se muestran igual en todos los componentes: píldora redondeada, 12px, icono inicial, nunca solo color. Borrador = gris con borde punteado; Publicado = verde; Retirado = gris neutro con icono de archivo. El aviso de retiro es una línea ámbar aparte, no un color de estado.

## Excluded Work

- Páginas y plantillas: `CMP-PAGE-001`, `CMP-TPL-001`, `sv-package-card-grid` (`CMP-ORG-004`).
- Componentes de `CMP-001` no listados arriba (`CMP-PackageEditor`, `CMP-InstallProgress`, `CMP-InstallResult`, `CMP-RetiredSkillWarning`, `CMP-VersionPolicy`, `CMP-SkillReferenceList`).
- Servicios, rutas, permisos Keycloak, auditoría, versionado, instalación, rollback y CLI (alcance de `DSP-2026-001`).
- Publicar los componentes como librería NPM externa o extraerlos a otro framework: ADR-004 no lo decide; requiere una decisión nueva.
- Crear o regenerar diseños en Stitch salvo la corrección de `CMP-ORG-003`.
- Asignar Sprint, fecha o estimación.

## Dependencies and Constraints

- Los organismos dependen de `CMP-ATOM-001`.
- Componentes sin spec que los organismos nombran (decisión en Open Questions): `CMP-ATOM-002` icono, `CMP-ATOM-003` selector de filtro, `CMP-MOL-001` meta, `CMP-MOL-002` acciones, `CMP-MOL-003` resultado de Skill, `CMP-MOL-004` fila de Skill seleccionada.
- Ambos modos, claro y oscuro, soportados por los componentes (decisión humana (human:ianache), 2026-10-08); los diseños Stitch existentes son solo claros.
- Stack fijo por `ADR-004`: Next.js 16 / React 19. Los 3 organismos son interactivos y requieren límite de cliente (`"use client"`); `CMP-ATOM-001` es puro.
- Los componentes son presentacionales: no importan servicios de dominio, router ni APIs. Dirección de dependencia `page → template → organism → molecule → atom`.
- Accesibilidad WCAG 2.2 AA como criterio de release: nombre accesible, orden de teclado, foco visible, advertencias que no dependan del color.
- Las pantallas Stitch son el diseño de referencia; si difieren de la spec se registra el conflicto y no se elige en silencio.
- Los diseños fueron verificados solo por su código HTML, no visualmente; requieren revisión humana.

## QA and Acceptance Evidence

- Trazabilidad `US-001`/`US-002` → `UXR` → `SCR` → `CMP-*` → prueba.
- Por componente: pruebas de contrato (props/callbacks y estados), de interacción y teclado, de accesibilidad y regresión visual contra el diseño Stitch.
- Herramienta decidida por `ADR-005`: **Storybook** (una story por variante y estado, pruebas de interacción y accesibilidad sobre ella). Hoy no está instalada: `package.json` solo tiene `tsx --test`. Siguen abiertos versión y compatibilidad con Next.js 16/React 19, addons/ejecutor, método de regresión visual y CI.
- Estados obligatorios: según cada spec (loading, empty, error, disabled, responsive 360px, variantes).
- Evidencia requerida antes de cerrar: resultados de pruebas y revisión humana UX/PO/Arquitectura. Este DSP no aporta evidencia de ejecución.

## Provider Handoff

El equipo recibe un alcance candidato, no una autorización de implementación. Debe:

- Implementar solo los 4 componentes listados, contra spec y diseño Stitch.
- Elevar las preguntas abiertas antes de comprometer la solución.
- Documentar desviaciones y pedir revisión ante cambios de alcance.
- No marcar `READY_FOR_SPRINT_SELECTION` ni asignar Sprint sin revisión humana.

## Open Questions and Blockers

1. ~~Framework y empaquetado~~ **Resuelta por `ADR-004`**: React dentro del portal. Queda abierta la extracción futura a otra librería (fuera de alcance).
2. ~~Subcomponentes sin spec~~ **Decidido para `PackageCard` (decisión humana (human:ianache), 2026-10-08):** icono, meta y acciones son privados en esta versión. Pendiente confirmar el mismo criterio para el selector de filtro (`CMP-ATOM-003`) y para `CMP-MOL-003`/`CMP-MOL-004` de los otros organismos.
3. ~~Diseño de `CMP-ORG-003`~~ **Resuelto:** diseño canónico claro y oscuro (verificado en HTML; revisión visual humana pendiente).
4. ~~Design System y tokens oficiales~~ **Resuelto (decisión humana (human:ianache), 2026-10-08):** `_ds/skillvault`; mapeo en `design-token-contract.md`. Los diseños Stitch se regeneran con ese sistema (claro y oscuro). Estilos en línea con `var(--…)` y foco de 2px con `--accent` decididos (decisión humana (human:ianache), 2026-10-08). Retirado neutro decidido (decisión humana (human:ianache), 2026-10-08). Pendientes: espaciado y breakpoints.
5. Vocabulario de filtros de `CMP-ORG-002` (roles y estados reales) y política de debounce.
6. Origen del contador de Skills y copy de estados en `CMP-ORG-001`.
7. Contrato de la API de versiones de paquete (afecta `SelectedSkill` de `CMP-ORG-003`) y payload de advertencia de compatibilidad, máximo de resultados y paginación.
8. Propietario de cada componente: asignado `human:ianache` para `CMP-ATOM-001` y `CMP-ORG-001` (decisión humana (human:ianache), 2026-10-09); por confirmar para `CMP-ORG-002` y `CMP-ORG-003`.
9. Los diseños Stitch tienen pantallas duplicadas pendientes de eliminar (lista en `visual-design-registry.md`).
10. `knowledge-base/` no está versionado en git; las URL fuente de este DSP apuntan a `master` y no resolverán hasta que se publique.
11. Revisión humana pendiente de las 4 specs y de los 4 diseños.
12. ~~Tooling de pruebas de componentes~~ **Decidido por `ADR-005`: Storybook.** Abiertos: versión y compatibilidad con Next.js 16/React 19, addons y ejecutor de pruebas, método de regresión visual, integración en CI, instalación y configuración (hoy no existe en el repositorio).
16. ~~Diseños canónicos claro y oscuro~~ **Resueltos** para los 4 componentes (verificados en HTML; revisión visual humana pendiente).
13. Límite servidor/cliente y estrategia de renderizado de las rutas que consumen los organismos: no decididos por ADR-004.
14. ~~Nombres de props/callbacks y ubicación `src/components/packages/`~~ **Confirmados (decisión humana (human:ianache), 2026-10-09).**
15. ~~Documentos de `design/atomic-components/` basados en Angular~~ **Reconciliados con ADR-004/ADR-005**: `react-component-architecture.md` y `component-module-contract.md` reemplazan a `angular-library-architecture.md` y `npm-package-contract.md` (conservados como historial).

## Definition of Ready

- Decidida la pregunta 2 (la 1 y el tooling de la 12 ya están decididos por ADR-004 y ADR-005).
- Storybook instalado, configurado y compatible con Next.js 16/React 19.
- Diseño de `CMP-ORG-003` corregido y verificado.
- Cada componente con spec en `REQUIRES_REVIEW` como mínimo y `visual_design.status: linked`.
- Propietario asignado y respuesta a las preguntas 4 a 7 o plan explícito.
- Dev, QA, UX y Arquitectura conocen sus responsabilidades.

## Definition of Done

- Los 4 componentes cumplen su spec y su diseño Stitch.
- Stories por variante y estado en Storybook; pruebas de contrato, interacción, accesibilidad y regresión visual disponibles y trazadas a `US-001`/`US-002`.
- Sin dependencias de servicios dentro de los componentes.
- Revisión humana UX/PO/Arquitectura registrada.
- Sin cambios fuera de alcance sin revisar este DSP.
