---
type: ADR
id: ADR-NNN
title: <La decisión, como afirmación>
description: <Una sola oración con lo que se decide.>
tags: [architecture, adr, <dominio>]
status: draft
adr_status: <Aceptado | Propuesto>
decision: { by: human:<usuario>, at: <AAAA-MM-DDT00:00:00Z> }   # solo si adr_status es Aceptado
related: [<ADR, ASR, US, BFFD, ...>]
generated: { by: <agente>/<modelo>, at: <AAAA-MM-DDT00:00:00Z> }
# verified: se agrega solo cuando un humano revisa el texto
sources:   # solo documentos abiertos en esta sesión
  - id: <id>
    resource: </ruta/desde/la/raiz.md o URL>
    title: <título>
---

# ADR-NNN — <Título>

- **Estado:** <Aceptado | Propuesto>
- **Fecha:** <AAAA-MM-DD>
- **Decisor:** <usuario (`human:<usuario>`), el mismo identificador del campo `decision`; no deducir nombres completos | [PENDIENTE: arquitecto responsable]>
- **Redacción:** <agente/modelo>, a partir de <la decisión | una propuesta del agente, sin decisión humana>. Falta que un humano revise el texto: no hay `verified`
- **ASR relacionados:** <ASR-XXX (aprobado | candidato sin disposición) | ninguno>
- **Depende de / Reemplaza a:** <[ADR-XXX](/architecture/adrs/ADR-XXX-....md) | —>

## Contexto

- <Qué fuerza o problema obliga a decidir, con referencia a la fuente.>

## Opciones consideradas

<Si el decisor no registró las alternativas: "Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas.">

1. **<Opción>.** <A favor / en contra, con su fuente.>
2. **<Opción> (elegida | propuesta).**

## Decisión

**<Una oración con exactamente lo decidido.>**

**Justificación:** <palabras del decisor | [PENDIENTE]. El decisor no la registró.>

<Opcional> **Argumentos del agente (no son del decisor):**
- <argumento con fuente>

**No se decidió todavía**, y el desarrollo no debe asumirlo:
- <subdecisión abierta y quién la toma>

## Metas de calidad

<Solo metas de un ASR/NFR aprobado, citadas; si no hay, "[PENDIENTE]: sin ASR aprobado con métrica". Omitir la sección si no aplica.>

## Consecuencias

**Positivas:**
- <...>

**Negativas y riesgos:**
- <...>

**Impacto en pruebas:**
- <...>
