export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        background: "var(--surface)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: description ? "2px" : 0,
          }}
        >
          {title}
        </h1>
        {description && (
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>{description}</div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
