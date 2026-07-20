import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { ReviewActor, ReviewStatus } from "@/lib/review/types";

const reviewStatuses: ReviewStatus[] = ["pending", "changes_requested", "approved", "rejected"];

export function actorFromSession(session: Session): ReviewActor | null {
  const { user } = session;
  if (!user?.id) return null;

  return { id: user.id, handle: user.name ?? user.email ?? null, roles: user.roles ?? [] };
}

export function parseRequestId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseReviewStatus(value: string | null): ReviewStatus | undefined | null {
  if (value === null) return undefined;
  return reviewStatuses.includes(value as ReviewStatus) ? (value as ReviewStatus) : null;
}

export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected review request error";
  const normalized = message.toLowerCase();
  if (normalized.includes("not found")) return NextResponse.json({ error: message }, { status: 404 });
  if (normalized.includes("not allowed") || normalized.includes("only the author") || normalized.includes("author cannot") || normalized.includes("reviewer role")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (normalized.includes("already exists") || normalized.includes("not active") || normalized.includes("not editable")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (normalized.includes("required") || normalized.includes("invalid") || normalized.includes("file path") || normalized.includes("attached file") || normalized.includes("unique") || normalized.includes("frontmatter") || normalized.includes("skill.md")) {
    return NextResponse.json({ error: message }, { status: 422 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}
