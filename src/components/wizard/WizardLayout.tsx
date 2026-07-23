"use client";

interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Metadatos" },
  { number: 2, label: "Editor" },
  { number: 3, label: "Requisitos" },
  { number: 4, label: "Revisión" },
];

interface Props {
  currentStep: number;
  children: React.ReactNode;
}

export function WizardLayout({ currentStep, children }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "16px 32px",
          gap: "22px",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "28px",
              height: "28px",
              background: "linear-gradient(155deg, var(--accent), var(--accent-dim))",
              borderRadius: "7px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.6L20 7v10l-8 4.4L4 17V7l8-4.4z" fill="var(--text)" />
              <path d="M8 9.6v4.8l4 2.2 4-2.2V9.6L12 7.4 8 9.6z" fill="var(--accent)" />
            </svg>
          </span>
          <span
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--text)",
            }}
          >
            SkillVault
          </span>
        </a>

        <span
          style={{
            color: "var(--faint)",
            fontSize: "14px",
          }}
        >
          /
        </span>

        <span
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "14px",
            color: "var(--muted)",
          }}
        >
          Publicar Skill
        </span>

        {/* Step indicator */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {STEPS.map((step, i) => {
            const isDone = step.number < currentStep;
            const isActive = step.number === currentStep;
            return (
              <div key={step.number} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontWeight: 700,
                      border: `1px solid ${
                        isDone
                          ? "var(--green)"
                          : isActive
                          ? "var(--accent)"
                          : "var(--border)"
                      }`,
                      background: isDone
                        ? "rgba(46,204,138,0.12)"
                        : isActive
                        ? "var(--accent-muted)"
                        : "none",
                      color: isDone
                        ? "var(--green)"
                        : isActive
                        ? "var(--accent)"
                        : "var(--faint)",
                    }}
                  >
                    {isDone ? "✓" : step.number}
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: isActive ? "var(--text)" : "var(--muted)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: "24px",
                      height: "1px",
                      background: isDone ? "var(--green)" : "var(--border)",
                      margin: "0 4px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "44px 32px 80px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
