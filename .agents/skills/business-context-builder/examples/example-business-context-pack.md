---
type: business-context-pack
title: "BCP-EX-001 — Gestión de entidades comerciales por tenant"
description: "Ejemplo anonimizado de contexto de negocio multi-tenant."
tags: [business-context, af-101, example]
status: draft
generated:
  by: "business-context-builder/1.0"
  at: "2026-09-29T10:00:00-05:00"
sources:
  - id: SRC-EX-001
    resource: "/examples/source/initiative-brief.md"
    version: "v1"
  - id: SRC-EX-002
    resource: "/examples/source/workshop-notes.md"
    version: "2026-09"
---

# Initiative
- **Name:** Gestión de entidades comerciales por tenant
- **Owner:** Product Owner (anonimizado)
- **Purpose:** Centralizar contexto administrativo manteniendo aislamiento entre tenants.

# Problem / Opportunity
## Facts
- La información se gestiona de forma dispersa.
- Un tenant puede requerir múltiples entidades y establecimientos.
- El aislamiento entre tenants es una restricción del producto.

# Objective — BO-EX-001
Centralizar el registro y mantenimiento de entidades comerciales por tenant.
- **Expected outcome:** información consistente y reutilizable.
- **KPI:** pending definition.

# Scope
## In scope
- Entidades comerciales, establecimientos, pertenencia a tenant, identificación y ubicación.
## Out of scope
- Facturación, liquidación comercial e integraciones externas no confirmadas.

# Stakeholders
Product Owner; administrador del tenant; Operaciones; AF; UX/UI; Arquitectura.

# Capabilities
Administración de entidades; administración de establecimientos; gobierno de información por tenant.

# Constraints
Aislamiento entre tenants; trazabilidad de cambios; políticas corporativas aplicables.

# Dependencies
Identidad del tenant; catálogos de ubicación cuando correspondan.

# Risks
Definiciones inconsistentes entre áreas; diseño funcional prematuro antes de validar reglas.

# Assumptions
BAS-EX-001: tenant como frontera primaria de administración — **UNVERIFIED**.

# Open Questions
- BOQ-EX-001: ¿Qué KPI mide el éxito? **Blocking: no**.
- BOQ-EX-002: ¿Qué roles pueden crear/modificar/desactivar? **Blocking: yes**.
- BOQ-EX-003: ¿Existe catálogo corporativo obligatorio de ubicaciones? **Blocking: yes**.

# Consumers
AF-101 → Requirements Context Pack; UX-101 → UX Context Pack; ARQ-101 → Architecture Context Pack.

# E2E Traceability Seed
`BO-EX-001 → Requirement → User Story → UXR → FLW → SCR → CMP/TKN → AC → ASR/ADR → Implementation → Test Evidence → Business Outcome`

# Readiness
- Structural validation: PASS
- Blocking questions: PRESENT
- Recommended gate: NOT_READY
- Human verification: PENDING
