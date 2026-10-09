---
artifact: development-context-pack
okf: google-okf-v0.2
id: DCP-CL2-TENANT-001
title: Development Context Pack — Gestión de Tenants (UI)
generated: 2026-10-01
verified: false
status: REQUIRES_REVIEW
sources:
  - https://gitlab.example.com/PLACEHOLDER/knowledge-base/-/blob/main/design/handoff/HOF-CL2-TENANT-001.md
provenance:
  created_by: development-handoff-builder
  method: derived-from-approved-design
  confidence: medium
human-reviewed: false
---

# Development Context Pack — Gestión de Tenants (UI)

> Ejemplo ilustrativo. No es un paquete de producción: referencias `PLACEHOLDER:` y revisión humana del gate pendiente.

## Scope and identity
- Handoff: `HOF-CL2-TENANT-001` (gate `DESIGN_READY_FOR_DEV` = PASSED, perfil `example`; `human_review: pending`)
- Screens a implementar: SCR-021, SCR-022, SCR-023 (FLW-008; US-027, UXR-012, AC-041, AC-042)

## Design to implement (authoritative)
`governed_design` (Figma) por SCR, desde `validators/cli.py dev-context --screen <SCR>`:
SCR-021 → `PLACEHOLDER:figma-node-SCR-021` · SCR-022 → `PLACEHOLDER:figma-node-SCR-022` · SCR-023 → `PLACEHOLDER:figma-node-SCR-023`.
Stitch (superseded) **no** es el diseño a construir.

## Contract for the coding agent
- Componentes: CMP-011, CMP-014. Tokens: TKN-color-primary.
- Estados: default, loading, empty, error, disabled. Responsive: mobile, desktop.
- Prohibido: inventar estados, sustituir componentes, resolver ambigüedades en silencio (emitir `DESIGN_CONFLICT`).

## Evidence expected per SCR
HOF id, `file_ref/node_ref/version` implementados, componentes usados, capturas de verificación visual y pruebas funcionales.
