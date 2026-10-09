---
artifact: micro-ui-boundary-analysis
okf: google-okf-v0.2
id: MUBA-DSP-2026-001
title: "Micro-UI boundary analysis — paquetes de Skills"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - /knowledge-base/design/user-flows/FLW-001-mantener-paquete-skills.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: ddd-boundary-analysis
  confidence: medium
---

# Micro-UI boundary analysis — paquetes de Skills

## Decisión

`FRONTEND_MODULE` dentro de la aplicación SkillVault. No se recomienda `MICROUI_CANDIDATE` con la evidencia disponible.

## Evidencia

| Dimensión | Evidencia | Evaluación |
|---|---|---|
| Capability/journey | Mantener, consultar y consumir paquetes de Skills | Capability coherente |
| Lenguaje y reglas | paquete, Skill, versión, rol, estado, retiro | Compartidos con catálogo y revisión |
| Actor/equipo | author/admin para mantenimiento; catálogo público | Equipo propietario no identificado |
| Contratos | APIs `/api/packages` y CLI | Contratos existentes, aún en revisión |
| Autonomía de despliegue | No documentada | Insuficiente para MicroUI |
| Beneficio | Reutilización de componentes y aislamiento de dominio | Se obtiene dentro del frontend |

## Consecuencia

El Shell conserva navegación, autenticación, permisos, layout y telemetría. El módulo de paquetes conserva presentación, selección y composición de componentes, pero recibe datos y callbacks desde la capa de página/servicio.

## Bloqueos

- Falta confirmar equipo propietario y autonomía de despliegue.
- Design System: ADR-004 no lo decide; falta confirmar el sistema de diseño y tokens oficiales para React (Angular descartado).
- ADR-004 confirma Next.js/React como tecnología del frontend; no hay ni se prevé un workspace Angular.
