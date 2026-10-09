---
type: Business Glossary
title: "GLS-001 — Glosario de negocio"
description: "Catálogo indexado y ordenado alfabéticamente de los conceptos, términos y siglas de negocio. Cada término reside en su propio archivo OKF en terms/."
tags: [glossary, business, terms, acronyms]
status: draft
generated:
  by: "af-business-glossary-curator/1.1"
  at: "<AAAA-MM-DDTHH:MM:SS-05:00>"
sources:
  - id: <id-fuente>
    resource: </ruta/a/la/fuente.md>
---

# GLS-001 — Glosario de negocio

> **Procedencia:** <fuentes analizadas y su estado>. **Alcance:** <producto o dominio>. **Consumidor:** <roles o Skills que usan el glosario>. Ninguna definición está verificada hasta que la valide su responsable.

## Cómo leer este glosario

- Cada término es un artefacto OKF v0.2 propio en `terms/TRM-NNNN-<slug>.md`, con su estado y su verificación. Este catálogo es solo el índice: se genera con `glossary.py build` y no se edita a mano entre los marcadores.
- El índice está en orden alfabético del español: sin distinguir mayúsculas ni tildes, con la Ñ después de la N y las cifras antes de la A.
- El índice incluye sinónimos y formas completas de siglas en cursiva (*Sinónimo* → Término).
- Niveles de fuente: **N1** primaria, **N2** secundaria confiable, **N3** terciaria (no respalda una definición por sí sola).
- `Clasificación: gap` significa que no hay una fuente N1 o N2 que respalde la definición.

## Índice

<!-- glossary:index:start -->
<!-- glossary:index:end -->

## Preguntas abiertas

| ID | Término | Pregunta | Responsable | Prioridad | Estado |
|---|---|---|---|---|---|
| GQ-01 | [<Término>](terms/TRM-NNNN-<slug>.md) | | | | |

## Preparación y entrega

- **Estado:** READY / CONDITIONAL / NOT READY
- **Términos con `gap`:**
- **Decisión humana requerida:**

## Lista de calidad

- [ ] Cada definición tiene al menos una fuente N1 o N2 con localizador
- [ ] Sinónimos y formas completas respaldados por una fuente
- [ ] Sin conocimiento propio del modelo como fuente
- [ ] `glossary.py check` sin errores (marcar tras la última ejecución)
- [ ] `knowledge-base/index.md` y `changelog.md` actualizados
- [ ] Validación humana registrada
