export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ height: "56px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }} />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Page title */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <div style={{ ...sk, width: "120px", height: "28px", marginBottom: "8px" }} />
            <div style={{ ...sk, width: "260px", height: "13px" }} />
          </div>
          <div style={{ ...sk, width: "120px", height: "36px", borderRadius: "4px" }} />
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "16px", borderTop: "3px solid var(--border)" }}>
              <div style={{ ...sk, width: "80px", height: "10px", marginBottom: "12px" }} />
              <div style={{ ...sk, width: "60px", height: "28px" }} />
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: "38px", background: "var(--raised)", borderBottom: "1px solid var(--border)" }} />
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ flex: 2 }}>
                <div style={{ ...sk, width: "140px", height: "13px", marginBottom: "6px" }} />
                <div style={{ ...sk, width: "260px", height: "11px" }} />
              </div>
              <div style={{ ...sk, width: "55px", height: "20px", borderRadius: "3px" }} />
              <div style={{ ...sk, width: "50px", height: "12px" }} />
              <div style={{ ...sk, width: "40px", height: "13px" }} />
              <div style={{ ...sk, width: "70px", height: "11px" }} />
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ ...sk, width: "28px", height: "24px", borderRadius: "3px" }} />
                <div style={{ ...sk, width: "28px", height: "24px", borderRadius: "3px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sk: React.CSSProperties = {
  background: "var(--raised)",
  borderRadius: "3px",
  animation: "pulse 1.4s ease-in-out infinite",
};
