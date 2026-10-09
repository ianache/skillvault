---
name: af-user-story-refiner
description: Transforma contexto validado en User Stories independientes, una por archivo, con criterios Given/When/Then, casos negativos, INVEST y Definition of Ready. Úsalo cuando haya que redactar, refinar o dividir User Stories a partir de Context Packs, reglas de negocio o un catálogo de historias.
---

# user-story-refiner

## Purpose

Produce **una User Story por archivo** (Google OKF v0.2), con el formato estándar de `templates/output-template.md`. Cada historia debe poder leerse, estimarse, priorizarse y validarse sola, sin abrir otros documentos.

## Inputs

- Business objective, scope and authorized functional sources.
- Relevant Context Packs, story catalogs, business rules, glossary, impacts and constraints.
- Evidence with source, location, date, status and confidence (`assets/evidence-schema.md`).

## Procedure

1. State the question, scope, intended consumer and which stories you will produce.
2. Gather the minimum sufficient context from authorized sources. Prefer a Requirement Context Pack when one exists, and say whether it is validated.
3. Separate facts, assumptions, inferences, hypotheses and decisions.
4. For each story:
   1. Reuse its ID if a story catalog already assigns one; otherwise take the next free `US-NNN` in `knowledge-base/requirement/user-stories/`. Never renumber.
   2. Copy `templates/output-template.md` to `knowledge-base/requirement/user-stories/US-NNN-<slug>.md` (slug: lowercase, no accents, hyphens, at most 40 characters). If the file exists, update it instead of creating another.
   3. Fill every section. When a section does not apply, write why (for example "Sin requisito identificado"); do not delete it. Leave no `<...>` placeholder.
   4. Record contradictions, evidence gaps and owners in sections 11–13.
   5. Evaluate INVEST (section 14) and the Definition of Ready (section 15), then set readiness.
5. Update the story catalog (if one exists) with a link to each story file, and update `knowledge-base/index.md` and `knowledge-base/changelog.md`.
6. Emit READY, CONDITIONAL or NOT READY for each story, with the human validation gate.

## Writing rules

- **One story, one behavior:** the story delivers value to one actor. If it needs more than one iteration, or mixes independent behaviors, propose a split in section 17 (by workflow step, business-rule variation, happy vs. unhappy path, or data variation).
- **"Quiero" states a need, not a solution:** no screens, buttons, APIs or technologies.
- **Actor:** exactly as the sources name it, linked to the glossary. An actor you infer is marked as a hypothesis in section 11.
- **Acceptance criteria:** Gherkin (`Dado / Cuando / Entonces`), one behavior per scenario, observable results, each one citing its rule or source. A behavior with no source is not a criterion: it goes to section 6 as "Sin regla" with a question in section 12.
- **Negative and edge cases:** always consider invalid input, missing permission, empty data and boundary values. Describe the expected behavior only when a source supports it.
- **Priority** is a MoSCoW proposal with its reason; the PO decides. **Estimation** stays blank: the team estimates.
- **Non-functional requirements:** always include accessibility WCAG 2.2 AA and the privacy of personal data. Add others only when a source requires them.
- **UX considerations:** flow, interface states (empty, no permission, error, success) and key content. No visual design. Interface states go in section 10, not in section 6.
- **Section 6 vs 11 vs 12:** section 6 lists business negative and edge cases; a case without a rule only references its question ID. Section 12 holds the question. Section 11 holds only hypotheses and assumptions that a criterion or rule relies on. Do not repeat the same unknown in all three.

## IDs and sources

- **Question IDs:** reuse the existing ID when the question already exists (P-NN, GQ-NN, RCP-QN…). A new question is scoped to the story: `US-NNN-Qn`.
- **Evidence IDs:** reuse the existing `EVD-AAAA-NNNN` of the same finding; a new finding takes the next free number across `knowledge-base/` (search for the highest). Put the evidence-schema fields that all rows share (source_type, observed_at, freshness, owner) in one "Evidencia compartida" line under the table.
- **Sources:** another story in a catalog is not a source for a rule or criterion; cite the source that story is based on.
- **PO:** the Responsable of the story's domain according to the sources (for example, the Responsable of the actor's or the main term's glossary entry). If none is named, write `Por definir` and open a question.
- **Terms:** use the glossary term for actors and concepts. A business term that is not in the glossary gets a question for `af-business-glossary-curator`.

## Readiness

| Estado | Cuándo |
|---|---|
| READY | Every Definition of Ready item except PO validation is met, and no open question blocks. |
| CONDITIONAL | Actor, value and the core acceptance criteria are supported, but at least one open question blocks part of the behavior. |
| NOT READY | The actor or the value is not supported, or the core acceptance criteria cannot be written. |

A prerequisite story that does not exist yet does not change readiness, but it blocks delivery: record it in sections 11 and 12 and state it in the section 17 reason.

## Guardrails

- Do not invent actors, rules, states, APIs, dependencies or acceptance criteria.
- Do not design a technical solution when the task is functional.
- Absence of evidence is a gap, not proof that something does not exist.
- Recommendations (priority, split) are not decisions; human owners validate the result.
- Preserve provenance and contradictory sources.
- OKF v0.2: `status: draft`, `generated.by: af-user-story-refiner/2.0`, `generated.at` in ISO 8601 with `-05:00`. Never set `verified`: only a human flow assigns it.

## Output

One file per User Story in `knowledge-base/requirement/user-stories/US-NNN-<slug>.md`, following `templates/output-template.md`. Report to the user: stories created or updated, readiness of each one, blocking questions, and any proposed splits.

## Workspace isolation (git worktree)

When the task will create or edit files, work in an isolated git worktree so the main branch receives nothing until a person decides.

- Check first: if `git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, you are already in a linked worktree (for example, one created by `af-requirements-orchestrator`). Work there and do not create another.
- In the main checkout, offer a worktree through `superpowers:using-git-worktrees` (branch `req/<slug>`) and honor the answer or a preference already declared. A worktree starts from the last commit: run `git status --short` and tell the user which uncommitted files it will not contain.
- If the caller says it will update `knowledge-base/index.md` and `changelog.md`, skip those steps and return the entries to add instead; parallel runs in one worktree would overwrite each other.
- Never commit, merge or delete the worktree on your own. When done, summarize `git status --short` and `git diff --stat` and let the user choose merge, PR, keep or discard. Read-only tasks need no worktree.
- Run the commands in this skill from the worktree root.
