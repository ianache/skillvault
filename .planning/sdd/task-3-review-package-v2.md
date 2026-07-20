# Task 3 Review Package v2

## Commits
db5249a fix: validate review decisions
662f141 feat: expose review request api

## Stat
 src/app/api/review-requests/[id]/comments/route.ts | 23 +++++++
 src/app/api/review-requests/[id]/decision/route.ts | 53 +++++++++++++++
 src/app/api/review-requests/[id]/route.ts          | 44 ++++++++++++
 src/app/api/review-requests/route-utils.ts         | 46 +++++++++++++
 src/app/api/review-requests/route.ts               | 55 +++++++++++++++
 src/auth.ts                                        |  3 +
 src/lib/review/api-contract.test.ts                | 78 ++++++++++++++++++++++
 src/lib/review/service.test.ts                     |  7 ++
 src/lib/review/service.ts                          |  7 ++
 src/types/next-auth.d.ts                           |  7 +-
 10 files changed, 319 insertions(+), 4 deletions(-)

## Diff
diff --git a/src/app/api/review-requests/[id]/comments/route.ts b/src/app/api/review-requests/[id]/comments/route.ts
new file mode 100644
index 0000000..7b98965
--- /dev/null
+++ b/src/app/api/review-requests/[id]/comments/route.ts
@@ -0,0 +1,23 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { addReviewComment } from "@/lib/review/service";
+import type { AddReviewCommentInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../../route-utils";
+
+type RouteContext = { params: Promise<{ id: string }> };
+
+export async function POST(request: NextRequest, context: RouteContext) {
+  const session = await auth();
+  const actor = session ? actorFromSession(session) : null;
+  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+  const id = parseRequestId((await context.params).id);
+  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+  try {
+    const input = await requestBody(request) as AddReviewCommentInput;
+    const comment = await addReviewComment(id, input, actor, client);
+    return NextResponse.json({ comment }, { status: 201 });
+  } catch (error) {
+    return errorResponse(error);
+  }
+}
diff --git a/src/app/api/review-requests/[id]/decision/route.ts b/src/app/api/review-requests/[id]/decision/route.ts
new file mode 100644
index 0000000..dc3fe8f
--- /dev/null
+++ b/src/app/api/review-requests/[id]/decision/route.ts
@@ -0,0 +1,53 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { decideReviewRequest } from "@/lib/review/service";
+import type { DecideReviewRequestInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../../route-utils";
+
+type RouteContext = { params: Promise<{ id: string }> };
+type DecisionRouteDeps = {
+  getSession?: typeof auth;
+  database?: typeof client;
+  decide?: typeof decideReviewRequest;
+};
+
+function parseDecisionInput(value: unknown): DecideReviewRequestInput {
+  if (!value || typeof value !== "object") throw new Error("Invalid review decision");
+  const input = value as { decision?: unknown; comment?: unknown };
+  if (input.decision !== "approve" && input.decision !== "reject" && input.decision !== "request_changes") {
+    throw new Error("Invalid review decision");
+  }
+  if (input.comment !== undefined && input.comment !== null && typeof input.comment !== "string") {
+    throw new Error("Invalid review comment");
+  }
+  if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
+    throw new Error("A general comment required for this decision");
+  }
+  return { decision: input.decision, comment: input.comment ?? null };
+}
+
+export function createReviewDecisionHandlers({
+  getSession = auth,
+  database = client,
+  decide = decideReviewRequest,
+}: DecisionRouteDeps = {}) {
+  async function POST(request: NextRequest, context: RouteContext) {
+    const session = await getSession();
+    const actor = session ? actorFromSession(session) : null;
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+    const id = parseRequestId((await context.params).id);
+    if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+    try {
+      const input = parseDecisionInput(await requestBody(request));
+      const reviewRequest = await decide(id, input, actor, database);
+      return NextResponse.json({ request: reviewRequest });
+    } catch (error) {
+      return errorResponse(error);
+    }
+  }
+
+  return { POST };
+}
+
+export const { POST } = createReviewDecisionHandlers();
diff --git a/src/app/api/review-requests/[id]/route.ts b/src/app/api/review-requests/[id]/route.ts
new file mode 100644
index 0000000..6d80a79
--- /dev/null
+++ b/src/app/api/review-requests/[id]/route.ts
@@ -0,0 +1,44 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { getReviewRequest, updateReviewRequest } from "@/lib/review/service";
+import type { UpdateReviewRequestInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../route-utils";
+
+type RouteContext = { params: Promise<{ id: string }> };
+
+async function requireActor() {
+  const session = await auth();
+  return session ? actorFromSession(session) : null;
+}
+
+async function requestId(context: RouteContext) {
+  return parseRequestId((await context.params).id);
+}
+
+export async function GET(_request: NextRequest, context: RouteContext) {
+  const actor = await requireActor();
+  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+  const id = await requestId(context);
+  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+  try {
+    const reviewRequest = await getReviewRequest(id, actor, client);
+    return NextResponse.json({ request: reviewRequest });
+  } catch (error) {
+    return errorResponse(error);
+  }
+}
+
+export async function PATCH(request: NextRequest, context: RouteContext) {
+  const actor = await requireActor();
+  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+  const id = await requestId(context);
+  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+  try {
+    const input = await requestBody(request) as UpdateReviewRequestInput;
+    const reviewRequest = await updateReviewRequest(id, input, actor, client);
+    return NextResponse.json({ request: reviewRequest });
+  } catch (error) {
+    return errorResponse(error);
+  }
+}
diff --git a/src/app/api/review-requests/route-utils.ts b/src/app/api/review-requests/route-utils.ts
new file mode 100644
index 0000000..93aedc7
--- /dev/null
+++ b/src/app/api/review-requests/route-utils.ts
@@ -0,0 +1,46 @@
+import { NextResponse } from "next/server";
+import type { Session } from "next-auth";
+import type { ReviewActor, ReviewStatus } from "@/lib/review/types";
+
+const reviewStatuses: ReviewStatus[] = ["pending", "changes_requested", "approved", "rejected"];
+
+export function actorFromSession(session: Session): ReviewActor | null {
+  const { user } = session;
+  if (!user?.id) return null;
+
+  return { id: user.id, handle: user.name ?? user.email ?? null, roles: user.roles ?? [] };
+}
+
+export function parseRequestId(value: string): number | null {
+  const id = Number(value);
+  return Number.isInteger(id) && id > 0 ? id : null;
+}
+
+export function parseReviewStatus(value: string | null): ReviewStatus | undefined | null {
+  if (value === null) return undefined;
+  return reviewStatuses.includes(value as ReviewStatus) ? (value as ReviewStatus) : null;
+}
+
+export function errorResponse(error: unknown) {
+  const message = error instanceof Error ? error.message : "Unexpected review request error";
+  const normalized = message.toLowerCase();
+  if (normalized.includes("not found")) return NextResponse.json({ error: message }, { status: 404 });
+  if (normalized.includes("not allowed") || normalized.includes("only the author") || normalized.includes("author cannot") || normalized.includes("reviewer role")) {
+    return NextResponse.json({ error: message }, { status: 403 });
+  }
+  if (normalized.includes("already exists") || normalized.includes("not active") || normalized.includes("not editable")) {
+    return NextResponse.json({ error: message }, { status: 409 });
+  }
+  if (normalized.includes("required") || normalized.includes("invalid") || normalized.includes("file path") || normalized.includes("attached file") || normalized.includes("unique") || normalized.includes("frontmatter") || normalized.includes("skill.md")) {
+    return NextResponse.json({ error: message }, { status: 422 });
+  }
+  return NextResponse.json({ error: message }, { status: 500 });
+}
+
+export async function requestBody(request: Request): Promise<unknown> {
+  try {
+    return await request.json();
+  } catch {
+    throw new Error("Invalid JSON body");
+  }
+}
diff --git a/src/app/api/review-requests/route.ts b/src/app/api/review-requests/route.ts
new file mode 100644
index 0000000..f56607b
--- /dev/null
+++ b/src/app/api/review-requests/route.ts
@@ -0,0 +1,55 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { createReviewRequest, listReviewRequests } from "@/lib/review/service";
+import type { CreateReviewRequestInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseReviewStatus, requestBody } from "./route-utils";
+
+type RouteDependencies = {
+  getSession: typeof auth;
+  database: typeof client;
+  create: typeof createReviewRequest;
+  list: typeof listReviewRequests;
+};
+
+export function createReviewRequestsHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const getSession = dependencies.getSession ?? auth;
+  const database = dependencies.database ?? client;
+  const create = dependencies.create ?? createReviewRequest;
+  const list = dependencies.list ?? listReviewRequests;
+
+  async function requireActor() {
+    const session = await getSession();
+    return session ? actorFromSession(session) : null;
+  }
+
+  async function GET(request: NextRequest) {
+    const actor = await requireActor();
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+    const status = parseReviewStatus(request.nextUrl.searchParams.get("status"));
+    if (status === null) return NextResponse.json({ error: "Invalid review request status" }, { status: 422 });
+    try {
+      const mine = ["1", "true"].includes(request.nextUrl.searchParams.get("mine") ?? "");
+      const requests = await list({ mine, status }, actor, database);
+      return NextResponse.json({ requests });
+    } catch (error) {
+      return errorResponse(error);
+    }
+  }
+
+  async function POST(request: NextRequest) {
+    const actor = await requireActor();
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+    try {
+      const input = await requestBody(request) as CreateReviewRequestInput;
+      const reviewRequest = await create(input, actor, database);
+      return NextResponse.json({ request: reviewRequest }, { status: 201 });
+    } catch (error) {
+      return errorResponse(error);
+    }
+  }
+
+  return { GET, POST };
+}
+
+export const { GET, POST } = createReviewRequestsHandlers();
diff --git a/src/auth.ts b/src/auth.ts
index 45a336a..b499a3a 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -16,15 +16,18 @@ export const { handlers, auth, signIn, signOut } = NextAuth({
     jwt({ token, account, profile }) {
       if (account && profile) {
         // Extract client roles from the Keycloak token claim "roles"
         const p = profile as Record<string, unknown>;
         const roles = Array.isArray(p.roles) ? (p.roles as string[]) : [];
         token.roles = roles;
       }
       return token;
     },
     session({ session, token }) {
+      session.user.id = token.sub ?? "";
+      session.user.name = token.name ?? session.user.name;
+      session.user.email = token.email ?? session.user.email;
       session.user.roles = (token.roles as string[]) ?? [];
       return session;
     },
   },
 });
diff --git a/src/lib/review/api-contract.test.ts b/src/lib/review/api-contract.test.ts
new file mode 100644
index 0000000..35845a6
--- /dev/null
+++ b/src/lib/review/api-contract.test.ts
@@ -0,0 +1,78 @@
+import assert from "node:assert/strict";
+import test from "node:test";
+import { NextRequest } from "next/server";
+import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";
+import { createReviewDecisionHandlers } from "../../app/api/review-requests/[id]/decision/route";
+import type { ReviewDatabaseClient, ReviewRequest } from "./types";
+
+const reviewerSession = {
+  user: {
+    id: "reviewer-1",
+    name: "Reviewer",
+    email: "reviewer@example.test",
+    roles: ["reviewer"],
+  },
+};
+
+const database: ReviewDatabaseClient = {
+  async execute() {
+    return { rows: [] };
+  },
+};
+
+const context = { params: Promise.resolve({ id: "1" }) };
+
+test("unauthenticated create returns 401", async () => {
+  const { POST } = createReviewRequestsHandlers({ getSession: async () => null as never });
+  const response = await POST(
+    new NextRequest("http://test/api/review-requests", { method: "POST" })
+  );
+
+  assert.equal(response.status, 401);
+});
+
+test("invalid decision returns 422 without mutating review state", async () => {
+  let called = false;
+  const { POST } = createReviewDecisionHandlers({
+    getSession: async () => reviewerSession as never,
+    database,
+    decide: async () => {
+      called = true;
+      return {} as ReviewRequest;
+    },
+  });
+
+  const response = await POST(
+    new NextRequest("http://test/api/review-requests/1/decision", {
+      method: "POST",
+      body: JSON.stringify({ decision: "anything" }),
+    }),
+    context
+  );
+
+  assert.equal(response.status, 422);
+  assert.equal(called, false);
+});
+
+test("request changes decision requires a general comment", async () => {
+  let called = false;
+  const { POST } = createReviewDecisionHandlers({
+    getSession: async () => reviewerSession as never,
+    database,
+    decide: async () => {
+      called = true;
+      return {} as ReviewRequest;
+    },
+  });
+
+  const response = await POST(
+    new NextRequest("http://test/api/review-requests/1/decision", {
+      method: "POST",
+      body: JSON.stringify({ decision: "request_changes" }),
+    }),
+    context
+  );
+
+  assert.equal(response.status, 422);
+  assert.equal(called, false);
+});
diff --git a/src/lib/review/service.test.ts b/src/lib/review/service.test.ts
index aba4170..479c053 100644
--- a/src/lib/review/service.test.ts
+++ b/src/lib/review/service.test.ts
@@ -110,20 +110,27 @@ test("author cannot approve own request", async () => {
   );
 });

 test("request_changes requires comment", async () => {
   await assert.rejects(
     () => decideReviewRequest(1, { decision: "request_changes" }, reviewerActor, createFakeClient()),
     /comment required/
   );
 });

+test("invalid review decision is rejected", async () => {
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "anything" as never }, reviewerActor, createFakeClient()),
+    /Invalid review decision/
+  );
+});
+
 test("admin cannot edit another author's request", async () => {
   await assert.rejects(
     () => updateReviewRequest(1, { rawContent: validRawContent, files: [] }, adminActor, createFakeClient()),
     /Only the author can edit this request/
   );
 });

 test("per-file comment rejects a path that is not attached", async () => {
   await assert.rejects(
     () => addReviewComment(1, { body: "Missing attachment", filePath: "resources/missing.md" }, reviewerActor, createFakeClient()),
diff --git a/src/lib/review/service.ts b/src/lib/review/service.ts
index 1d0622e..7b49c6e 100644
--- a/src/lib/review/service.ts
+++ b/src/lib/review/service.ts
@@ -93,20 +93,26 @@ function validateSubmission(rawContent: string, files: ReviewFileInput[] = []) {
   const normalizedFiles = files.map((file) => {
     const path = validateReviewFilePath(file.path);
     if (paths.has(path)) throw new Error("Review file paths must be unique");
     paths.add(path);
     return { ...file, path, content: file.content ?? "", changeType: file.changeType ?? "added" };
   });

   return { frontmatter: frontmatter.parsed!, files: normalizedFiles };
 }

+function assertValidDecision(input: DecideReviewRequestInput): void {
+  if (!["approve", "reject", "request_changes"].includes(input.decision)) {
+    throw new Error("Invalid review decision");
+  }
+}
+
 async function getRequestRow(id: number, client: ReviewDatabaseClient): Promise<ReviewRequest> {
   const result = await client.execute({
     sql: "SELECT * FROM skill_review_requests WHERE id = ?",
     args: [id],
   });
   if (result.rows.length === 0) throw new Error("Review request not found");
   return toRequest(result.rows[0]);
 }

 async function replaceFiles(id: number, files: ReturnType<typeof validateSubmission>["files"], client: ReviewDatabaseClient) {
@@ -263,20 +269,21 @@ export async function addReviewComment(
   if (result.rows.length === 0) throw new Error("Comment was not created");
   return toComment(result.rows[0]);
 }

 export async function decideReviewRequest(
   id: number,
   input: DecideReviewRequestInput,
   actor: ReviewActor,
   client: ReviewDatabaseClient
 ): Promise<ReviewRequest> {
+  assertValidDecision(input);
   const request = await getRequestRow(id, client);
   if (request.authorId === actor.id) throw new Error("Author cannot approve own request");
   if (!canReview(actor)) throw new Error("Reviewer role is required");
   if (request.status !== "pending" && request.status !== "changes_requested") {
     throw new Error("Review request is not active");
   }
   if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
     throw new Error("A general comment required for this decision");
   }

diff --git a/src/types/next-auth.d.ts b/src/types/next-auth.d.ts
index a24d163..1822e84 100644
--- a/src/types/next-auth.d.ts
+++ b/src/types/next-auth.d.ts
@@ -1,18 +1,17 @@
+import type { DefaultSession } from "next-auth";
 import "next-auth";

 declare module "next-auth" {
   interface Session {
-    user: {
-      name?: string | null;
-      email?: string | null;
-      image?: string | null;
+    user: DefaultSession["user"] & {
+      id: string;
       roles: string[];
     };
   }
 }

 declare module "next-auth/jwt" {
   interface JWT {
     roles?: string[];
   }
 }
