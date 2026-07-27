import { hasCapability } from "@/lib/auth/access-policy";
import type { ReviewActor } from "./types";

export function canReview(actor: ReviewActor): boolean {
  return hasCapability(actor.roles, "review:manage");
}

export function canManageContent(actor: ReviewActor): boolean {
  return hasCapability(actor.roles, "content:manage");
}

export function canPublish(actor: ReviewActor): boolean {
  return hasCapability(actor.roles, "publish:create");
}

export function assertCanCreateReviewRequest(
  actor: ReviewActor,
  input: { skillId?: number | null },
): void {
  if (input.skillId) {
    if (!canManageContent(actor)) {
      throw new Error("Review workflow is not allowed for this role");
    }
    return;
  }
  if (!canPublish(actor)) {
    throw new Error("Publishing is not allowed for this role");
  }
}

export function assertCanEditRequest(
  actor: ReviewActor,
  request: { authorId: string; status: string },
): void {
  if (!canManageContent(actor)) {
    throw new Error("Review workflow is not allowed for this role");
  }
  if (request.authorId !== actor.id) {
    throw new Error("Only the author can edit this request");
  }
  if (request.status !== "pending" && request.status !== "changes_requested") {
    throw new Error("Review request is not editable");
  }
}
