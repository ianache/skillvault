# Catalog ZIP Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable direct downloading of skills as ZIP files from the catalog (`/`) card lists and detail panel while incrementing the installation counter.

**Architecture:** Use a standard HTML hyperlink `<a href="/api/skills/[slug]/download" download>` to trigger browser-native ZIP downloads, with an asynchronous `onClick` fetch hook that records the download as an install by sending a `POST` request to `/api/skills/[slug]/install`. Event propagation is stopped on the card button to prevent selecting/opening the panel.

**Tech Stack:** Next.js (React), TypeScript, CSS Inline.

## Global Constraints

- Preserve all existing file formatting and design patterns verbatim.
- Ensure all event handlers on elements with clickable parent containers use `e.stopPropagation()` to avoid event bubbling.
- For all custom styled components, use CSS inline styles conforming to SkillVault's design system tokens (e.g. `var(--border)`, `var(--muted)`, `var(--accent)`, `var(--raised)`).

---

### Task 1: Add ZIP Download Button to SkillCard

**Files:**
- Modify: `src/components/SkillCard.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `GET /api/skills/[slug]/download`, `POST /api/skills/[slug]/install`
- Produces: Inline zip download link element next to the version on each skill card.

- [ ] **Step 1: Write the failing test**

  Modify `src/lib/review/ui-smoke.test.ts` to add a static assertion verifying that the `SkillCard.tsx` component source contains the stopPropagation click handler and the direct download API route reference.

  Edit `src/lib/review/ui-smoke.test.ts` to append the following test case:
  ```typescript
  test("SkillCard renders a zip download button that stops click propagation", async () => {
    const cardSource = await source("../../components/SkillCard.tsx");
    assert.match(cardSource, /href=\{\`\/api\/skills\/\$\{skill\.slug\}\/download\`\}/);
    assert.match(cardSource, /e\.stopPropagation\(\)/);
    assert.match(cardSource, /fetch\(\`\/api\/skills\/\$\{skill\.slug\}\/install\`/);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts`
  Expected: FAIL with "AssertionError: Expected ... to match ..." (referencing `SkillCard.tsx` checks)

- [ ] **Step 3: Write minimal implementation**

  Modify `src/components/SkillCard.tsx` to group the version and the zip download button in a layout container, implementing the stop propagation handler and the `POST` install registration.

  Replace the block:
  ```typescript
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            color: "var(--muted)",
            whiteSpace: "nowrap",
            marginTop: "2px",
            flexShrink: 0,
          }}
        >
          v{skill.version}
        </span>
  ```

  With:
  ```typescript
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              color: "var(--muted)",
              whiteSpace: "nowrap",
              marginTop: "2px",
            }}
          >
            v{skill.version}
          </span>
          <a
            href={`/api/skills/${skill.slug}/download`}
            download
            onClick={(e) => {
              e.stopPropagation();
              fetch(`/api/skills/${skill.slug}/install`, { method: "POST" }).catch(() => {});
            }}
            title="Descargar ZIP"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "3px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              background: "var(--surface)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              transition: "all .12s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
              const arrow = e.currentTarget.querySelector(".arrow");
              if (arrow) (arrow as HTMLElement).style.transform = "translateY(1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
              const arrow = e.currentTarget.querySelector(".arrow");
              if (arrow) (arrow as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <span className="arrow" style={{ transition: "transform .1s", marginRight: "2px", display: "inline-block" }}>⬇</span> ZIP
          </a>
        </div>
  ```

- [ ] **Step 4: Run test to verify it passes**

  Run: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/SkillCard.tsx src/lib/review/ui-smoke.test.ts
  git commit -m "feat: add zip download button to SkillCard with click propagation prevention"
  ```

---

### Task 2: Add ZIP Download Section to DetailPanel

**Files:**
- Modify: `src/components/DetailPanel.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `GET /api/skills/[slug]/download`, `POST /api/skills/[slug]/install`
- Produces: Live count visual updates via `liveCount` and an elegant ZIP download button under the CLI block inside the "Instalar" Section.

- [ ] **Step 1: Write the failing test**

  Modify `src/lib/review/ui-smoke.test.ts` to add a static assertion verifying that the `DetailPanel.tsx` component source contains the divider, the zip download label, and the fetch-based record/state updates.

  Edit `src/lib/review/ui-smoke.test.ts` to append the following test case:
  ```typescript
  test("DetailPanel renders a manual zip download button with visual state updates", async () => {
    const detailSource = await source("../../components/DetailPanel.tsx");
    assert.match(detailSource, /¿Prefieres instalarlo manualmente\?/);
    assert.match(detailSource, /handleDownload/);
    assert.match(detailSource, /setLiveCount\(data\.installCount\)/);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts`
  Expected: FAIL with "AssertionError: Expected ... to match ..." (referencing `DetailPanel.tsx` checks)

- [ ] **Step 3: Write minimal implementation**

  Modify `src/components/DetailPanel.tsx` to implement `handleDownload` state updating function and the manual download ZIP section.

  Find inside `src/components/DetailPanel.tsx` the `copyCmd` function:
  ```typescript
    async function copyCmd() {
      await navigator.clipboard.writeText(cmd).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      // Increment counter in background
      fetch(`/api/skills/${selectedSkill.slug}/install`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => { if (d.installCount) setLiveCount(d.installCount); })
        .catch(() => {});
    }
  ```

  And add below it:
  ```typescript
    async function handleDownload() {
      fetch(`/api/skills/${selectedSkill.slug}/install`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => { if (d.installCount) setLiveCount(d.installCount); })
        .catch(() => {});
    }
  ```

  Then, find the command block inside the "Instalar" section:
  ```typescript
            {/* Command */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--text)", flex: 1, wordBreak: "break-all" }}>
                {cmd}
              </code>
              <button
                onClick={copyCmd}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`,
                  background: "none",
                  color: copied ? "var(--green)" : "var(--muted)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all .12s",
                }}
              >
                {copied ? "✓" : "Copiar"}
              </button>
            </div>
  ```

  And replace the following trailing block:
  ```typescript
            </div>
          </div>
        </Section>
  ```

  With:
  ```typescript
            </div>

            {/* Alternativa de Descarga ZIP */}
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                ¿Prefieres instalarlo manualmente?
              </span>
              <a
                href={`/api/skills/${skill.slug}/download`}
                download
                onClick={handleDownload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "var(--accent-muted)",
                  border: "1px solid var(--accent)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all .12s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.color = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent-muted)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
              >
                ⬇ Descargar ZIP
              </a>
            </div>
          </div>
        </Section>
  ```

- [ ] **Step 4: Run test to verify it passes**

  Run: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/DetailPanel.tsx src/lib/review/ui-smoke.test.ts
  git commit -m "feat: add manual zip download option to DetailPanel with live installation counter updates"
  ```
