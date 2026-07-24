import Link from "next/link";

interface Props {
  searchParams: Promise<{ slug?: string; reviewRequestId?: string }>;
}

export default async function PublishSuccessPage({ searchParams }: Props) {
  const { slug, reviewRequestId } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(46,204,138,0.12)",
            border: "2px solid var(--green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "30px",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "12px",
          }}
        >
          Pendiente de revision
        </h1>

        {slug && (
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "14px",
              color: "var(--accent)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "8px 16px",
              display: "inline-block",
              marginBottom: "16px",
            }}
          >
            {slug}
          </div>
        )}

        <p
          style={{
            fontSize: "14px",
            color: "var(--muted)",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          Tu propuesta fue enviada para revision. Estara disponible en el catálogo
          cuando sea aprobada.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {reviewRequestId && (
            <Link
              href={`/proposals/${reviewRequestId}`}
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: "4px",
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Ver propuesta →
            </Link>
          )}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13px",
              padding: "10px 22px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              textDecoration: "none",
              background: "none",
            }}
          >
            Volver al catálogo
          </Link>
          <Link
            href="/publish"
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13px",
              padding: "10px 22px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              textDecoration: "none",
              background: "none",
            }}
          >
            + Publicar otro
          </Link>
        </div>
      </div>
    </div>
  );
}
