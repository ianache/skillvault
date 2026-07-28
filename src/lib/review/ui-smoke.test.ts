import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { describe } from "node:test";
import { AppShell } from "@/components/shell/AppShell";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppTopBar } from "@/components/shell/AppTopBar";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";

const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
  toContain: (expected: string) => {
    if (typeof actual === "string") {
      assert.ok(actual.includes(expected), `Expected source to contain "${expected}"`);
    } else {
      throw new Error("actual must be a string");
    }
  }
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

test("LocalSkillLoader and PublishPage render skill loader layout", async () => {
  const [loaderSource, pageSource] = await Promise.all([
    source("../../components/wizard/LocalSkillLoader.tsx"),
    source("../../app/publish/page.tsx"),
  ]);

  assert.match(loaderSource, /Cargar skill local/);
  assert.match(loaderSource, /Estructura esperada/);
  assert.match(loaderSource, /Seleccionar carpeta/);
  assert.match(loaderSource, /Subir archivo \.zip/);
  assert.match(loaderSource, /Cargar en el wizard/);
  assert.match(pageSource, /<PageHeader\s+title="Publicar skill"/);
  assert.doesNotMatch(pageSource, /Cargar Skill local/);
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
  const publishPayload = pageSource.match(/body:\s*JSON\.stringify\(\s*\{([\s\S]*?)\}\s*\)/)?.[1] ?? "";
  assert.match(publishPayload, /rawContent:\s*content/);
  assert.match(publishPayload, /files:\s*attachedFiles/);
  assert.match(publishPayload, /acceptedResponsibility/);
  assert.match(pageSource, /onAcceptanceChange=\{setAcceptedResponsibility\}/);
  assert.match(pageSource, /acceptedResponsibility=\{acceptedResponsibility\}/);

  assert.match(reviewSource, /acceptedResponsibility:\s*boolean/);
  assert.match(reviewSource, /disabled=\{publishing\s*\|\|\s*!acceptedResponsibility\}/);
  assert.match(reviewSource, /cursor:\s*publishing\s*\|\|\s*!acceptedResponsibility\s*\?\s*"not-allowed"\s*:\s*"pointer"/);
});

test("SkillCard renders a zip download button that stops click propagation", async () => {
  const cardSource = await source("../../components/SkillCard.tsx");
  assert.match(cardSource, /href=\{\`\/api\/skills\/\$\{skill\.slug\}\/download\`\}/);
  assert.match(cardSource, /e\.stopPropagation\(\)/);
  assert.match(cardSource, /fetch\(\`\/api\/skills\/\$\{skill\.slug\}\/install\`/);
});

test("DetailPanel renders a manual zip download button with visual state updates", async () => {
  const detailSource = await source("../../components/DetailPanel.tsx");
  assert.match(detailSource, /¿Prefieres instalarlo manualmente\?/);
  assert.match(detailSource, /handleDownload/);
  assert.match(detailSource, /setLiveCount\(data\.installCount\)/);
});

test("SkillCard handles inline category edit on hover and click for authorized roles", async () => {
  const cardSource = await source("../../components/SkillCard.tsx");
  expect(cardSource).toContain("isEditingCategory");
  expect(cardSource).toContain("pencil-icon");
  expect(cardSource).toContain("stopPropagation");
});

test("DashboardClient renders a zip download action in rows with click propagation stopped", async () => {
  const dashboardSource = await source("../../components/dashboard/DashboardClient.tsx");
  assert.match(dashboardSource, /href=\{\`\/api\/skills\/\$\{skill\.slug\}\/download\`\}/);
  assert.match(dashboardSource, /download/);
  assert.match(dashboardSource, /e\.stopPropagation\(\)/);
  assert.match(dashboardSource, /fetch\(\`\/api\/skills\/\$\{skill\.slug\}\/install\`/);
});

test("UserMenu renders a sign-in Link with callbackUrl support when user is not logged in", async () => {
  const menuSource = await source("../../components/UserMenu.tsx");
  assert.match(menuSource, /usePathname\(\)/);
  assert.match(menuSource, /useSearchParams\(\)/);
  assert.match(menuSource, /Link/);
  assert.match(menuSource, /href=\{\`\/signin\?callbackUrl=\$\{encodeURIComponent\(currentUrl\)\}\`\}/);
});

test("navigation groups are divided into exactly two blocks and use SVG paths", async () => {
  const navSource = await source("../../components/shell/navigation.ts");
  assert.ok(navSource.includes("title: \"Exploración y Contenido\""), "Debe tener el bloque principal de contenido");
  assert.ok(navSource.includes("title: \"Gestión y Administración\""), "Debe tener el bloque de administración");
  assert.ok(navSource.includes("iconPath:"), "Debe exportar iconPath en lugar de icon de emoji");
});

test("AppSidebar renders SVG icons with paths and sutil horizontal divider", async () => {
  const sidebarSource = await source("../../components/shell/AppSidebar.tsx");
  assert.match(sidebarSource, /<svg/);
  assert.match(sidebarSource, /<path/);
  assert.match(sidebarSource, /borderTop:\s*"1px solid var\(--sv-sidebar-border\)"/);
});

test("UserMenu contains stateful dropdown, custom role badges, and click-outside capability", async () => {
  const menuSource = await source("../../components/UserMenu.tsx");
  assert.match(menuSource, /const\s*\[isOpen,\s*setIsOpen\]\s*=\s*useState/);
  assert.match(menuSource, /useRef/);
  assert.match(menuSource, /useEffect/);
  assert.match(menuSource, /roleBadgeMap/);
  assert.match(menuSource, /Administrador/);
  assert.match(menuSource, /Revisor/);
});

test("CLI Download links render clean inline SVGs for Windows, macOS, and Linux", async () => {
  const pageSource = await source("../../app/page.tsx");
  assert.match(pageSource, /svg[^>]+viewBox="0 0 88 88"[^>]*className="windows-svg"/);
  assert.match(pageSource, /svg[^>]+viewBox="0 0 170 170"[^>]*className="apple-svg"/);
  assert.match(pageSource, /svg[^>]+viewBox="0 0 342 342"[^>]*className="linux-svg"/);
});



