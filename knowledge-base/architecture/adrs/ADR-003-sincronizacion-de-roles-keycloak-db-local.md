---
type: ADR
id: ADR-003
title: Sincronizar roles de Keycloak con la base local durante el inicio de sesión
description: SkillVault deriva los roles del cliente Keycloak skillvault y sincroniza el usuario local sin bloquear el login ante una falla momentánea de la base.
tags: [architecture, adr, security, keycloak, identity]
status: draft
adr_status: Propuesto
related: []
generated: { by: architecture-adr-writer/1.0, at: 2026-10-05T00:00:00-05:00 }
sources:
  - id: SEC-001
    resource: /docs/security.md
    title: Modelo de Seguridad y Matriz de Roles (RBAC)
  - id: SUP-001
    resource: /docs/superpowers/specs/2026-07-27-default-user-role-session-design.md
    title: Default User Role in Session Design
  - id: SUP-002
    resource: /docs/superpowers/specs/2026-07-29-persist-user-role-design.md
    title: Add user to assignable/persisted roles
---

# ADR-003 — Sincronizar roles de Keycloak con la base local durante el inicio de sesión

- **Estado:** Propuesto
- **Fecha:** 2026-10-05
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** architecture-adr-writer/1.0, a partir de una propuesta del agente, sin decisión humana. Falta que un humano revise el texto: no hay `verified`
- **ASR relacionados:** ninguno
- **Depende de / Reemplaza a:** —

## Contexto

`docs/security.md` indica que los roles del cliente `skillvault` se extraen mediante `getEffectiveSkillVaultRoles` al iniciar sesión y que el registro local se sincroniza en cada login exitoso, añadiendo roles nuevos y revocando roles ausentes. También indica que una falla o latencia de la base local no debe bloquear el inicio de sesión.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas.

1. **Usar Keycloak como única fuente en cada autorización.** Reduce duplicación, pero no satisface la persistencia local documentada ni los usos administrativos locales.
2. **Sincronizar roles en login y continuar el login si falla la base (propuesta).** Conserva el modelo local y la continuidad de acceso; introduce una ventana potencial de inconsistencia.
3. **Bloquear login si falla la sincronización.** Favorece consistencia inmediata, pero convierte una dependencia local en una interrupción de autenticación.

## Decisión

**Propuesta: derivar los roles del cliente Keycloak `skillvault`, sincronizarlos con el usuario local durante el login y no bloquear el login ante una falla momentánea de la base local.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía**, y el desarrollo no debe asumirlo:

- Qué fuente gana cuando los roles de Keycloak y la base local difieren después de un login parcialmente fallido.
- Si el comportamiento de continuidad es fail-open para todas las capacidades o solo para completar la autenticación.
- Cómo se registra, reintenta y alerta una sincronización fallida.
- Si el rol fallback `user` se persiste siempre; esta cuestión está en conflicto entre documentos de `docs/superpowers`.

## Consecuencias

**Positivas:**

- Los cambios de roles en Keycloak pueden reflejarse en la tabla local sin intervención manual.
- Una incidencia temporal de la base no impide autenticar al usuario.

**Negativas y riesgos:**

- Puede existir una sesión válida con roles locales desactualizados.
- El fail-open puede ser inseguro si la sesión usa roles locales para decisiones sensibles.
- La sincronización bidireccional descrita debe distinguir con precisión altas, revocaciones y errores parciales.

**Impacto en pruebas:**

- Deben probarse altas, revocaciones, roles desconocidos y claims ausentes.
- Debe probarse una falla de DB durante `signIn`, verificando tanto continuidad del login como el estado observable de sincronización.
