---
artifact: atomic-component-catalog
okf: google-okf-v0.2
id: UI-CATALOG-EXAMPLE
generated: 2026-09-26
verified: false
status: REQUIRES_REVIEW
sources:
  - ../references/ui-inventory-template.md
provenance:
  created_by: web-atomic-component-designer
  method: illustrative-example
---

# Atomic Catalog Example

| ID | Name | Level | Responsibility | Public dependency rule | Verification | Visual design |
|---|---|---|---|---|---|---|
| CMP-ATOM-001 | `mc-icon-button` | atom | Icon action with accessible name and focus state | No domain service | keyboard and a11y tests | Stitch: `<project_id>/<screen_id>` (linked) |
| CMP-MOL-001 | `mc-search-field` | molecule | Search input, clear action and submit event | Composes atoms only | interaction and visual tests | Stitch: `<project_id>/<screen_id>` (linked) |
| CMP-ORG-001 | `mc-orders-table` | organism | Sortable, paginated order list with state slots | Receives view model; no HTTP | contract and a11y tests | Claude Design: `<project_id>/<screen_id>` (linked) |
| CMP-TPL-001 | `mc-operations-shell` | template | Header, navigation, content and notification slots | Composes organisms | layout and responsive tests | Claude Design: `<project_id>/<screen_id>` (linked) |
| PAGE-ORDERS-001 | Orders page | page | Binds route, permissions, backend state and template | May orchestrate services | e2e and traceability | Claude Design: `<project_id>/<screen_id>` (linked) |

The page is not published as a generic atom. The organism accepts a view model and emits user intent; the page or facade owns data fetching and navigation.
