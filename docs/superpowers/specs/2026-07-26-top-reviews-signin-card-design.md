# "Top 5 Skills · Reviews" card on /signin — design

## Context

The user wants a new card on the `/signin` page ranking skills by their average star rating (0-5 scale). `/signin` already has this exact pattern implemented four times — `Top 5 Skills · instalaciones`, `Top 5 Skills · recientes`, `Top 5 Contribuyentes`, `Top 5 Categorías` — all sharing one `rankRows()` helper and one card-rendering block in `src/app/signin/page.tsx`. Adding a fifth, rating-based card is structurally a near drop-in.

The blocker: a full star-rating feature (schema, migration scripts, API route, `SkillRating` UI component, wiring into the catalog/skill card/skills API) was built earlier in this repo's history but never committed or migrated against the dev database — it has been sitting as uncommitted/untracked changes. A "ranked by rating" card has nothing to rank without that data existing. Per the user's explicit choice, finishing and committing that feature is part of this work, done first.

## Part A — Finish the pre-existing ratings feature

Everything is already written correctly (re-verified against the working tree during brainstorming: schema additions, both migration scripts, the API route, `SkillRating.tsx`, `SkillRow` type additions, and the wiring into `src/app/page.tsx`, `src/components/SkillCard.tsx`, `src/app/api/skills/route.ts`). No new design work here — just:
1. Commit each file as-is.
2. **Exception:** `package.json`'s current uncommitted diff mixes the two new `migrate:skill-ratings` / `migrate:skill-ratings:mysql` script lines with an unrelated `"version": "0.1.0" → "0.4.0"` bump that wasn't made as part of this work (likely external deploy tooling, given recent unrelated `git log` entries like "build: bump chart deploy image tag"). Commit only the two script lines; leave the version bump as a still-uncommitted, untouched local change — do not guess whether it's meant to land.
3. Run `pnpm run migrate:skill-ratings` against the local SQLite dev database (idempotent — safe if some of this was already applied earlier).
4. Verify: `pnpm lint` clean, `pnpm dev` boots, the catalog page renders star widgets without error (same manual check performed when this feature was first built).

## Part B — the new card

In `src/app/signin/page.tsx`'s `getStats()`, add a new parallel query alongside the existing 4:
```sql
SELECT name, avg_rating, rating_count FROM skills
WHERE status = 'published' AND rating_count >= 1
ORDER BY avg_rating DESC, rating_count DESC
LIMIT 5
```
`rating_count >= 1` excludes unrated skills from ever appearing (a skill with one lucky 5-star rating is still real, unlike a skill with zero ratings and a default `avg_rating` of 0). `ORDER BY avg_rating DESC, rating_count DESC` is a simple two-key sort — no Bayesian/weighted-average smoothing, consistent with how the other four lists are simple `ORDER BY <metric> DESC LIMIT 5` with no statistical adjustment.

Map each row to `rankRows()`'s expected shape (`{ name, value, raw }`), same as the other four lists:
```ts
topRatings: topRatings.rows.map((r) => ({
  name: String(r.name),
  value: `${Number(r.avg_rating).toFixed(1)} ★ · ${r.rating_count}`,
  raw: Number(r.avg_rating),
})),
```
`raw` (the average rating, 0-5) drives `rankRows()`'s existing bar-percentage calculation (`pct = raw/max*100`) exactly like the other lists — no new logic needed there.

Add a 5th entry to the existing `topLists` array:
```ts
{ title: "Top 5 Skills · Reviews", barColor: "var(--amber)", rows: rankRows(stats.topRatings) },
```
`var(--amber)` is unused by the other four cards (green/accent/accent-indigo/rust), and reads as a fitting color for a star-rating card. The array's existing `.filter((l) => l.rows.length > 0)` already hides any card with zero rows — so on a fresh install with no ratings yet, this card simply doesn't render, with no separate empty-state to design.

Value format, per user's choice: `"4.8 ★ · 12"` (average to 1 decimal, star glyph, review count) — matches the compact, plain-text style of the other four cards' values (`"1.2k"`, `"hace 3 días"`, `"5 skills"`) rather than rendering 5 individual star icons per row, which would be a bigger visual departure from the existing card's row layout.

## Files touched

- `src/lib/db/schema.ts`, `src/lib/db/schema.mysql.ts` — commit as-is (already correct).
- `src/lib/db/migrate-skill-ratings.ts`, `src/lib/db/migrate-skill-ratings-mysql.ts` — commit as-is (new files).
- `package.json` — commit only the 2 new script lines.
- `src/app/api/skills/[slug]/rating/route.ts` — commit as-is (new file).
- `src/lib/types.ts` — commit as-is.
- `src/app/page.tsx`, `src/components/SkillCard.tsx`, `src/app/api/skills/route.ts` — commit as-is.
- `src/components/SkillRating.tsx` — commit as-is (new file).
- `src/app/signin/page.tsx` — new `topRatings` query + mapping + `topLists` entry (the only genuinely new code in this spec).

## Verification

1. `pnpm run migrate:skill-ratings` (idempotent, confirm no error).
2. `pnpm lint` clean across all committed files.
3. `pnpm dev`: visit `/`, confirm star widgets render on skill cards with no crash (Part A regression check).
4. Sign out, visit `/signin`: with zero ratings in the database, confirm the "Top 5 Skills · Reviews" card does not render (all 4 pre-existing cards should still render normally).
5. Sign in, rate at least one published skill via its star widget on the catalog page, sign out again, revisit `/signin`: confirm the new card now appears with that skill, correct average/count text, and a bar width proportional to its rating relative to the top entry.
6. Rate 2+ skills differently to confirm ranking order (highest average first, tie broken by rating count) and that the list caps at 5 entries.
