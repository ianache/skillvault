---
type: index
id: KB-INDEX
title: Índice de la base de conocimiento
status: draft
generated:
  by: architecture-adr-writer/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - knowledge-base/architecture/architecture-discovery-brief-2026-10-05.md
  - knowledge-base/architecture/adrs/ADR-001-rbac-por-capacidades-y-middleware.md
  - knowledge-base/architecture/adrs/ADR-002-doble-control-en-aprobacion-de-skills.md
  - knowledge-base/architecture/adrs/ADR-003-sincronizacion-de-roles-keycloak-db-local.md
---

# Índice de la base de conocimiento

## Estructura canónica por disciplina

- `business/` — contexto de negocio, glosario, reglas, objetivos, stakeholders, restricciones, riesgos y preguntas abiertas.
- `requirements/` — context packs y artefactos de requisitos.
- `architecture/` — discovery, context packs, análisis de impacto, ASR, ADRs y handoffs.
- `design/` — contratos API, revisiones de contrato, seguridad API y modelos de datos.
- `testing/` — planes, estrategias y evidencia de pruebas cuando un Skill de testing los genere.
- `implementation/` — especificaciones y evidencia de implementación cuando un Skill de implementación los genere.
- `deployment/` — configuración, runbooks y evidencia de despliegue cuando un Skill de deployment los genere.

Todo nuevo artefacto Markdown debe quedar en una de estas categorías; no se deben crear salidas nuevas en carpetas raíz `architecture/`, `business/`, `requirements/` o `design/`.

## READMEs de categoría

- [Business](business/README.md)
- [Requirements](requirements/README.md)
- [Architecture](architecture/README.md)
- [Design](design/README.md)
- [Testing](testing/README.md)
- [Implementation](implementation/README.md)
- [Deployment](deployment/README.md)

## Requerimiento en curso

Nota de actualizacion 2026-10-07: IMD-001 contiene respuestas propuestas para IM-Q3 e IM-Q5 y conserva la validacion humana pendiente.

- [RCP-2026-10-05 — Catálogo de paquetes de Skills relacionados por rol](requirements/context-packs/RCP-2026-10-05-skills-packages.md)
- [US-001 — Mantener un catálogo de paquetes de Skills por rol](requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md) — `CONDITIONAL`, pendiente de validación funcional.
- [US-002 — Consultar, instalar, descargar y ejecutar un paquete público de Skills](requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md) — `CONDITIONAL`, pendiente de contrato técnico de consumo.
- [IMD-001 — Modelo conceptual de paquetes de Skills](business/information-model/IMD-001-skill-packages.md) — `CONDITIONAL`, pendiente de validación de conceptos y cardinalidades.

## DSP de la iniciativa de paquetes de Skills

- [DSP-2026-001 — Paquetes de Skills por rol: catálogo, consumo público y UX/UI](implementation/DSP-2026-001-paquetes-skills-por-rol.md) — `DRAFT`/`REQUIRES_REVIEW`, Sprint no asignado; incluye UXR, FLW, SCR y CMP.
- [DSP-2026-002 — Componentes UI reutilizables de paquetes de Skills](implementation/DSP-2026-002-componentes-ui-paquetes.md) — `DRAFT`/`REQUIRES_REVIEW`; sin Sprint.
- [DCP-2026-001 — Development Context Pack: PackageStatus y PackageCard](implementation/DCP-2026-001-paquetes-ui-oleada-1.md) — `REQUIRES_REVIEW`; oleada 1 de DSP-2026-002.
- [RVW-2026-001 — Checklist de revisión humana: PackageStatus y PackageCard](implementation/RVW-2026-001-checklist-revision-humana-oleada-1.md) — `REQUIRES_REVIEW`; la revisión debe registrarla una persona.
- [TD-2026-001 — Diseño técnico: paquetes de Skills por rol](implementation/TD-2026-001-diseno-tecnico-paquetes-skills.md) — `REQUIRES_REVIEW`; modelo conceptual, contratos candidatos, instalación transaccional, seguridad, rollout y bloqueos.
- [API-2026-001 — Contrato API: paquetes de Skills por rol](implementation/API-2026-001-contrato-paquetes-skills.md) — `REQUIRES_REVIEW`; recursos, DTOs, endpoints administrativos/públicos, JSON/ZIP, errores, seguridad y pruebas de contrato.
- [IMP-2026-001 — Diseño de implementación: paquetes de Skills por rol](implementation/IMP-2026-001-diseno-implementacion-paquetes-skills.md) — `draft`; diseño arquitectónico de implementación, pruebas, rollout y tareas técnicas pendientes.
- [PLN-2026-001 — Plan de implementación: paquetes de Skills por rol](implementation/PLN-2026-001-plan-implementacion-paquetes-skills.md) — `draft`; plan TDD candidato para datos, revisión, API, distribución, CLI, UI y rollout.

## Artefactos UX/UI de DSP-2026-001

- [UXR-001 — Descubrir y comprender paquetes de Skills](design/ux-requirements/UXR-001-catalogo-paquetes.md)
- [UXR-002 — Mantener la composición de un paquete](design/ux-requirements/UXR-002-mantenimiento-paquete.md)
- [UXR-003 — Instalar Skills de forma independiente](design/ux-requirements/UXR-003-instalacion-independiente.md)
- [UXR-004 — Gestionar versiones y ejecución individual](design/ux-requirements/UXR-004-versiones-y-ejecucion.md)
- [FLW-001 — Mantener un paquete de Skills](design/user-flows/FLW-001-mantener-paquete-skills.md) → `SCR-001`, `SCR-002`, `SCR-003`
- [FLW-002 — Consultar, descargar e instalar un paquete](design/user-flows/FLW-002-consumir-paquete-skills.md) → `SCR-004`, `SCR-005`, `SCR-006`
- [CMP-001 — Componentes de paquetes de Skills](design/components/CMP-001-paquetes-skills.md)
- Screens: [SCR-001](design/screens/SCR-001-catalogo-mantenimiento-paquetes.md), [SCR-002](design/screens/SCR-002-editor-paquete-skills.md), [SCR-003](design/screens/SCR-003-revision-publicacion-paquete.md), [SCR-004](design/screens/SCR-004-catalogo-publico-paquetes.md), [SCR-005](design/screens/SCR-005-detalle-paquete-publico.md), [SCR-006](design/screens/SCR-006-progreso-resultado-instalacion.md)

## Extracción Atomic Design de paquetes de Skills

- [UI inventory](design/atomic-components/ui-inventory.md)
- [Atomic component catalog](design/atomic-components/atomic-component-catalog.md)
- [Micro-UI boundary analysis](design/atomic-components/micro-ui-boundary-analysis.md)
- [Design token contract](design/atomic-components/design-token-contract.md)
- [React component architecture](design/atomic-components/react-component-architecture.md)
- [Component module contract](design/atomic-components/component-module-contract.md)
- [Angular library architecture](design/atomic-components/angular-library-architecture.md) — reemplazado (ADR-004), solo historial.
- [NPM package contract](design/atomic-components/npm-package-contract.md) — reemplazado (ADR-004), solo historial.
- [Accessibility matrix](design/atomic-components/accessibility-matrix.md)
- [Visual test matrix](design/atomic-components/visual-test-matrix.md)
- [Component traceability report](design/atomic-components/component-traceability-report.md)
- [CMP-ORG-001 PackageCard](design/components/CMP-PackageCard.md)
- [CMP-ATOM-001 PackageStatus](design/components/CMP-PackageStatus.md)
- [CMP-ORG-002 PackageSearchPanel](design/components/CMP-PackageSearchPanel.md)
- [CMP-ORG-003 PackageSkillPicker](design/components/CMP-PackageSkillPicker.md)

## ADRs de arquitectura

- [ADR-004: Usar Next.js y React para el frontend web](architecture/adrs/ADR-004-nextjs-react-frontend-web.md) — aceptado y verificado por `human:ianache`.
- [ADR-005: Usar Storybook para las pruebas de componentes UI](architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md) — decisión humana de `human:ianache`; texto pendiente de revisión (`verified: false`).

## Inventario de `.agents/skills`

| Skill | Clasificación | Carpeta de conocimiento |
|---|---|---|
| `architecture-discovery` | Architecture | `architecture/discovery/` |
| `architecture-context-builder` | Architecture | `architecture/context-packs/` |
| `architecture-impact-analyzer` | Architecture | `architecture/impact/` |
| `asr-discovery` | Architecture | `architecture/asr/` |
| `architecture-adr-writer` | Architecture | `architecture/adrs/` |
| `architecture-development-handoff` | Architecture | `architecture/handoffs/` |
| `api-designer` | Design | `design/api-contracts/` |
| `api-contract-reviewer` | Design | `design/api-reviews/` |
| `api-security-reviewer` | Design | `design/api-security/` |
| `content-validator` | Formación, fuera del mapa de ingeniería | No almacenar como testing de software |
| `course-builder` | Formación, fuera del mapa de ingeniería | No asignado a estas siete categorías |
| `evaluation-creator` | Formación, fuera del mapa de ingeniería | No asignado a estas siete categorías |
| `lesson-builder` | Formación, fuera del mapa de ingeniería | No asignado a estas siete categorías |

- [Brief de descubrimiento arquitectónico](architecture/architecture-discovery-brief-2026-10-05.md) — revisión transversal de planes, specs y seguridad.
- [ADR-001: RBAC por capacidades y middleware](architecture/adrs/ADR-001-rbac-por-capacidades-y-middleware.md) — propuesta.
- [ADR-002: Doble control en aprobación de skills](architecture/adrs/ADR-002-doble-control-en-aprobacion-de-skills.md) — propuesta.
- [ADR-003: Sincronización de roles Keycloak-DB local](architecture/adrs/ADR-003-sincronizacion-de-roles-keycloak-db-local.md) — propuesta.
