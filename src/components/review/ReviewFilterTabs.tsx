"use client";

import type { ReviewStatus, ReviewStatusCounts } from "@/lib/review/types";

type Props = {
  activeTab: ReviewStatus | "all";
  counts?: ReviewStatusCounts;
  onChangeTab: (tab: ReviewStatus | "all") => void;
};

const TABS: { id: ReviewStatus | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "changes_requested", label: "Cambios solicitados" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

export function ReviewFilterTabs({ activeTab, counts, onChangeTab }: Props) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts ? counts[tab.id] : undefined;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              borderColor: isActive ? "var(--accent)" : "var(--border)",
              background: isActive ? "var(--accent)" : "var(--surface)",
              color: isActive ? "#fff" : "var(--text)",
              transition: "all .15s ease",
            }}
          >
            {tab.label}
            {typeof count === "number" && (
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "11px",
                  opacity: isActive ? 0.9 : 0.65,
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(255,255,255,0.25)" : "var(--raised)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
