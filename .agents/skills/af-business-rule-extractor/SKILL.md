---
name: af-business-rule-extractor
description: Extrae reglas de negocio, estados, validaciones, permisos y excepciones.
---

# business-rule-extractor

## Purpose

Extrae reglas de negocio, estados, validaciones, permisos y excepciones.

## Inputs

- Business objective, scope and authorized functional sources.
- Relevant Context Packs, User Stories, rules, impacts and constraints.
- Evidence with source, location, date, status and confidence.

## Procedure

1. State the question, scope and intended consumer.
2. Gather the minimum sufficient context from authorized sources.
3. Separate facts, assumptions, inferences, hypotheses and decisions.
4. Record contradictions, evidence gaps and responsible owners.
5. Produce the Business Rules Catalog using the bundled template.
6. Emit READY, CONDITIONAL or NOT READY with a human validation gate.

## Guardrails

- Do not invent actors, rules, states, APIs, dependencies or acceptance criteria.
- Do not design a technical solution when the task is functional.
- Absence of evidence is a gap, not proof that something does not exist.
- Recommendations are not decisions; human owners validate the result.
- Preserve provenance and contradictory sources.

## Output

Business Rules Catalog, with evidence register, open questions, risks, assumptions, readiness and handoff information. Use `templates\output-template.md` and `assets\evidence-schema.md` for the output format as the markdown part for the Google OKF v0.2 document format.

All results must be stored in `business\rules` folder.
## Workspace isolation (git worktree)

When the task will create or edit files, work in an isolated git worktree so the main branch receives nothing until a person decides.

- Check first: if `git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, you are already in a linked worktree (for example, one created by `af-requirements-orchestrator`). Work there and do not create another.
- In the main checkout, offer a worktree through `superpowers:using-git-worktrees` (branch `req/<slug>`) and honor the answer or a preference already declared. A worktree starts from the last commit: run `git status --short` and tell the user which uncommitted files it will not contain.
- If the caller says it will update `knowledge-base/index.md` and `changelog.md`, skip those steps and return the entries to add instead; parallel runs in one worktree would overwrite each other.
- Never commit, merge or delete the worktree on your own. When done, summarize `git status --short` and `git diff --stat` and let the user choose merge, PR, keep or discard. Read-only tasks need no worktree.
- Run the commands in this skill from the worktree root.
