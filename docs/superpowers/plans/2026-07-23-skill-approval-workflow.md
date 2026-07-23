# Skill Approval Workflow & Status Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement status-based filtering tabs with item counts, enriched visual status badges, and an interactive vertical timeline component for skill approval requests.

**Architecture:** Extend `src/lib/review/` types and service functions with status aggregation counts. Create modular UI components (`ReviewStatusBadge.tsx`, `ReviewFilterTabs.tsx`, `ReviewTimeline.tsx`) and integrate them into proposal and review dashboards (`/dashboard/proposals` and `/dashboard/review`).

**Tech Stack:** Next.js (App Router), TypeScript, React, Vitest, Vanilla CSS / inline styles.

## Global Constraints

- Support all 4 review statuses: `pending`, `changes_requested`, `approved`, `rejected`.
- Maintain full compatibility with existing MySQL and SQLite database backends.
- All code changes must pass TypeScript type checking (`npx tsc --noEmit`) and tests (`pnpm test`).

---

### Task 1: Add `ReviewStatusCounts` & Service Status Aggregation (`src/lib/review/types.ts` & `src/lib/review/service.ts`)

**Files:**
- Modify: `src/lib/review/types.ts`
- Modify: `src/lib/review/service.ts`
- Modify: `src/app/api/review-requests/route.ts`
- Test: `src/lib/review/service.test.ts`
- Test: `src/lib/review/api-contract.test.ts`

**Interfaces:**
- Consumes: `ListReviewRequestsQuery`
- Produces: `ReviewStatusCounts` and `getReviewStatusCounts(actor, options, db)`

- [ ] **Step 1: Update `src/lib/review/types.ts` with status counts types**

Modify `src/lib/review/types.ts`:

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

- [ ] **Step 2: Add `getReviewStatusCounts` helper in `src/lib/review/service.ts`**

Add status counting logic in `src/lib/review/service.ts`:

```ts
export async function getReviewStatusCounts(
  actor: ReviewActor,
  options: { mine?: boolean } = {},
  client: ReviewDatabaseClient
): Promise<ReviewStatusCounts> {
  const isMine = options.mine ?? !canReview(actor);
  const whereClause = isMine ? "WHERE author_id = ?" : "";
  const args = isMine ? [actor.id] : [];

  const result = await client.execute({
    sql: `SELECT status, COUNT(*) as count FROM skill_review_requests ${whereClause} GROUP BY status`,
    args,
  });

  const counts: ReviewStatusCounts = {
    all: 0,
    pending: 0,
    changes_requested: 0,
    approved: 0,
    rejected: 0,
  };

  for (const row of result.rows) {
    const status = String(row.status) as ReviewStatus;
    const count = Number(row.count ?? 0);
    if (status in counts) {
      counts[status] = count;
      counts.all += count;
    }
  }

  return counts;
}
```

- [ ] **Step 3: Update `listReviewRequests` to support status filtering**

In `src/lib/review/service.ts`, filter SQL query by status when `query.status` is provided and not `"all"`:

```ts
if (query.status && query.status !== "all") {
  whereClauses.push("status = ?");
  args.push(query.status);
}
```

- [ ] **Step 4: Update `src/app/api/review-requests/route.ts` GET handler**

Update the GET route handler to include `counts`:

```ts
const counts = await getReviewStatusCounts(actor, { mine: query.mine }, db);
const requests = await listReviewRequests(query, actor, db);
return NextResponse.json({ requests, counts });
```

- [ ] **Step 5: Write unit and contract tests**

Add tests to `src/lib/review/service.test.ts` verifying `getReviewStatusCounts`:

```ts
test("computes accurate review status counts for author and reviewer", async () => {
  const db = createTestDb();
  const author: ReviewActor = { id: "user-1", handle: "user", roles: ["editor"] };
  await createReviewRequest({ rawContent: VALID_SKILL_MD }, author, db);

  const counts = await getReviewStatusCounts(author, { mine: true }, db);
  expect(counts.pending).toBe(1);
  expect(counts.all).toBe(1);
});
```

- [ ] **Step 6: Run tests to verify implementation**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 7: Commit changes**

```bash
git add src/lib/review/types.ts src/lib/review/service.ts src/app/api/review-requests/route.ts src/lib/review/service.test.ts
git commit -m "feat(review): add status counts aggregation and filtered query support"
```

---

### Task 2: Build `ReviewStatusBadge` & `ReviewFilterTabs` Components

**Files:**
- Create: `src/components/review/ReviewStatusBadge.tsx`
- Create: `src/components/review/ReviewFilterTabs.tsx`
- Modify: `src/components/review/ReviewRequestList.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `ReviewStatus`, `ReviewStatusCounts`
- Produces: Visual status badge component and filter tab bar.

- [ ] **Step 1: Create `src/components/review/ReviewStatusBadge.tsx`**

```tsx
import type { ReviewStatus } from "@/lib/review/types";

type Props = {
  status: ReviewStatus;
  size?: "sm" | "md";
};

const STATUS_CONFIG: Record<ReviewStatus, { label: string; icon: string; color: string; bg: string }> = {
  pending: { label: "Pendiente", icon: "🕒", color: "#D97706", bg: "rgba(217,119,6,0.12)" },
  changes_requested: { label: "Cambios solicitados", icon: "💬", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  approved: { label: "Aprobada", icon: "✓", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  rejected: { label: "Rechazada", icon: "✕", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export function ReviewStatusBadge({ status, size = "sm" }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isSm = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: isSm ? "11px" : "12.5px",
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}40`,
        borderRadius: "20px",
        padding: isSm ? "3px 9px" : "5px 12px",
        letterSpacing: "0.02em",
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/review/ReviewFilterTabs.tsx`**

```tsx
"use client";

import type { ReviewStatus, ReviewStatusCounts } from "@/lib/review/types";

type Props = {
  activeTab: ReviewStatus | "all";
  counts?: ReviewStatusCounts;
  onChangeTab: (tab: ReviewStatus | "all") => void;
};

const TABS: { id: ReviewStatus | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "changes_requested", label: "Cambios solicitados" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

export function ReviewFilterTabs({ activeTab, counts, onChangeTab }: Props) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts ? counts[tab.id] : undefined;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              borderColor: isActive ? "var(--accent)" : "var(--border)",
              background: isActive ? "var(--accent)" : "var(--surface)",
              color: isActive ? "#fff" : "var(--text)",
              transition: "all .15s ease",
            }}
          >
            {tab.label}
            {typeof count === "number" && (
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "11px",
                  opacity: isActive ? 0.9 : 0.65,
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(255,255,255,0.25)" : "var(--raised)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Update `ReviewRequestList.tsx` to use `ReviewStatusBadge`**

Replace old status badge rendering in `src/components/review/ReviewRequestList.tsx` with `ReviewStatusBadge`.

- [ ] **Step 4: Run typecheck and test**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/components/review/ReviewStatusBadge.tsx src/components/review/ReviewFilterTabs.tsx src/components/review/ReviewRequestList.tsx
git commit -m "feat(ui): add ReviewStatusBadge and ReviewFilterTabs components"
```

---

### Task 3: Build `ReviewTimeline` Component & Integrate Dashboard Views

**Files:**
- Create: `src/components/review/ReviewTimeline.tsx`
- Modify: `src/components/review/ReviewRequestDetail.tsx`
- Modify: `src/app/dashboard/proposals/page.tsx`
- Modify: `src/app/dashboard/review/page.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `ReviewRequestDetailDto`
- Produces: Chronological timeline section rendering review request lifecycle history.

- [ ] **Step 1: Create `src/components/review/ReviewTimeline.tsx`**

```tsx
import type { ReviewRequestDetailDto } from "@/lib/review/types";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type Props = {
  request: ReviewRequestDetailDto;
};

export function ReviewTimeline({ request }: Props) {
  const events = [
    {
      id: "submission",
      type: "submitted",
      date: request.submittedAt,
      author: request.authorHandle ?? "Autor",
      title: "Solicitud enviada a revisión",
    },
    ...request.comments.map((c) => ({
      id: `comment-${c.id}`,
      type: "comment",
      date: c.createdAt,
      author: c.authorHandle ?? "Usuario",
      title: c.filePath ? `Comentario en ${c.filePath}` : "Comentario general",
      body: c.body,
    })),
    ...(request.reviewedAt
      ? [
          {
            id: "decision",
            type: "decision",
            date: request.reviewedAt,
            author: request.reviewerHandle ?? "Revisor",
            title: `Decisión: ${request.status}`,
            body: request.generalComment,
            status: request.status,
          },
        ]
      : []),
  ].sort((a, b) => a.date - b.date);

  return (
    <div style={{ marginTop: "32px", padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>
        Historial y Línea de Tiempo
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
        {events.map((event) => (
          <div key={event.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ minWidth: "10px", height: "10px", borderRadius: "50%", background: "var(--accent)", marginTop: "5px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{event.title}</span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {new Date(event.date).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>Por {event.author}</div>
              {"body" in event && event.body && (
                <div style={{ marginTop: "6px", padding: "8px 12px", background: "var(--raised)", borderRadius: "6px", fontSize: "12.5px", color: "var(--text)" }}>
                  {event.body}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `ReviewRequestDetail.tsx` to include `ReviewTimeline`**

Integrate `<ReviewTimeline request={request} />` into `ReviewRequestDetail.tsx`.

- [ ] **Step 3: Update `/dashboard/proposals` and `/dashboard/review` pages with tab filters**

Update `/dashboard/proposals/page.tsx` and `/dashboard/review/page.tsx` to fetch status counts and render `ReviewFilterTabs`.

- [ ] **Step 4: Run full test suite and type check**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/components/review/ReviewTimeline.tsx src/components/review/ReviewRequestDetail.tsx src/app/dashboard/proposals/page.tsx src/app/dashboard/review/page.tsx
git commit -m "feat(ui): integrate ReviewTimeline and ReviewFilterTabs into dashboard views"
```
