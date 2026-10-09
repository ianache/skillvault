---
artifact: ui-inventory
okf: google-okf-v0.2
id: UINV-DSP-2026-001
title: "UI inventory — paquetes de Skills"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - /knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
  - /knowledge-base/design/components/CMP-001-paquetes-skills.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: derived-from-design-artifacts-and-current-implementation
  confidence: medium
---

# UI inventory — paquetes de Skills

## Alcance

Inventario de componentes para `SCR-001` y el panel de composición de `SCR-002`. El artefacto define límites de reutilización y contratos candidatos; no modifica la implementación React existente ni afirma que exista una librería Angular aprobada.

## Inventario

| ID | Nivel | Componente | Responsabilidad | Consumidor |
|---|---|---|---|---|
| CMP-ATOM-001 | atom | `sv-package-status` | Estado textual no dependiente solo del color | PackageCard, editor |
| CMP-ATOM-002 | atom | `sv-package-icon` | Identidad visual del paquete | PackageCard |
| CMP-ATOM-003 | atom | `sv-filter-select` | Selector accesible de rol/estado | PackageSearchPanel |
| CMP-MOL-001 | molecule | `sv-package-card-meta` | Presenta rol y versión | PackageCard |
| CMP-MOL-002 | molecule | `sv-package-card-actions` | Acciones contextualizadas | PackageCard |
| CMP-MOL-003 | molecule | `sv-skill-search-result` | Resultado con acción agregar | PackageSkillPicker |
| CMP-MOL-004 | molecule | `sv-selected-skill-row` | Skill seleccionado, política y orden | PackageSkillPicker |
| CMP-ORG-001 | organism | `sv-package-card` | Resumen navegable de un paquete | PackageCatalog |
| CMP-ORG-002 | organism | `sv-package-search-panel` | Búsqueda, filtros y limpieza | PackageCatalog |
| CMP-ORG-003 | organism | `sv-package-skill-picker` | Busca, agrega y ordena Skills | PackageEditor |
| CMP-ORG-004 | organism | `sv-package-card-grid` | Grid responsive y estados de catálogo | PackageCatalog |
| CMP-TPL-001 | template | `sv-package-catalog-template` | Layout de cabecera, filtros y resultados | PackageCatalogPage |
| CMP-PAGE-001 | page | `sv-package-catalog-page` | Ruta y permisos de mantenimiento | `/packages` |

## Estados transversales

`loading`, `default`, `empty`, `error`, `disabled`, `access-denied`, `retired-warning` y `offline/recovery` deben modelarse explícitamente donde apliquen. `SCR-001` exige al menos `default`, `loading`, `empty`, `error`, `disabled` y `access-denied`.

## Decisiones de límite

- Los átomos no conocen paquetes, APIs ni permisos.
- Los organismos reciben datos y callbacks; no ejecutan llamadas HTTP.
- El page coordina permisos, carga y mutaciones.
- La composición se propone como módulo frontend dentro del portal; no hay evidencia para una MicroUI desplegable independiente.

## Preguntas abiertas

- ~~Versión Angular y estrategia standalone/module.~~ Resuelto por ADR-004: React (Next.js 16 / React 19); no aplica Angular.
- Design System oficial, tokens y breakpoints aprobados.
- Ubicación definitiva en el portal y equipo propietario; el paquete NPM no aplica (ADR-004 no decide extraer una librería).
- Contrato final de cantidad de Skills por paquete para `PackageCard`.
