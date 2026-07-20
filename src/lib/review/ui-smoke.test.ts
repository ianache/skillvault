import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("review dashboard routes export page components", async () => {
  const [queue, detail] = await Promise.all([
    import("@/app/dashboard/review/page"),
    import("@/app/dashboard/review/[id]/page"),
  ]);

  assert.equal(typeof queue.default, "function");
  assert.equal(typeof detail.default, "function");
});

test("proposal dashboard routes export page components", async () => {
  const [list, detail] = await Promise.all([
    import("@/app/dashboard/proposals/page"),
    import("@/app/dashboard/proposals/[id]/page"),
  ]);

  assert.equal(typeof list.default, "function");
  assert.equal(typeof detail.default, "function");
});

test("review detail preserves files when an author resubmits and shows decision feedback", async () => {
  const detail = await source("../../components/review/ReviewRequestDetail.tsx");

  assert.match(detail, /initialRequest\.files\.map/);
  assert.match(detail, /files:\s*current\.files/);
  assert.match(detail, /comments:\s*current\.comments/);
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
    source("../../app/dashboard/review/page.tsx"),
    source("../../app/dashboard/review/[id]/page.tsx"),
    source("../../app/dashboard/proposals/page.tsx"),
    source("../../app/dashboard/proposals/[id]/page.tsx"),
    source("../../app/dashboard/review-api.ts"),
  ]);

  for (const page of [queue, reviewDetail, proposals, proposalDetail]) {
    assert.doesNotMatch(page, /@\/lib\/db|@\/lib\/review\/service/);
  }
  assert.match(proposals, /fetchReviewRequests\("\?mine=1"\)/);
  assert.match(queue, /fetchReviewRequests\("\?status=pending"\)/);
  assert.match(reviewDetail, /fetchReviewRequest\(id\)/);
  assert.match(proposalDetail, /fetchReviewRequest\(id\)/);
  assert.match(helper, /\/api\/review-requests/);
  assert.match(helper, /cookie/);
});
