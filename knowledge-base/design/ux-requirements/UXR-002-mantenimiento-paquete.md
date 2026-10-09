---
type: UX Requirement
id: UXR-002
title: "UXR-002 — Mantener la composición de un paquete"
description: "La interfaz debe permitir a usuarios author o admin crear y editar un paquete, asociarlo a un rol y mantener referencias canónicas a Skills."
tags: [ux-ui, ux-requirement, skill-package, maintenance]
status: draft
generated:
  by: "ux-requirements-analyzer/1.0"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - id: us-001
    resource: /knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
requirements: [US-001, US-001/AC-1, US-001/AC-2, US-001/AC-3]
---

# UXR-002 — Mantener la composición de un paquete

## Hechos y decisiones humanas

- Solo `author` y `admin` mantienen paquetes.
- La referencia a un Skill debe ser canónica y no duplicar su contenido.
- Una referencia inexistente o no disponible no se publica como válida.

## Criterios UX candidatos

- El formulario identifica claramente el rol, estado, versión y Skills asociados.
- La validación de referencias ocurre antes de publicar.
- Los errores de referencia son accionables y no borran el trabajo válido ya ingresado.

## Preguntas abiertas

- Reglas visuales para estado de borrador, publicado y retirado.
- Componentes y tokens oficiales del Design System aún no identificados.
