---
id: FLW-002
type: User Flow
title: "FLW-002 — Consultar, descargar e instalar un paquete"
description: "Flujo público para consultar un paquete, descargarlo e instalar sus Skills de forma independiente con rollback transaccional."
tags: [ux-ui, user-flow, skill-package, installation]
status: draft
generated:
  by: "user-flow-designer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - id: uxr-discovery
    resource: /knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
  - id: uxr-install
    resource: /knowledge-base/design/ux-requirements/UXR-003-instalacion-independiente.md
  - id: uxr-version
    resource: /knowledge-base/design/ux-requirements/UXR-004-versiones-y-ejecucion.md
requirements: [US-002, UXR-001, UXR-003, UXR-004]
screens: [SCR-004, SCR-005, SCR-006]
---

# FLW-002 — Consultar, descargar e instalar un paquete

## Trazabilidad

- `US-002` → `UXR-001`, `UXR-003`, `UXR-004` → `FLW-002`.
- AC cubiertos: `US-002/AC-1`, `US-002/AC-2`, `US-002/AC-3`.

## Actor y permisos

- Actor: usuario público.
- Puede consultar y descargar paquetes publicados.
- La instalación requiere validar el entorno y las rutas de cada harness.
- La ejecución es individual por Skill y no forma parte de este flow como ejecución de conjunto.

## Happy path

1. El usuario consulta el catálogo público.
2. Filtra o selecciona un paquete publicado.
3. Revisa rol, versión, política de versión, composición y advertencias.
4. Solicita la descarga.
5. Inicia la instalación del paquete.
6. El sistema valida e instala cada Skill de forma independiente según su harness y ruta.
7. El sistema muestra resultado global exitoso y detalle por Skill.
8. Cada Skill instalado puede exponer su acción de ejecución individual.

## Excepciones, permisos y estados

- `draft` o `retired`: no ofrecer como paquete público operable.
- Skill retirado: omitirlo de la instalación y mostrar advertencia visible en el detalle.
- Resolución de versión: mostrar si se usa versión fijada o última disponible.
- Fallo en un Skill: detener la instalación, iniciar rollback y mostrar resultado fallido.
- Rollback fallido: mostrar estado de recuperación incompleta y escalar a soporte/operación; el comportamiento exacto queda abierto.
- Descarga fallida: no iniciar instalación y permitir reintento según contrato técnico.
- Loading: informar etapa actual y Skill en procesamiento.

## Pantallas

- `SCR-004`: catálogo público de paquetes.
- `SCR-005`: detalle del paquete y acciones de descarga/instalación.
- `SCR-006`: progreso, rollback y resultado de instalación.

## Preguntas abiertas

- Definir mensajes exactos de fallo, rollback y recuperación incompleta.
- Definir los estados visuales por harness.
- Confirmar Design System y tokens semánticos.
