import type { ReviewActor, ReviewStatus } from "./types";

export function hasRole(actor: ReviewActor, role: string): boolean {
  return actor.roles.includes(role);
}

export function canReview(actor: ReviewActor): boolean {
  return hasRole(actor, "reviewer") || hasRole(actor, "admin");
}

export function assertCanEditRequest(
  actor: ReviewActor,
  request: { authorId: string; status: ReviewStatus }
) {
  if (request.status !== "pending" && request.status !== "changes_requested") {
    throw new Error("Request is not editable");
  }
  if (!hasRole(actor, "admin") && request.authorId !== actor.id) {
    throw new Error("Only the author can edit this request");
  }
}
