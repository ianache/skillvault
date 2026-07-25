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

  test("AppShell renders signin outside the shell chrome", async () => {
    const shellSource = await source("../../components/shell/AppShell.tsx");
    assert.match(shellSource, /usePathname/);
    assert.match(shellSource, /pathname === "\/signin"/);
    assert.match(shellSource, /return <>\{children\}<\/>/);
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

test("LocalSkillLoader and PublishPage render skill loader layout and breadcrumbs", async () => {
  const [loaderSource, pageSource] = await Promise.all([
    source("../../components/wizard/LocalSkillLoader.tsx"),
    source("../../app/publish/page.tsx"),
  ]);

  assert.match(loaderSource, /Cargar skill local/);
  assert.match(loaderSource, /Estructura esperada/);
  assert.match(loaderSource, /Seleccionar carpeta/);
  assert.match(loaderSource, /Subir archivo \.zip/);
  assert.match(loaderSource, /Cargar en el wizard/);
  assert.match(pageSource, /Cargar Skill local/);
});

test("Step2 editor only gates continuation by line count and responsibility acceptance", async () => {
  const editorSource = await source("../../components/wizard/Step2Editor.tsx");

  assert.match(editorSource, /MAX_SKILL_LINES = 300/);
  assert.match(editorSource, /Acepto continuar con la publicacion/);
  assert.match(editorSource, /const canContinue = !lineLimitExceeded && acceptedResponsibility/);
  assert.doesNotMatch(editorSource, /validateSkillFrontmatter|validateBodySections|setValidation/);
});

test("publish wizard forwards responsibility acceptance to final submission", async () => {
  const [editorSource, reviewSource, pageSource] = await Promise.all([
    source("../../components/wizard/Step2Editor.tsx"),
    source("../../components/wizard/Step3Review.tsx"),
    source("../../app/publish/page.tsx"),
  ]);

  assert.match(editorSource, /onAcceptanceChange\?:\s*\(\s*accepted:\s*boolean\s*\)\s*=>\s*void/);
  assert.match(editorSource, /onAcceptanceChange\?\.\(\s*nextAccepted\s*\)/);

  assert.match(pageSource, /const\s+\[\s*acceptedResponsibility\s*,\s*setAcceptedResponsibility\s*\]\s*=\s*useState\(\s*false\s*\)/);
  assert.match(pageSource, /JSON\.stringify\(\s*\{[\s\S]*rawContent:\s*content[\s\S]*files:\s*attachedFiles[\s\S]*acceptedResponsibility[\s\S]*\}\s*\)/);
  assert.match(pageSource, /onAcceptanceChange=\{setAcceptedResponsibility\}/);
  assert.match(pageSource, /acceptedResponsibility=\{acceptedResponsibility\}/);

  assert.match(reviewSource, /acceptedResponsibility:\s*boolean/);
  assert.match(reviewSource, /disabled=\{publishing\s*\|\|\s*!acceptedResponsibility\}/);
  assert.match(reviewSource, /cursor:\s*publishing\s*\|\|\s*!acceptedResponsibility\s*\?\s*"not-allowed"\s*:\s*"pointer"/);
});
