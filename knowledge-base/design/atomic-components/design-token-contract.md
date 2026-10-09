---
artifact: design-token-contract
okf: google-okf-v0.2
id: DTCOMP-TOK-DSP-2026-001
title: "Design token contract — package components"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - /knowledge-base/design/components/CMP-001-paquetes-skills.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: token-gap-analysis
  confidence: low
---

# Design token contract — package components

No existe en las fuentes un catálogo oficial de tokens. Esta salida identifica necesidades semánticas y no asigna valores crudos.

| Token semántico candidato | Uso | Estado |
|---|---|---|
| `color.surface.package` | tarjetas y paneles | pendiente de Design System |
| `color.status.published` | estado publicado | pendiente |
| `color.status.draft` | borrador | pendiente |
| `color.status.retired` | retirado/advertencia | pendiente |
| `color.focus.package` | foco visible | pendiente |
| `space.package.card` | padding de tarjeta | pendiente |
| `radius.package.card` | radios | pendiente |
| `breakpoint.package.grid` | cambio de columnas | pendiente |

## Regla

Los componentes no deben publicar valores HEX, tamaños o breakpoints como API estable hasta que un propietario del Design System los confirme.
