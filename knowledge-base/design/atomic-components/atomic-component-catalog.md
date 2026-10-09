---
artifact: atomic-component-catalog
okf: google-okf-v0.2
id: ACC-DSP-2026-001
title: "Atomic component catalog — paquetes de Skills"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/atomic-components/ui-inventory.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - /knowledge-base/design/components/CMP-001-paquetes-skills.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: atomic-classification-with-reuse-boundaries
  confidence: medium
---

# Atomic component catalog — paquetes de Skills

> Nota ADR-004: los selectores `sv-*` son identificadores históricos de la propuesta Angular; el componente vigente es React con nombre PascalCase (`sv-package-card` → `PackageCard`). Ver `react-component-architecture.md`.

## Atoms

- `CMP-ATOM-001 / sv-package-status`: etiqueta textual de `draft`, `published` o `retired`, con advertencia visible para retiro.
- `CMP-ATOM-002 / sv-package-icon`: icono decorativo con nombre accesible provisto por el organismo padre.
- `CMP-ATOM-003 / sv-filter-select`: selector genérico con label, valor y cambio.

## Molecules

- `CMP-MOL-001 / sv-package-card-meta`: combina rol y versión.
- `CMP-MOL-002 / sv-package-card-actions`: expone acciones permitidas sin resolver permisos.
- `CMP-MOL-003 / sv-skill-search-result`: nombre, versión y evento `add`.
- `CMP-MOL-004 / sv-selected-skill-row`: posición, política de versión, mover y quitar.

## Organisms

- `CMP-ORG-001 / sv-package-card`: enlace y resumen de paquete; compone status, icon, meta y actions.
- `CMP-ORG-002 / sv-package-search-panel`: búsqueda por texto, filtros y limpieza.
- `CMP-ORG-003 / sv-package-skill-picker`: resultados y selección ordenada de Skills.
- `CMP-ORG-004 / sv-package-card-grid`: composición responsive, empty/error/loading.

## Template y page

- `CMP-TPL-001 / sv-package-catalog-template`: slots para PageHeader, SearchPanel, result count y CardGrid.
- `CMP-PAGE-001 / sv-package-catalog-page`: enlaza `US-001 → UXR-002 → FLW-001 → SCR-001`, permisos y servicios.

## Reglas de dependencia

`page → template → organisms → molecules → atoms`. Ningún átomo o molécula debe importar servicios de dominio, router o APIs.
