---
type: UX Requirement
id: UXR-001
title: "UXR-001 — Descubrir y comprender paquetes de Skills"
description: "La interfaz debe permitir consultar la identidad, rol objetivo, composición, versión y estado de un paquete sin confundir referencias retiradas con Skills instalables."
tags: [ux-ui, ux-requirement, skill-package, discovery]
status: draft
generated:
  by: "ux-requirements-analyzer/1.0"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - id: us-002
    resource: /knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
requirements: [US-002, US-002/AC-1]
---

# UXR-001 — Descubrir y comprender paquetes de Skills

## Hechos y decisiones humanas

- El catálogo es público.
- La persona debe poder ver rol, composición, estado y versión del paquete.
- Los Skills retirados se omiten del contenido instalable y requieren una advertencia visible.

## Criterios UX candidatos

- La composición distingue referencias instalables de referencias omitidas.
- El estado y la versión son visibles antes de iniciar una descarga.
- La advertencia no depende únicamente del color y es comprensible con lector de pantalla.

## Preguntas abiertas

- Texto exacto y severidad visual de la advertencia.
- Componentes y tokens oficiales del Design System aún no identificados.
