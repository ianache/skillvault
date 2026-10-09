---
type: Knowledge Base Category
id: KB-CAT-BUSINESS
title: Artefactos de negocio
description: Contenido de negocio gobernado que define objetivos, actores, capacidades, restricciones, riesgos y vocabulario.
tags: [knowledge-base, business]
status: draft
generated:
  by: skill-creator/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - /.agents/skills/
---

# `knowledge-base/business`

## Propósito

Contener el contexto de negocio que debe preceder a requisitos, UX y arquitectura.

## Contenido esperado

- Objetivos y resultados de negocio (`BO-*`).
- Stakeholders y responsabilidades (`STK-*`).
- Capacidades de negocio (`BC-*`).
- Restricciones (`BCON-*`), riesgos (`BRISK-*`) y supuestos (`BAS-*`).
- Preguntas abiertas (`BOQ-*`).
- Reglas de negocio y sus evidencias.
- Glosario de términos y siglas, con sinónimos y fuentes.

## Skills registrados

No hay un Skill de negocio registrado actualmente en `.agents/skills`. Los Skills `course-builder`, `lesson-builder`, `evaluation-creator` y `content-validator` pertenecen al dominio de formación y no deben clasificarse como artefactos de negocio de software.

## Reglas de salida

Cada documento debe usar OKF v0.2, iniciar en `status: draft`, incluir `generated.by`, `generated.at` con zona `-05:00`, `sources` resolubles y no fabricar `verified`. Actualizar `knowledge-base/index.md` y `knowledge-base/changelog.md` en la misma operación.
