---
name: af-business-glossary-curator
description: Extrae y documenta conceptos, términos y siglas de negocio en un glosario indexado y ordenado alfabéticamente, con sinónimos, definición y fuentes de respaldo. Úsalo cuando haya que crear o actualizar el glosario de negocio, definir un término o sigla, o cuando un artefacto usa vocabulario de negocio sin definirlo.
---

# business-glossary-curator

## Purpose

Mantiene el **Glosario de negocio** en `knowledge-base/business/glossary/`. Cada concepto, término o sigla es un artefacto Google OKF v0.2 propio en `terms/TRM-NNNN-<slug>.md`, con nombre, sinónimos, definición y las fuentes que la respaldan (con preferencia por fuentes de primer nivel, N1). El catálogo `GLS-001-glosario-de-negocio.md` es el índice alfabético generado de esos archivos, más las preguntas abiertas y el estado de preparación.

## Inputs

- Fuentes autorizadas a analizar: artefactos de `knowledge-base/`, fichas, documentos corporativos y decisiones registradas.
- El glosario existente y sus términos, si ya existen (se actualizan, no se reemplazan).
- Acceso web cuando haga falta consultar fuentes externas N1.

## Procedure

1. State the sources analyzed, the scope (producto o dominio) and the intended consumer.
2. Open the catalog `knowledge-base/business/glossary/GLS-001-glosario-de-negocio.md`. If it does not exist, create it from `templates/glossary-template.md`. Outside the index markers the catalog is edited by hand: add each new analyzed source to its **Procedencia** line and frontmatter `sources`, and update its `generated.at`.
3. List candidate terms and keep only those that pass the inclusion test (below).
4. For each term, look it up in the catalog index by name, sinónimo and forma completa. If it exists, edit its file in `terms/` (add sources, synonyms or notes, and update its `generated.at`). If not, create it with `python .claude/skills/af-business-glossary-curator/scripts/glossary.py new <glossary-dir> "<Nombre>"`, which assigns the next ID and copies `templates/term-template.md`; then fill every `<...>` placeholder.
5. Assign every source a level from `assets/source-levels.md`. For terms whose meaning is defined outside the organization (estándares, siglas técnicas, productos de terceros), consult the N1 source and record its URL and consultation date.
6. Record contradictions between sources in the term's **Notas** and in the catalog's open questions (linking the term file). Keep both sources.
7. Run `python .claude/skills/af-business-glossary-curator/scripts/glossary.py build <glossary-dir>`: it copies each term's **Definición** into its `description`, derives its frontmatter `sources` from **Fuentes**, and regenerates the alphabetical index. Then run `python .claude/skills/af-business-glossary-curator/scripts/glossary.py check <glossary-dir>` and fix every error until it reports 0 errors. `build` does not touch the catalog's hand-edited **Aprobación** line: update its totals (terms, and how many are `approved`) so they match what `check` reports. Leave historical validation records ("N de M términos" in the human-validation checklist) as they were.
8. Update `knowledge-base/index.md` and `knowledge-base/changelog.md`.
9. Emit READY, CONDITIONAL or NOT READY, with the human validation gate.

## Inclusion test

Include a term when the source gives it a specific business meaning: actors, entities, products, business concepts, states, metrics, business systems, and the siglas the sources use.

Exclude:
- Identifiers of knowledge-base artifacts (BR-*, EVD-*, P-nn, AMB-*, TRM-*).
- Vocabulary of the documentation method (READY, CONDITIONAL, confidence, classification).
- Common words used with their ordinary meaning.

Grouping:
- A scale or series of codes (L1–L4, H1–H3) gets one term for the scale, with each value in its definition.
- A metric the source defines by name (each KPI) gets its own term.
- A classification whose values the source defines with their own rules (competencia obligatoria / deseable) gets one term per value; if the values only have names, one term for the classification.
- A sigla that is the short form of a term already in the catalog (PM → Líder de proyecto) is a **sinónimo** of that term, not a separate term.

## Source rules

- Each definition needs at least one N1 or N2 source with a locator (`archivo:Lnn`, section, URL).
- An internal document's level follows its verification, not its kind: an acta or decision record in `draft` is N2; once a human verifies or approves it, it is N1.
- The model's own knowledge is **not** a source. If no N1/N2 source can be found or accessed, set `Clasificación: gap`, write the best-supported definition from the sources analyzed, and open a question.
- N3 sources (Wikipedia, blogs, foros, texto generado por IA) never support a definition on their own.
- A `draft` internal artifact is N2, not N1, until a human verifies it.
- `Clasificación: gap` means no N1/N2 source **defines** the term (it is only used or mentioned). An unknown expansion of a sigla whose meaning is supported is not a gap: set `Forma completa: Desconocida` and open a question.
- Fallback order when the N1 original cannot be accessed: an official reproduction of the same text (the standard body's preview, the owner's own page citing the standard), then N2. Record which one you used.
- When the business meaning differs from the reference meaning, keep the business meaning in **Definición** and the N1 meaning in **Definición de referencia**.

## Entry rules

- **Sinónimos:** only forms attested in a source, each with its locator. Translations or paraphrases you propose are not synonyms. Separate synonyms with `;` and several locators inside one bracket with `,` (`PM [VIS-001:L42, ACTA-002:L18]`). When a synonym is a sigla, its attested expansion is another synonym.
- **Siglas:** `Tipo: sigla`, with **Forma completa** backed by a source. If no source expands it, write `Desconocida` and open a question; do not guess the expansion.
- **IDs and file names** (`TRM-NNNN-<slug>.md`) are permanent: never renumber, reuse or rename them. If a term's name changes, change `title` and the `#` heading, and keep the old name as a sinónimo. A retired term keeps its file with `status: deprecated` and a note pointing to its replacement.
- **Index, order, `description` and frontmatter `sources`** are generated by `build`; do not edit them by hand. Everything else in a term file is edited by hand.
- **Responsable:** the role that owns the term's domain according to the sources; if you take it from a source other than the one that defines the term, cite that locator in **Notas**. If no source assigns an owner, write `Por definir` and open a question.
- **Locators:** full repo-relative path in **Fuentes** (`/knowledge-base/...md:L59`); the short form `[VIS-001:L59]` is fine inside **Sinónimos** and **Forma completa**. Dates of consultation use the environment's current date.
- **Relacionados:** relative links to other term files (`[Brecha](TRM-0007-brecha.md)`).
- **Open questions:** link the term file. Close a question only when an N1/N2 source answers it: keep the row and set its state to `Cerrada — <fuente:Lnn>`, adding `(N2, sin verificar)` when the answer comes from an unverified source. Never delete rows.
- **OKF v0.2:** every term file and the catalog keep their frontmatter: `type` (`Business Term` / `Business Glossary`), `title`, `description`, `tags`, `status: draft`, `generated.by: af-business-glossary-curator/1.1`, `generated.at` in ISO 8601 with `-05:00`, and `sources`. New terms start as `status: draft`.
- **Approval:** never approve a term on your own initiative. When a human explicitly approves terms, set `status: approved` and add `verified.by` (their name and role) and `verified.at` after the `generated` block, only on the terms they named, and record it in the changelog.
- **Approved terms:** do not edit their Definición, Sinónimos, Forma completa or Fuentes. Record the proposed change as an open question for the term's Responsable; a human decides whether the term goes back to `draft`.

## Guardrails

- Do not invent definitions, synonyms, expansions of siglas, owners or sources.
- Absence of evidence is a gap, not proof that the term means nothing.
- Recommendations are not decisions; the term owner validates the definition.

## Output

The updated term files (`templates/term-template.md`) and catalog (`templates/glossary-template.md`), with source levels from `assets/source-levels.md`, open questions, readiness and handoff. Report to the user: terms added, terms updated, terms left as `gap`, and the final output of `glossary.py check`.

Store results in `knowledge-base/business/glossary/` (catalog) and `knowledge-base/business/glossary/terms/` (one file per term).

## Workspace isolation (git worktree)

When the task will create or edit files, work in an isolated git worktree so the main branch receives nothing until a person decides.

- Check first: if `git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, you are already in a linked worktree (for example, one created by `af-requirements-orchestrator`). Work there and do not create another.
- In the main checkout, offer a worktree through `superpowers:using-git-worktrees` (branch `req/<slug>`) and honor the answer or a preference already declared. A worktree starts from the last commit: run `git status --short` and tell the user which uncommitted files it will not contain.
- If the caller says it will update `knowledge-base/index.md` and `changelog.md`, skip those steps and return the entries to add instead; parallel runs in one worktree would overwrite each other.
- Never commit, merge or delete the worktree on your own. When done, summarize `git status --short` and `git diff --stat` and let the user choose merge, PR, keep or discard. Read-only tasks need no worktree.
- Run the commands in this skill from the worktree root.
