---
type: Knowledge Base Category
id: KB-CAT-DEPLOYMENT
title: Artefactos de deployment
description: Configuración, runbooks, decisiones y evidencia de despliegue por entorno.
tags: [knowledge-base, deployment]
status: draft
generated:
  by: skill-creator/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - /.agents/skills/
---

# `knowledge-base/deployment`

## Propósito

Contener los artefactos necesarios para desplegar, operar, verificar y retirar versiones de software de forma trazable.

## Contenido esperado

- Configuración por entorno y variables no sensibles.
- Runbooks, procedimientos de rollout, rollback y recuperación.
- Manifiestos, parámetros de infraestructura y dependencias operativas.
- Evidencia de despliegue, salud, observabilidad y aprobación.
- Riesgos, ventanas, responsables y preguntas abiertas.

## Skills registrados

No hay un Skill de deployment registrado actualmente en `.agents/skills`.

## Reglas de salida

Los futuros artefactos deben usar OKF v0.2, iniciar en `status: draft`, incluir `generated.by`, `generated.at` con zona `-05:00`, `sources` resolubles y no contener secretos. Nunca fabricar evidencia de despliegue ni `verified`.
