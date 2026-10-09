---
type: Knowledge Base Category
id: KB-CAT-REQUIREMENTS
title: Artefactos de requisitos
description: Contexto, necesidades, restricciones y requisitos trazables que alimentan diseño y arquitectura.
tags: [knowledge-base, requirements]
status: draft
generated:
  by: skill-creator/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - /.agents/skills/
---

# `knowledge-base/requirements`

## Propósito

Contener requisitos y context packs trazables, separados de decisiones arquitectónicas y de diseños técnicos.

## Contenido esperado

- Requirement Context Packs.
- Requisitos funcionales y no funcionales.
- Actores, necesidades, reglas, restricciones, supuestos y preguntas abiertas.
- Trazabilidad hacia historias de usuario, ASRs, ADRs, diseño, implementación y evidencia de pruebas.
- Conflictos y decisiones humanas pendientes.

## Skills registrados

No hay un Skill de requisitos de software registrado actualmente en `.agents/skills`. `architecture-discovery` consume requisitos, pero sus outputs pertenecen a `knowledge-base/architecture/`. Los Skills de cursos y lecciones generan material formativo, no requisitos de software.

## Reglas de salida

Cada documento debe usar OKF v0.2, iniciar en `status: draft`, incluir `generated.by`, `generated.at` con zona `-05:00`, `sources` resolubles y no fabricar `verified`. Actualizar `knowledge-base/index.md` y `knowledge-base/changelog.md` en la misma operación.
