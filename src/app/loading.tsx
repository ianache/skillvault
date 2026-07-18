export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header skeleton */}
      <div style={{ height: "56px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }} />

      {/* Hero strip skeleton */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 24px", background: "var(--surface)" }}>
        <div style={{ ...skeletonStyle, width: "180px", height: "22px", marginBottom: "8px" }} />
        <div style={{ ...skeletonStyle, width: "340px", height: "14px" }} />
      </div>

      {/* Content skeleton */}
      <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {/* Sidebar */}
        <aside style={{ width: "200px", flexShrink: 0, padding: "20px 0", borderRight: "1px solid var(--border)", marginRight: "24px" }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{ ...skeletonStyle, height: "30px", marginBottom: "4px", borderRadius: "4px" }} />
          ))}
        </aside>

        {/* Cards grid */}
        <div style={{ flex: 1, padding: "20px 0" }}>
          <div style={{ ...skeletonStyle, width: "120px", height: "16px", marginBottom: "16px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
            {[...Array(12)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "14px",
        borderTop: "3px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ ...skeletonStyle, width: "110px", height: "14px" }} />
        <div style={{ ...skeletonStyle, width: "40px", height: "14px" }} />
      </div>
      <div style={{ ...skeletonStyle, width: "100%", height: "12px", marginBottom: "6px" }} />
      <div style={{ ...skeletonStyle, width: "75%", height: "12px", marginBottom: "14px" }} />
      <div style={{ ...skeletonStyle, width: "80px", height: "20px", borderRadius: "3px" }} />
    </div>
  );
}

const skeletonStyle: React.CSSProperties = {
  background: "var(--raised)",
  borderRadius: "3px",
  animation: "pulse 1.4s ease-in-out infinite",
};
