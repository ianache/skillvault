# Design Spec: Skill Approval Workflow & Status Visualization

**Date:** 2026-07-23  
**Status:** Approved  

---

## 1. Overview & Context

SkillVault enables authors to submit skill proposals and updates, which are reviewed by reviewers or admins. To provide clear visibility and streamline the review process, this design introduces:
1. Status-based filtering tabs (`Todas`, `Pendientes`, `Cambios solicitados`, `Aprobadas`, `Rechazadas`) with dynamic item counts in dashboards (`/dashboard/proposals` and `/dashboard/review`).
2. Enriched visual status badges (`ReviewStatusBadge.tsx`) with distinct color coding and icon indicators across all list and detail views.
3. An interactive vertical timeline component (`ReviewTimeline.tsx`) in the detail view rendering chronological submission, comments, reviewer decisions, and current state.

---

## 2. Architecture & Data Model Enhancements

### 2.1 Types (`src/lib/review/types.ts`)

```ts
export type ReviewStatus = "pending" | "changes_requested" | "approved" | "rejected";

export type ReviewStatusCounts = {
  all: number;
  pending: number;
  changes_requested: number;
  approved: number;
  rejected: number;
};

export type ListReviewRequestsQuery = {
  mine?: boolean;
  status?: ReviewStatus | "all";
};

export type ListReviewRequestsResponse = {
  requests: ReviewRequestSummary[];
  counts: ReviewStatusCounts;
};
```

---

### 2.2 Service Operations (`src/lib/review/service.ts`)

1. **`getReviewStatusCounts(actor: ReviewActor, options?: { mine?: boolean }, client: ReviewDatabaseClient)`**:
   Computes aggregated counts per status for the actor (mine for authors, all/filtered for reviewers/admins) using an efficient `GROUP BY status` query.

2. **`listReviewRequests(query: ListReviewRequestsQuery, actor: ReviewActor, client: ReviewDatabaseClient)`**:
   Filters review requests by `status` if provided (ignoring filter when `status === "all"`).

---

### 2.3 API Route (`src/app/api/review-requests/route.ts`)

- Accepts query parameter `status` (`pending`, `changes_requested`, `approved`, `rejected`, `all`).
- Returns JSON containing `{ requests: [...], counts: { all, pending, changes_requested, approved, rejected } }`.

---

## 3. UI Component Architecture

### 3.1 `ReviewStatusBadge.tsx`

Renders a styled status badge based on `status`:
- `pending`: Amber `#D97706` background `rgba(217,119,6,0.12)` — Label: `🕒 Pendiente`
- `changes_requested`: Accent Blue `#3B82F6` background `rgba(59,130,246,0.12)` — Label: `💬 Cambios solicitados`
- `approved`: Emerald Green `#10B981` background `rgba(16,185,129,0.12)` — Label: `✓ Aprobada`
- `rejected`: Coral Red `#EF4444` background `rgba(239,68,68,0.12)` — Label: `✕ Rechazada`

---

### 3.2 `ReviewFilterTabs.tsx`

Interactive filter bar displaying pills with count badges:
- `Todas (X)`
- `Pendientes (X)`
- `Cambios solicitados (X)`
- `Aprobadas (X)`
- `Rechazadas (X)`

Triggers state or URL query parameter updates to filter the displayed proposal list instantly.

---

### 3.3 `ReviewTimeline.tsx`

Renders a vertical timeline in `/dashboard/review/[id]` and `/dashboard/proposals/[id]` detailing:
1. **Submission Node**: Author name/handle and submission date (`submittedAt`).
2. **Comment Nodes**: File-specific and general comments placed by reviewers or authors.
3. **Decision Node**: Reviewer decision (`approved`, `rejected`, `changes_requested`) with reviewer handle, timestamp (`reviewedAt`), and general comment.
4. **Current Status Header/Footer**: Highlighted badge showing current request state.

---

### 3.4 Dashboard Integration (`/dashboard/proposals` and `/dashboard/review`)

- Integrates `ReviewFilterTabs` at the top of the request list.
- Uses `ReviewStatusBadge` inside table rows in `ReviewRequestList.tsx`.
- Displays contextual empty states when no requests match the selected status filter.

---

## 4. Verification & Testing Strategy

1. **Service Unit Tests (`src/lib/review/service.test.ts`)**:
   - Verify `getReviewStatusCounts` computes accurate counts for author and reviewer scopes.
   - Verify `listReviewRequests` correctly filters by status `pending`, `changes_requested`, `approved`, `rejected`.
2. **API Contract Tests (`src/lib/review/api-contract.test.ts`)**:
   - Verify GET `/api/review-requests?status=pending` returns filtered requests and full `counts` summary.
3. **UI Component Tests (`src/lib/review/ui-smoke.test.ts`)**:
   - Smoke test rendering of `ReviewStatusBadge`, `ReviewFilterTabs`, and `ReviewTimeline`.
