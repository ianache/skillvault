# Skill Review Workflow Design

## Goal

Add a version-based review, approval, and publication workflow for SkillVault. Both new skills and new versions of existing skills must be reviewed before they become publicly available. Published skills remain available while a new version is under review.

## Scope

This design covers the first production-ready workflow for:

- Submitting new skills for review.
- Submitting new versions of existing published skills.
- Reviewing `SKILL.md` plus attached files.
- Adding general and per-file comments.
- Requesting changes, rejecting, or approving a proposal.
- Activating an approved proposal immediately.
- Keeping public catalog, download, and install endpoints limited to approved content.

Out of scope for this version:

- Email notifications.
- Webhooks.
- Line-level diff comments.
- Scheduled publication.
- Reviewer edits to author content.

## Users And Permissions

Authentication continues to use Auth.js with Keycloak roles.

Roles:

- `author`: can create review requests, view their own requests, edit their own requests while editable, and resubmit after changes are requested.
- `reviewer`: can view the review queue, comment on requests, approve, reject, or request changes.
- `admin`: can perform all reviewer and author actions, including resolving stuck requests.

Ownership rules:

- A user can edit only proposals where `authorId` matches the session user id.
- Reviewers can comment and decide, but cannot edit submitted content or attached files.
- Authors cannot approve their own proposals.
- Admin bypass is allowed for operational recovery, but admin actions must still be recorded with actor identity.

## Data Model

`skills` remains the source of truth for the currently published version. Public catalog, download, and install endpoints continue to read from `skills` and `skill_files`.

New table: `skill_review_requests`

- `id`
- `skillId`: nullable. `null` means this is a new skill. Non-null means this is a proposed version for an existing skill.
- `slug`
- `name`
- `description`
- `type`
- `version`
- `schemaVersion`
- `authorId`
- `authorHandle`
- `rawContent`
- `status`: `pending`, `changes_requested`, `approved`, `rejected`
- `reviewerId`
- `reviewerHandle`
- `generalComment`
- `submittedAt`
- `reviewedAt`
- `updatedAt`

New table: `skill_review_files`

- `id`
- `reviewRequestId`
- `path`
- `fileType`: `resource` or `script`
- `content`
- `changeType`: `added`, `modified`, `deleted`, `unchanged`
- `createdAt`

New table: `skill_review_comments`

- `id`
- `reviewRequestId`
- `filePath`: nullable for general comments, set for per-file comments.
- `authorId`
- `authorHandle`
- `body`
- `createdAt`

Status transitions:

- `pending` -> `approved`
- `pending` -> `rejected`
- `pending` -> `changes_requested`
- `changes_requested` -> `pending` when the author resubmits
- `changes_requested` -> `approved`
- `changes_requested` -> `rejected`

Final states are `approved` and `rejected`.

## Publication Semantics

For a new skill:

1. The author submits a review request.
2. The skill does not appear in the public catalog.
3. On approval, the system creates `skills`, writes `skill_files`, records a `skill_versions` snapshot, sets `publishedAt`, and marks the request `approved`.

For a new version:

1. The author submits a review request linked to the existing `skillId`.
2. The current published version remains visible and installable.
3. On approval, the system updates `skills`, replaces `skill_files`, records a `skill_versions` snapshot, sets `publishedAt`/`updatedAt`, and marks the request `approved`.

Approval must be atomic at the application level. If activation fails, the request must not become `approved`; the API returns an error and leaves the request in its previous reviewable state.

## API Design

New endpoints:

- `POST /api/review-requests`
  - Creates a review request from `rawContent` and optional attached files.
  - Used by the publish wizard and by version submission from the dashboard editor.

- `GET /api/review-requests?mine=1`
  - Lists requests owned by the current user.

- `GET /api/review-requests?status=pending`
  - Lists requests visible to reviewers/admins.

- `GET /api/review-requests/:id`
  - Returns request metadata, `SKILL.md`, attached files, comments, and published baseline metadata when the request targets an existing skill.

- `PATCH /api/review-requests/:id`
  - Allows the author to update `rawContent` and files while status is `pending` or `changes_requested`.

- `POST /api/review-requests/:id/comments`
  - Adds a general or per-file comment.

- `POST /api/review-requests/:id/decision`
  - Accepts `approve`, `reject`, or `request_changes`.
  - `reject` and `request_changes` require a general comment.

Existing endpoint behavior changes:

- `POST /api/skills` creates a review request instead of publishing immediately.
- `PATCH /api/skills/:slug` creates or updates a review request instead of modifying published content.
- Public `GET /api/skills`, skill detail, download, install, and CLI flows continue to read only approved published rows.

Conflict rules:

- Creating a request for a slug/version that already has an open request returns `409`, unless the endpoint is explicitly updating the current user's editable request.
- Approving a request that is no longer active returns `409`.
- Attempting to edit an `approved` or `rejected` request returns `409`.

Validation rules:

- `rawContent` must pass existing frontmatter and body validation.
- Attached file paths must be relative and must not include traversal such as `../`.
- Attached file paths must be unique within a request.
- Review decisions require authenticated users with the correct role.

## UI Design

Publish wizard:

- The final button becomes `Enviar a revision`.
- Successful submission routes to a success page showing `Pendiente de revision`, slug, version, and a link to the review request detail.
- New skills are not shown in the public catalog until approved.

Dashboard editor:

- Editing a published skill creates a proposed version instead of patching the published skill directly.
- The primary action becomes `Enviar nueva version a revision`.
- If the current author already has an open request for the same skill, the editor opens or updates that request rather than creating a duplicate.
- The existing published skill remains available until approval.

Author dashboard:

- Add `Mis propuestas`.
- Show status, skill slug, version, reviewer, latest comment summary, and last updated time.
- If status is `changes_requested`, the author can edit content/files and resubmit.

Reviewer dashboard:

- Add `Revision`.
- Show a queue of `pending` and `changes_requested` proposals.
- Detail view includes tabs for:
  - `SKILL.md`
  - `Adjuntos`
  - `Comentarios`
  - `Metadata`
- Each file can have comments.
- Actions are `Aprobar`, `Pedir cambios`, and `Rechazar`.
- `Pedir cambios` and `Rechazar` require a general comment.

Public catalog:

- No public pending-state banner in the initial version.
- Catalog displays only approved `skills.status = published`.

## Error Handling

- Unauthorized users receive `401`.
- Authenticated users without required role receive `403`.
- Missing requests or skills receive `404`.
- Duplicate open requests receive `409`.
- Invalid frontmatter, invalid body, and unsafe file paths receive `422`.
- Approval activation failures return `500` and leave the request unapproved.

## Testing Plan

API tests:

- Author creates a review request for a new skill.
- A new skill does not appear in catalog before approval.
- Reviewer requests changes with a required general comment.
- Author edits a `changes_requested` request and resubmits it to `pending`.
- Reviewer approves a new skill and it appears in the catalog.
- Reviewer approves a new version and it replaces the published version while preserving version history.
- Another author cannot edit someone else's request.
- Author cannot approve their own request.
- Reviewer cannot edit submitted content.
- Unsafe attached file paths are rejected.

UI tests:

- Publish wizard shows `Enviar a revision`.
- Successful submission shows pending-review success state.
- Author dashboard lists owned review requests.
- Reviewer dashboard lists pending requests and can submit a decision.

Regression checks:

- Public catalog still returns only published skills.
- Download and install endpoints continue serving the active published version while a newer request is pending.

## Migration Notes

Existing published skills remain published. No existing `skills` rows need to be converted into review requests.

SQLite and MySQL schemas must stay aligned. Migration scripts should create the three review tables and indexes for:

- `skill_review_requests.status`
- `skill_review_requests.authorId`
- `skill_review_requests.skillId`
- `skill_review_requests.slug`
- `skill_review_files.reviewRequestId`
- `skill_review_comments.reviewRequestId`

## Success Criteria

- No unapproved skill or version is visible in the public catalog.
- Authors can submit and revise proposals without reviewer content edits.
- Reviewers can evaluate `SKILL.md` and attached files with general and per-file comments.
- Approval immediately activates the proposed version.
- The active published version remains installable while another version is pending.
