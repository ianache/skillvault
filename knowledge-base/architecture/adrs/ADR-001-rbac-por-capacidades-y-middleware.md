---
type: ADR
id: ADR-001
title: Aplicar RBAC mediante capacidades y middleware de rutas
description: SkillVault autoriza las rutas mediante capacidades derivadas de roles y una política de middleware del lado servidor.
tags: [architecture, adr, security, rbac]
status: draft
adr_status: Propuesto
related: []
generated: { by: architecture-adr-writer/1.0, at: 2026-10-05T00:00:00-05:00 }
sources:
  - id: SEC-001
    resource: /docs/security.md
    title: Modelo de Seguridad y Matriz de Roles (RBAC)
  - id: SUP-001
    resource: /docs/superpowers/specs/2026-07-29-user-role-rbac-audit-design.md
    title: User role RBAC audit and /agents access-control gap
---

# ADR-001 — Aplicar RBAC mediante capacidades y middleware de rutas

- **Estado:** Propuesto
- **Fecha:** 2026-10-05
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** architecture-adr-writer/1.0, a partir de una propuesta del agente, sin decisión humana. Falta que un humano revise el texto: no hay `verified`
- **ASR relacionados:** ninguno
- **Depende de / Reemplaza a:** —

## Contexto

SkillVault define cinco roles y una matriz de capacidades (`catalog:read`, `rating:write`, `content:manage`, `publish:create`, `review:manage`, `admin:manage`). `docs/security.md` indica que la autorización de rutas se ejecuta en `src/proxy.ts`, dirigida por `src/lib/auth/access-policy.ts`, antes de procesar o renderizar componentes.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas.

1. **Autorizar directamente por nombre de rol en cada ruta.** Simplifica algunos checks, pero duplica reglas y acopla las rutas al catálogo de roles.
2. **Autorizar mediante capacidades derivadas de roles y una política central de middleware (propuesta).** Mantiene una matriz extensible y una frontera server-side común; requiere mantener sincronizadas la política, la navegación y las APIs.

## Decisión

**Propuesta: aplicar el control de acceso de páginas mediante capacidades derivadas de roles y una política central en middleware server-side.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**Argumentos del agente (no son del decisor):**

- La matriz de capacidades y la tabla de rutas ya están documentadas como modelo operativo en `docs/security.md`.

**No se decidió todavía**, y el desarrollo no debe asumirlo:

- Si las APIs deben compartir exactamente la misma abstracción de capacidades o mantener validaciones independientes.
- Qué comportamiento prevalece para cada superficie ante una sesión con roles inconsistentes.
- Si las redirecciones por falta de permiso son la política definitiva para todas las rutas.

## Consecuencias

**Positivas:**

- Permite añadir roles o capacidades sin reescribir cada regla de ruta.
- Centraliza la protección temprana de páginas y hace explícita la matriz de autorización.

**Negativas y riesgos:**

- Puede producir deriva entre middleware, navegación y APIs si no existe una fuente común de pruebas.
- Una ruta omitida del matcher puede quedar sin enforcement, como evidenció la auditoría de `/agents` documentada en `docs/superpowers`.

**Impacto en pruebas:**

- Deben cubrirse rutas públicas, sesiones anónimas, cada capacidad y rutas anidadas.
- Debe verificarse que la navegación no sea la única barrera de seguridad.
