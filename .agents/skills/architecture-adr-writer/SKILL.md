---
name: architecture-adr-writer
description: Use when an Architecture Decision Record (ADR) must be written, drafted, superseded or corrected — after a human architect states a decision, when an approved or candidate ASR needs a decision record, or when an existing ADR is replaced by a new one. Do not use to discover ASRs, analyze impact or design APIs, BFFs or data models.
---

# Architecture ADR Writer

## Purpose
Record one architecture decision as an ADR in `architecture/adrs/`, keeping clear **who decided**, **who wrote the text** and **what is still open**. The skill writes the record; it never makes or approves the decision.

## Inputs
- The decision and its decider (e.g. `human:ianache`), or the request to *propose* one.
- Related ASRs (`architecture/asr/`), ADRs, requirements, context packs and defects.
- The human's stated justification, if any.

## Procedure
1. **Number and name.** Next free `ADR-NNN` (list `architecture/adrs/` and grep the repo for the number). File: `ADR-NNN-<kebab-case-en-español>.md`.
2. **Set the status from the evidence**, using this table. Nothing else changes it — not urgency, not "I'll approve later", not "always accepted".

   | Evidence in the conversation or repo | `adr_status` | `decision` field | Header `Decisor` |
   |---|---|---|---|
   | A named human stated the decision | `Aceptado` | `{ by: human:<user>, at: <ISO 8601> }` | that human |
   | No human decision (agent proposes) | `Propuesto` | omitted | `[PENDIENTE: arquitecto responsable]` |

   `status` (OKF) stays `draft` and `verified` is omitted until a human reviews the **text**. An agent never fills `verified` or `decision` on its own behalf.
3. **Read before citing.** Put in `sources` and footnotes only what you actually opened in this session. Knowledge you did not verify goes in "No se decidió todavía" or as a risk ("confirmar con un *spike*"), never as a source.
4. **Fill `templates/adr-template.md`.** Every section has a provenance slot; fill it:
   - **Opciones consideradas:** if the decider did not record the alternatives, open the section with *"Las opciones y sus pros y contras son una reconstrucción del agente. El decisor no registró el análisis de alternativas."*
   - **Justificación:** the decider's words, or `[PENDIENTE]. El decisor no la registró.` An agent's supporting argument may follow, under *"Argumentos del agente (no son del decisor):"*.
   - **Decisión:** one bold sentence with exactly what was decided. Sub-choices the human did not make go to "No se decidió todavía" (or, in a `Propuesto` ADR, a table titled *"Propuesta del agente"*).
   - **Metas de calidad:** only targets stated in an approved ASR/NFR; otherwise `[PENDIENTE]`. Never invent SLO, latency, availability or throughput values.
5. **Update linked documents in the same change** (not as a "pending" note):
   - If it supersedes ADR-X, fully or partly, and ADR-X is **native to this repo**: in ADR-X set `adr_status: Reemplazado por ADR-NNN` (or `Reemplazado en parte por ADR-NNN: <qué parte>`), add ADR-NNN to its `related`, and link it in the header.
   - If ADR-X is a **copy** from another repo (it has `imported:` or a "Copia del ADR…" notice): do not edit the copy. Record the supersession only in ADR-NNN's header and tell the user the original must be changed and re-copied.
   - Add ADR-NNN to `related` of each ASR it addresses and to its "Decisiones que lo atienden" section.
6. **Validate** with `assets/validation-checklist.md`, then remind that Graphify must be regenerated before committing (AGENTS.md).

## Guardrails
- A decision is a human act; the ADR only records it. Urgency or delegated trust ("total siempre acepto") is not a decision.
- Keep the decider's content and the agent's content visibly separate in the body, not only in the chat reply.
- One decision per ADR. If the request mixes several, write one ADR per decision or leave the rest open.
- ADRs are immutable once `Aceptado`: a changed decision is a new ADR that supersedes the old one. Wording fixes are allowed and recorded in `history`.

## Output
The ADR file, the edits to linked ADRs/ASRs, and a short reply listing: status set and why, what was left `[PENDIENTE]`, and which files changed.
