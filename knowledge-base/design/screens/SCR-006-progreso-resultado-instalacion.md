---
id: SCR-006
type: Screen
title: "SCR-006 — Progreso y resultado de instalación"
description: "Seguimiento de descarga/instalación por Skill, rollback transaccional y resultado global."
tags: [ux-ui, screen, skill-package, installation]
status: draft
generated:
  by: "ui-spec-writer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: flow
    resource: /knowledge-base/design/user-flows/FLW-002-consumir-paquete-skills.md
flow: FLW-002
requirements: [US-002, UXR-003]
required_states: [default, loading, empty, error, disabled, installing, rollback, success, failed]
responsive: [mobile, desktop]
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible, live-status, non-color-status]
components: [CMP-InstallProgress, CMP-InstallResult, CMP-RetiredSkillWarning]
tokens: []
design_map: DTM-DSP-2026-001
---

# SCR-006 — Progreso y resultado de instalación

## Trazabilidad

`US-002` → `UXR-003` → `FLW-002` → `SCR-006`.

## Layout, estados e interacciones

- Mostrar la etapa actual y el Skill en procesamiento.
- Mostrar el resultado por Skill sin confundirlo con ejecución.
- En `rollback`, comunicar que la operación se detuvo y se están revirtiendo instalaciones previas.
- En `success`, confirmar instalación completa y ofrecer acceso a cada Skill instalado.
- En `failed`, mostrar causa disponible y el estado del rollback.
- En rollback incompleto, no afirmar que el entorno quedó limpio; escalar según contrato operativo.

## Implementation Requirements

### Component Inventory

| Component | Type | Props | Validators | States | A11y |
|---|---|---|---|---|---|
| `CMP-InstallProgress` | progress/list | current skill, stage, total | operation state valid | loading, installing, rollback | live region, progress semantics |
| `CMP-InstallResult` | result summary | global state, per-skill results | result schema valid | success, failed, partial-recovery | heading and error summary |
| `CMP-RetiredSkillWarning` | alert | omitted retired Skills | retired status known | warning | role=alert |

### Implementation Checklist

- [ ] Define live-region politeness and update frequency.
- [ ] Ensure rollback is distinguishable from a normal installation state.
- [ ] Expose per-Skill result without exposing unsupported technical internals.
- [ ] Map components and tokens to the official Design System.

## Preguntas abiertas

- Mensajes exactos de rollback y rollback incompleto.
- Tiempo esperado y estrategia de reintento no definidos.
- Contratos de estado por harness aún no documentados.
