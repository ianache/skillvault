export type ReviewStatus = "pending" | "changes_requested" | "approved" | "rejected";

export type ReviewStatusCounts = {
  all: number;
  pending: number;
  changes_requested: number;
  approved: number;
  rejected: number;
};
export type ReviewDecision = "approve" | "reject" | "request_changes";
export type ReviewFileType = "resource" | "script";
export type ReviewFileChangeType = "added" | "modified" | "deleted" | "unchanged";

export type ReviewActor = {
  id: string;
  handle?: string | null;
  roles: string[];
};

export type ReviewFileInput = {
  path: string;
  fileType: ReviewFileType;
  content?: string;
  changeType?: ReviewFileChangeType;
};

export type CreateReviewRequestInput = {
  rawContent: string;
  files?: ReviewFileInput[];
  skillId?: number | null;
};

export type UpdateReviewRequestInput = {
  rawContent: string;
  files?: ReviewFileInput[];
};

export type ListReviewRequestsQuery = {
  mine?: boolean;
  status?: ReviewStatus | "all";
};

export type ListReviewRequestsResponse = {
  requests: ReviewRequestSummary[];
  counts: ReviewStatusCounts;
};

export type AddReviewCommentInput = {
  body: string;
  filePath?: string | null;
};

export type DecideReviewRequestInput = {
  decision: ReviewDecision;
  comment?: string | null;
};

export type ReviewRequest = {
  id: number;
  skillId: number | null;
  slug: string;
  name: string;
  description: string;
  type: string;
  version: string;
  schemaVersion: string;
  authorId: string;
  authorHandle: string | null;
  rawContent: string;
  status: ReviewStatus;
  reviewerId: string | null;
  reviewerHandle: string | null;
  generalComment: string | null;
  submittedAt: number;
  reviewedAt: number | null;
  updatedAt: number;
};

export type ReviewFile = {
  id: number;
  reviewRequestId: number;
  path: string;
  fileType: ReviewFileType;
  content: string;
  changeType: ReviewFileChangeType;
  createdAt: number;
};

export type ReviewComment = {
  id: number;
  reviewRequestId: number;
  filePath: string | null;
  authorId: string;
  authorHandle: string | null;
  body: string;
  createdAt: number;
};

export type ReviewRequestSummary = Omit<ReviewRequest, "rawContent">;

export type ReviewRequestDetailDto = ReviewRequest & {
  files: ReviewFile[];
  comments: ReviewComment[];
};

export type ReviewDatabaseClient = {
  execute: (input: string | { sql: string; args?: unknown[] }) => Promise<{
    rows: Record<string, unknown>[];
  }>;
  transaction?: <T>(fn: (txClient: ReviewDatabaseClient) => Promise<T>) => Promise<T>;
};
