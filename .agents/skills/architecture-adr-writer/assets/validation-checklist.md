# architecture-adr-writer — checklist

- [ ] `ADR-NNN` is the next free number and is not used anywhere else in the repo.
- [ ] Frontmatter OKF: `type: ADR`, `id`, `title`, one-sentence `description`, `tags`, `status: draft`, `generated`.
- [ ] `adr_status: Aceptado` only with `decision: { by: human:<user>, ... }` backed by a human statement; otherwise `Propuesto` with no `decision`.
- [ ] No `verified` unless a named human reviewed the text.
- [ ] Every entry in `sources` and every footnote was opened in this session.
- [ ] "Opciones consideradas" states whether the alternatives come from the decider or are an agent reconstruction.
- [ ] Justification is the decider's or `[PENDIENTE]`; agent arguments are labeled as such.
- [ ] The decision is one sentence; sub-choices not made by a human are in "No se decidió todavía".
- [ ] No quality target without an approved ASR/NFR source.
- [ ] Superseded native ADRs updated (`adr_status`, `related`, header link); copied ADRs left untouched, with the user told to change the original.
- [ ] ASRs addressed list ADR-NNN in `related` and "Decisiones que lo atienden".
- [ ] `Decisor` uses the same user id as `decision` (no inferred full names).
- [ ] Links are repo-root relative (`/architecture/...`).
- [ ] Reminder given: regenerate Graphify before committing.
