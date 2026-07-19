import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";

test("unauthenticated create returns 401", async () => {
  const { POST } = createReviewRequestsHandlers({ getSession: async () => null as never });
  const response = await POST(
    new NextRequest("http://test/api/review-requests", { method: "POST" })
  );

  assert.equal(response.status, 401);
});
