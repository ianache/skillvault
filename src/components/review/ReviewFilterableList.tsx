"use client";

import { useState } from "react";
import type { ReviewRequestSummary, ReviewStatus, ReviewStatusCounts } from "@/lib/review/types";
import { ReviewFilterTabs } from "./ReviewFilterTabs";
import { ReviewRequestList } from "./ReviewRequestList";

type Props = {
  initialRequests: ReviewRequestSummary[];
  counts: ReviewStatusCounts;
  mode: "author" | "reviewer";
  defaultTab?: ReviewStatus | "all";
};

export function ReviewFilterableList({ initialRequests, counts, mode, defaultTab = "all" }: Props) {
  const [activeTab, setActiveTab] = useState<ReviewStatus | "all">(defaultTab);

  const filteredRequests = activeTab === "all"
    ? initialRequests
    : initialRequests.filter((r) => r.status === activeTab);

  return (
    <div>
      <ReviewFilterTabs
        activeTab={activeTab}
        counts={counts}
        onChangeTab={setActiveTab}
      />
      <ReviewRequestList requests={filteredRequests} mode={mode} />
    </div>
  );
}
