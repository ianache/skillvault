import { headers } from "next/headers";
import type { ReviewRequestDetailDto, ReviewRequestSummary } from "@/lib/review/types";

type ApiError = { error?: string };

async function reviewApiFetch<T>(path: string): Promise<T> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("No se pudo determinar el origen de la solicitud.");

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const cookie = requestHeaders.get("cookie");
  const response = await fetch(`${protocol}://${host}/api/review-requests${path}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });
  const data = await response.json() as T & ApiError;
  if (!response.ok) throw new Error(data.error ?? "No se pudo cargar la solicitud de revision.");
  return data;
}

export async function fetchReviewRequests(query: string): Promise<ReviewRequestSummary[]> {
  const data = await reviewApiFetch<{ requests: ReviewRequestSummary[] }>(query);
  return data.requests;
}

export async function fetchReviewRequest(id: number): Promise<ReviewRequestDetailDto> {
  const data = await reviewApiFetch<{ request: ReviewRequestDetailDto }>(`/${id}`);
  return data.request;
}
