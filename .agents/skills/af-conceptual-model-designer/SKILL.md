---
name: af-conceptual-model-designer
description: Crea y mantiene el modelo de información conceptual de negocio (conceptos, relaciones, cardinalidades y reglas) antes de cualquier modelo de datos lógico o físico. Úsalo cuando haya que entender cómo se relacionan los conceptos de un dominio, incorporar conceptos nuevos de una fuente o decisión, o preparar la entrada para data-model-designer.
---

# af-conceptual-model-designer

## Purpose

Mantiene **un modelo de información conceptual por producto o dominio** en `knowledge-base/business/information-model/IMD-NNN-<slug>.md` (Google OKF v0.2). Es un modelo **de negocio**: explica qué conceptos existen y cómo se relacionan, para que negocio, análisis funcional y arquitectura compartan el mismo entendimiento. No es un modelo de datos.

## Inputs

- Fuentes funcionales autorizadas: visión, reglas de negocio, User Stories, Context Packs, decisiones registradas.
- El glosario de negocio (`knowledge-base/business/glossary/`): cada concepto debe corresponder a un término.
- El modelo existente, si lo hay: se actualiza, no se reemplaza.

## Procedure

1. State the sources, the scope (producto o dominio) and the consumer.
2. Open the model for that scope. If none exists, create it from `templates/conceptual-model-template.md` with the next free `IMD-NNN`.
3. Extract candidate concepts from the sources: the things the business names, registers or decides about. Keep them only if they pass the concept test (below).
4. For each concept, find its glossary term. If it has none, keep the concept and open a question for `af-business-glossary-curator`; do not write the definition in the model.
5. Extract relationships. For each one record: ID, relationship in business language, cardinality, classification, source and open question (section 5 of the template).
6. Classify **derived concepts** (calculated from others: brechas, vigencias, candidatos, KPI) and **external concepts** (they live in another system) separately.
7. Draw the Mermaid `erDiagram`s. Split them by block or horizon when a diagram exceeds about 15 concepts. Every relationship classified as INFERENCE carries `(inf.)` in its label.
8. List the business rules that act on each concept (section 6), citing their IDs.
9. Run `python .claude/skills/af-conceptual-model-designer/scripts/check_model.py <model.md> --extract <tmp-dir>` and fix every error. `--extract` writes each diagram as `d1.mmd`, `d2.mmd`… in a temporary folder. If `npx` is available, render each one with `npx -y @mermaid-js/mermaid-cli@11 -i <tmp-dir>/d1.mmd -o <tmp-dir>/d1.svg` to confirm the syntax. On Windows, pass absolute paths.
10. Update `knowledge-base/index.md` and `knowledge-base/changelog.md`.
11. Emit readiness (section 9) with the human validation gate.

## Concept test

A concept belongs in the model when the business names it and at least one of these holds: it is registered, it is decided on, it has rules, or other concepts refer to it.

- **Actors** appear as concepts only when the business registers something about them (for example, the evaluator who signs an accreditation). Access permissions are not modelled here.
- **Screens, reports, KPI and dashboards** are not concepts: they are views over the model. Mention them only in the note on derived concepts.
- **Artifact identifiers** (BR-*, US-*, TRM-*) are never concepts.

## Modelling rules

- **Business language only.** No tables, primary or foreign keys, data types, indexes, nullability or technical identifiers. Attributes appear only when a source names them as business information (for example, "quién, cuándo y con qué evidencia").
- **Cardinality comes from the source.** When the source states the relationship but not its cardinality, write the cardinality you infer and classify it as INFERENCE, with the reasoning. When it cannot be inferred, write `UNKNOWN`.
- **Classification:** FACT (the source states it), INFERENCE (reasoned from cited sources) or UNKNOWN (needed but not supported). A relationship can be FACT for its existence and INFERENCE for its cardinality: say both.
- **`(inf.)` in diagrams:** mark the edge when the relationship itself is an inference. When only its cardinality is inferred, mark it `(card. inf.)`.
- **Qualifiers of a relationship** (for example, a competencia is "obligatoria" or "deseable" in a rol) go in the relationship row, not as a separate concept, unless the qualifier has rules or relationships of its own.
- **Rules without an ID:** cite them in section 6 as `<fuente>:Lnn (decisión, sin BR-*)`.
- **Horizon:** use the one the source gives; otherwise write it as an inference ("H2 (inf.)") or `Por definir`.
- **Decisions count as sources.** A human decision recorded in the knowledge base (for example, a BR-* rule or a "Decisión humana" row) supports a FACT; cite its ID.
- **Sources outside the knowledge base:** every `sources[].resource` must resolve (a repository path or a URL). A decision that is not yet in the knowledge base (an acta, an email, a message) may be used and classified as FACT citing it, but list it in section 9 as "pendiente de registro" and recommend recording it (for example with `af-business-rule-extractor`). Never write an invented path in `sources`.
- **Stable IDs:** concepts are named by their glossary term; relationships are `R-NN` and questions `IM-Qn`. Never renumber. A removed relationship stays in the table with the classification `RETIRADA` and the reason.
- **Reuse existing questions** (P-NN, GQ-NN, US-NNN-Qn, RCP-Qn) instead of opening duplicates.
- **The glossary owns definitions and synonyms.** The model links to glossary terms and never edits them. A new concept, a new synonym or a change that affects an approved term becomes an `IM-Qn` question for `af-business-glossary-curator`.

## Guardrails

- Do not invent concepts, relationships, cardinalities or rules.
- Do not design the data model: that belongs to `data-model-designer`, which takes this model as input.
- Absence of evidence is UNKNOWN, not proof that a relationship does not exist.
- Preserve contradictory sources in the relationship's question column.
- OKF v0.2: `status: draft`, `generated.by: af-conceptual-model-designer/1.0`, `generated.at` in ISO 8601 with `-05:00`. Never set `verified`: only a human flow assigns it.

## Output

The created or updated model, following `templates/conceptual-model-template.md`. Report to the user: concepts added or changed, relationships added or changed (with their classification), new questions, the output of `check_model.py`, diagram validation, and readiness.

## Workspace isolation (git worktree)

When the task will create or edit files, work in an isolated git worktree so the main branch receives nothing until a person decides.

- Check first: if `git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, you are already in a linked worktree (for example, one created by `af-requirements-orchestrator`). Work there and do not create another.
- In the main checkout, offer a worktree through `superpowers:using-git-worktrees` (branch `req/<slug>`) and honor the answer or a preference already declared. A worktree starts from the last commit: run `git status --short` and tell the user which uncommitted files it will not contain.
- If the caller says it will update `knowledge-base/index.md` and `changelog.md`, skip those steps and return the entries to add instead; parallel runs in one worktree would overwrite each other.
- Never commit, merge or delete the worktree on your own. When done, summarize `git status --short` and `git diff --stat` and let the user choose merge, PR, keep or discard. Read-only tasks need no worktree.
- Run the commands in this skill from the worktree root.
