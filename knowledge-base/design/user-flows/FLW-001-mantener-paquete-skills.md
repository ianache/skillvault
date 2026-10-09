---
id: FLW-001
type: User Flow
title: "FLW-001 — Mantener un paquete de Skills"
description: "Flujo para que author o admin cree, valide, publique, edite o retire un paquete de Skills."
tags: [ux-ui, user-flow, skill-package, maintenance]
status: draft
generated:
  by: "user-flow-designer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - id: uxr
    resource: /knowledge-base/design/ux-requirements/UXR-002-mantenimiento-paquete.md
requirements: [US-001, UXR-002]
screens: [SCR-001, SCR-002, SCR-003]
---

# FLW-001 — Mantener un paquete de Skills

## Trazabilidad

- `US-001` → `UXR-002` → `FLW-001`.
- AC cubiertos: `US-001/AC-1`, `US-001/AC-2`, `US-001/AC-3`.

## Actor y permisos

- Actor permitido: usuario con rol Keycloak `author` o `admin`.
- Usuario sin esos roles: acceso denegado y sin exposición de controles de mantenimiento.

## Happy path

1. El actor abre el catálogo de paquetes y elige crear o editar un paquete.
2. Completa identidad, descripción, rol objetivo y política de versión.
3. Agrega referencias canónicas a Skills existentes.
4. El sistema valida las referencias y muestra la composición resultante.
5. El actor revisa el resumen y publica o guarda el paquete como borrador.
6. El sistema confirma el estado resultante y registra la operación de publicación según las reglas de Skills individuales.

## Excepciones, permisos y estados

- Sin permiso: mostrar acceso denegado; no permitir crear, editar, publicar ni retirar.
- Referencia inexistente/no disponible: marcarla como inválida; impedir publicar mientras exista una referencia inválida.
- Skill retirado: omitirlo del contenido instalable y mostrar advertencia visible.
- Borrador incompleto: permitir guardar borrador si las reglas de negocio lo permiten; queda como pregunta abierta.
- Estados de paquete: `draft`, `published`, `published_with_deprecated_or_retired_skills`, `retired`.
- Loading y error de validación: conservar la información válida introducida y comunicar el siguiente paso.

## Pantallas

- `SCR-001`: catálogo de paquetes y entrada al mantenimiento.
- `SCR-002`: editor de paquete y composición.
- `SCR-003`: revisión y confirmación de publicación.

## Preguntas abiertas

- Confirmar si un borrador puede guardarse sin Skills o sin rol.
- Confirmar copy y severidad de estados y advertencias.
- Confirmar Design System y tokens semánticos.
