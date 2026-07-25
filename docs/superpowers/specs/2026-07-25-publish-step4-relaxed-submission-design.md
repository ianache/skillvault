# Publish Step 4 Relaxed Submission Design

## Context

The publish wizard currently lets users pass Step 2 with only two gates:

- `SKILL.md` must not exceed 300 lines.
- The user must check `Acepto continuar con la publicacion`.

However, Step 4 still submits to `/api/skills`, which calls `createReviewRequest()`. That path runs strict `validateSubmission()` checks for frontmatter and required body sections. As a result, users can reach final review and then see errors such as:

- `Maximo 280 caracteres`
- `Invalid input: expected object, received undefined`
- `Seccion requerida ausente: ## Descripcion`
- `Seccion requerida ausente: ## Cuando usar`
- `Seccion requerida ausente: ## Instrucciones`

This contradicts the intended relaxed publishing flow.

## Goal

Allow Step 4 to create a review request when the user explicitly accepts responsibility and the `SKILL.md` content is 300 lines or fewer.

The final submission gate must reject only:

- Missing or empty `rawContent`.
- More than 300 lines.
- Missing `acceptedResponsibility: true`.
- Invalid attached file payloads.

## Non-Goals

- Do not remove strict validation from reviewer approval.
- Do not automatically publish malformed skills to the catalog.
- Do not relax attachment path validation.
- Do not change the Step 1 metadata form constraints.

## Architecture

Add a relaxed creation path for `/api/skills` only.

`src/app/publish/page.tsx` will include `acceptedResponsibility: true` in the POST body when the user reaches Step 4. Since Step 2 already requires the checkbox before continuing, the Step 4 request can carry that prior consent forward.

`src/app/api/skills/route.ts` will parse this field and include it in the creation input. Invalid JSON, empty `rawContent`, invalid `files`, or missing consent will still return `400`.

`src/lib/review/service.ts` will create review requests through a relaxed submission parser for initial author submission. This parser will:

- Count lines and reject content over 300 lines.
- Parse frontmatter with `gray-matter` when possible.
- Use valid frontmatter values when present.
- Fill safe defaults when optional or currently invalid fields are absent.

The existing strict `validateSubmission()` behavior remains the source of truth for final activation in `activateApprovedRequest()`.

## Data Flow

1. User completes Step 2 by checking `Acepto continuar con la publicacion`.
2. User reviews Step 4 and clicks `Enviar a revision`.
3. Publish page sends `{ rawContent, files, acceptedResponsibility: true }`.
4. `/api/skills` validates the request shape and consent.
5. `createReviewRequest()` stores a pending review request using relaxed metadata extraction.
6. Reviewer later approves or requests changes.
7. Approval still runs strict validation before creating or updating a published skill.

## Metadata Fallbacks

When frontmatter is missing or incomplete, the review request needs enough database fields to render in review dashboards. Fallbacks will be deterministic:

- `name`: valid frontmatter `name`, otherwise a slug derived from the first Markdown heading, otherwise `draft-skill`.
- `description`: valid frontmatter `description`, otherwise `Skill enviado a revision sin descripcion validada.`
- `type`: valid `metadata.type`, otherwise `code`.
- `version`: valid SemVer, otherwise `1.0.0`.
- `schema_version`: valid string, otherwise `1.1`.
- `triggers`: valid `metadata.triggers`, otherwise `[name]`.
- `tools`, `compatibility`, `dependencies`, `config_requirements`: valid arrays when present, otherwise safe defaults.

If a generated fallback slug already has an open review request or published skill collision, keep the existing duplicate protections and return that error.

## Error Handling

The user-facing final submission errors should be limited to the agreed constraints:

- `SKILL.md content is required`
- `Maximo 300 lineas`
- `Debes aceptar continuar con la publicacion`
- `rawContent y files[] invalidos`
- Existing duplicate/open-review errors

Strict frontmatter and section errors should not appear during Step 4 submission.

## Testing

Add focused tests around `/api/skills` and review service behavior:

- POST accepts content under 300 lines with missing `metadata` and missing body sections when `acceptedResponsibility` is true.
- POST rejects the same payload without `acceptedResponsibility`.
- POST rejects content over 300 lines.
- Activation/approval still uses strict validation and rejects malformed content.

Run the existing test suite after implementation.
