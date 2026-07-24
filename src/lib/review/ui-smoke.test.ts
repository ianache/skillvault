import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { describe } from "node:test";
import { AppShell } from "@/components/shell/AppShell";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppTopBar } from "@/components/shell/AppTopBar";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";

const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
});

const source = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

describe("App Shell Components Smoke Test", () => {
  test("exports AppShell, AppSidebar, AppTopBar, and Breadcrumbs functions", () => {
    expect(typeof AppShell).toBe("function");
    expect(typeof AppSidebar).toBe("function");
    expect(typeof AppTopBar).toBe("function");
    expect(typeof Breadcrumbs).toBe("function");
  });

  test("Breadcrumbs component maps dashboard route to Mis Skills and includes Home icon", async () => {
    const breadcrumbsSource = await source("../../components/shell/Breadcrumbs.tsx");
    assert.match(breadcrumbsSource, /dashboard:\s*"Mis Skills"/);
    assert.match(breadcrumbsSource, /🏠/);
    assert.match(breadcrumbsSource, /Inicio/);
  });

  test("AppTopBar component includes Breadcrumbs and mobile menu button", async () => {
    const topBarSource = await source("../../components/shell/AppTopBar.tsx");
    assert.match(topBarSource, /Breadcrumbs/);
    assert.match(topBarSource, /mobile-menu-btn/);
  });
});

test("review dashboard routes export page components", async () => {
  const [queue, detail] = await Promise.all([
    import("@/app/review/page"),
    import("@/app/review/[id]/page"),
  ]);

  assert.equal(typeof queue.default, "function");
  assert.equal(typeof detail.default, "function");
});

test("proposal dashboard routes export page components", async () => {
  const [list, detail] = await Promise.all([
    import("@/app/proposals/page"),
    import("@/app/proposals/[id]/page"),
  ]);

  assert.equal(typeof list.default, "function");
  assert.equal(typeof detail.default, "function");
});

test("review detail replaces attachments from a successful resubmission while preserving comments", async () => {
  const detail = await source("../../components/review/ReviewRequestDetail.tsx");

  assert.match(detail, /initialRequest\.files\.map/);
  assert.match(detail, /const detailResponse = await fetch\(`\/api\/review-requests\/\$\{request\.id\}`\)/);
  assert.match(detail, /setRequest\(detailData\.request\)/);
  assert.match(detail, /generalComment/);
  assert.match(detail, /Comentario general del revisor/);
});

test("author resubmission supports editable attachments and sends their current state", async () => {
  const detail = await source("../../components/review/ReviewRequestDetail.tsx");

  assert.match(detail, /const \[files, setFiles\] = useState/);
  assert.match(detail, /files: files\.map/);
  assert.match(detail, /Agregar adjunto/);
  assert.match(detail, /Eliminar adjunto/);
  assert.match(detail, /setFiles\(\(current\) => current\.filter/);
});

test("review detail supports general and file-specific comments", async () => {
  const [detail, commentForm] = await Promise.all([
    source("../../components/review/ReviewRequestDetail.tsx"),
    source("../../components/review/ReviewCommentForm.tsx"),
  ]);

  assert.match(detail, /filePath="SKILL\.md"/);
  assert.match(detail, /filePath=\{file\.path\}/);
  assert.match(detail, /comment\.filePath/);
  assert.match(commentForm, /filePath\?: string \| null/);
  assert.match(commentForm, /JSON\.stringify\(\{ body: body\.trim\(\), filePath \}\)/);
});

test("dashboard pages fetch review request API endpoints", async () => {
  const [queue, reviewDetail, proposals, proposalDetail, helper] = await Promise.all([
    source("../../app/review/page.tsx"),
    source("../../app/review/[id]/page.tsx"),
    source("../../app/proposals/page.tsx"),
    source("../../app/proposals/[id]/page.tsx"),
    source("../../app/review-api.ts"),
  ]);

  for (const page of [queue, reviewDetail, proposals, proposalDetail]) {
    assert.doesNotMatch(page, /@\/lib\/db|@\/lib\/review\/service/);
  }
  assert.match(proposals, /fetchReviewRequests\("\?mine=1"\)/);
  assert.match(queue, /fetchReviewRequests\(""\)/);
  assert.match(reviewDetail, /fetchReviewRequest\(id\)/);
  assert.match(proposalDetail, /fetchReviewRequest\(id\)/);
  assert.match(helper, /\/api\/review-requests/);
  assert.match(helper, /SKILLVAULT_INTERNAL_URL/);
  assert.match(helper, /127\.0\.0\.1/);
  assert.match(helper, /cookie/);
});

test("exports ReviewStatusBadge, ReviewFilterTabs, and ReviewTimeline components", async () => {
  const [badgeModule, filterModule, timelineModule, listSource, detailSource] = await Promise.all([
    import("@/components/review/ReviewStatusBadge"),
    import("@/components/review/ReviewFilterTabs"),
    import("@/components/review/ReviewTimeline"),
    source("../../components/review/ReviewRequestList.tsx"),
    source("../../components/review/ReviewRequestDetail.tsx"),
  ]);

  assert.equal(typeof badgeModule.ReviewStatusBadge, "function");
  assert.equal(typeof filterModule.ReviewFilterTabs, "function");
  assert.equal(typeof timelineModule.ReviewTimeline, "function");
  assert.match(listSource, /ReviewStatusBadge/);
  assert.match(detailSource, /ReviewTimeline/);
});
