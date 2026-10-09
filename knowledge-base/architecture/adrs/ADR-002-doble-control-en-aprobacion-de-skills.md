---
type: ADR
id: ADR-002
title: Impedir la autoaprobación de propuestas de skills
description: Un usuario no puede aprobar, solicitar cambios ni rechazar su propia propuesta aunque tenga capacidad de revisión.
tags: [architecture, adr, security, workflow]
status: draft
adr_status: Propuesto
related: []
generated: { by: architecture-adr-writer/1.0, at: 2026-10-05T00:00:00-05:00 }
sources:
  - id: SEC-001
    resource: /docs/security.md
    title: Modelo de Seguridad y Matriz de Roles (RBAC)
---

# ADR-002 — Impedir la autoaprobación de propuestas de skills

- **Estado:** Propuesto
- **Fecha:** 2026-10-05
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** architecture-adr-writer/1.0, a partir de una propuesta del agente, sin decisión humana. Falta que un humano revise el texto: no hay `verified`
- **ASR relacionados:** ninguno
- **Depende de / Reemplaza a:** —

## Contexto

`docs/security.md` establece el principio de doble control (4-eyes): ningún autor puede aprobar sus propias propuestas, incluso si posee roles `reviewer` o `admin`. El documento exige la validación en backend mediante `decideReviewRequest` y el ocultamiento correspondiente de acciones en la UI.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas.

1. **Permitir autoaprobación a roles privilegiados.** Reduce fricción operativa, pero elimina la separación de funciones.
2. **Bloquear toda decisión sobre solicitudes propias en backend y reflejarlo en UI (propuesta).** Mantiene la separación de funciones; requiere que backend sea la autoridad.

## Decisión

**Propuesta: bloquear en backend toda decisión de revisión sobre una solicitud cuyo autor sea el actor actual, y ocultar esas acciones en la UI.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía**, y el desarrollo no debe asumirlo:

- Si existe un procedimiento administrativo de excepción para corregir una solicitud propia.
- Si la regla aplica a todas las operaciones de revisión futuras o solo a aprobar, pedir cambios y rechazar.
- Qué evento de auditoría y retención debe registrar un intento bloqueado.

## Consecuencias

**Positivas:**

- Refuerza la separación de funciones y evita que la UI sea la única barrera.
- Hace consistente la política entre usuarios con capacidades combinadas.

**Negativas y riesgos:**

- Puede bloquear flujos operativos cuando el equipo de revisión es pequeño.
- La UI puede quedar desactualizada si el backend y la sesión no comparten el mismo autor/actor identity mapping.

**Impacto en pruebas:**

- Deben probarse intentos de autoaprobación para `reviewer`, `admin` y usuarios sin permiso.
- Debe verificarse que la UI oculte acciones, sin considerar ese ocultamiento suficiente para la seguridad.
