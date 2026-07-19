import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";
import { createReviewDecisionHandlers } from "../../app/api/review-requests/[id]/decision/route";
import type { ReviewDatabaseClient, ReviewRequest } from "./types";

const reviewerSession = {
  user: {
    id: "reviewer-1",
    name: "Reviewer",
    email: "reviewer@example.test",
    roles: ["reviewer"],
  },
};

const database: ReviewDatabaseClient = {
  async execute() {
    return { rows: [] };
  },
};

const context = { params: Promise.resolve({ id: "1" }) };

test("unauthenticated create returns 401", async () => {
  const { POST } = createReviewRequestsHandlers({ getSession: async () => null as never });
  const response = await POST(
    new NextRequest("http://test/api/review-requests", { method: "POST" })
  );

  assert.equal(response.status, 401);
});

test("invalid decision returns 422 without mutating review state", async () => {
  let called = false;
  const { POST } = createReviewDecisionHandlers({
    getSession: async () => reviewerSession as never,
    database,
    decide: async () => {
      called = true;
      return {} as ReviewRequest;
    },
  });

  const response = await POST(
    new NextRequest("http://test/api/review-requests/1/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "anything" }),
    }),
    context
  );

  assert.equal(response.status, 422);
  assert.equal(called, false);
});

test("request changes decision requires a general comment", async () => {
  let called = false;
  const { POST } = createReviewDecisionHandlers({
    getSession: async () => reviewerSession as never,
    database,
    decide: async () => {
      called = true;
      return {} as ReviewRequest;
    },
  });

  const response = await POST(
    new NextRequest("http://test/api/review-requests/1/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "request_changes" }),
    }),
    context
  );

  assert.equal(response.status, 422);
  assert.equal(called, false);
});
