"use client";

import { useState, useEffect } from "react";
import { VALID_HARNESSES } from "./wizard-types";
import { Category } from "@/lib/types";

export interface MetadataFields {
  name: string;
  description: string;
  type: string;
  version: string;
  author: string;
  compatibility: string[];
  primaryTrigger: string;
  extraTriggers: string;
}

interface Props {
  data: MetadataFields;
  onChange: (data: MetadataFields) => void;
  onNext: () => void;
}

export function Step1Metadata({ data, onChange, onNext }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);

  function set<K extends keyof MetadataFields>(key: K, value: MetadataFields[K]) {
    onChange({ ...data, [key]: value });
  }

  function toggleHarness(h: string) {
    const next = data.compatibility.includes(h)
      ? data.compatibility.filter((c) => c !== h)
      : [...data.compatibility, h];
    set("compatibility", next);
  }

  const isValid =
    data.name.length >= 3 &&
    /^[a-z0-9-]+$/.test(data.name) &&
    data.description.length >= 20 &&
    data.description.length <= 280 &&
    data.type !== "" &&
    data.primaryTrigger.length > 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          Paso 1 — Metadatos del skill
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Define la identidad del skill. Estos campos alimentan el catálogo y la búsqueda.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Name + Version row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "12px" }}>
          <Field label="Nombre del skill" required hint="kebab-case · 3-64 chars · único en el catálogo">
            <input
              value={data.name}
              onChange={(e) => set("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="mi-skill"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            {data.name && !/^[a-z0-9-]+$/.test(data.name) && (
              <ErrorMsg>Solo minúsculas, números y guiones</ErrorMsg>
            )}
          </Field>
          <Field label="Versión" hint="SemVer">
            <input
              value={data.version}
              onChange={(e) => set("version", e.target.value)}
              placeholder="1.0.0"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>
        </div>

        {/* Description */}
        <Field
          label="Descripción"
          required
          hint={`${data.description.length}/280 chars · texto plano, sin markdown`}
        >
          <textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe qué hace este skill en una frase clara..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          {data.description.length > 0 && data.description.length < 20 && (
            <ErrorMsg>Mínimo 20 caracteres ({20 - data.description.length} faltan)</ErrorMsg>
          )}
          {data.description.length > 280 && (
            <ErrorMsg>Máximo 280 caracteres ({data.description.length - 280} de exceso)</ErrorMsg>
          )}
        </Field>

        {/* Type */}
        <Field label="Categoría" required hint="Determina la franja de color en las cards">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.length === 0 && (
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>Cargando categorías…</span>
            )}
            {categories.map((cat) => {
              const active = data.type === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => set("type", cat.slug)}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    padding: "5px 12px",
                    borderRadius: "3px",
                    border: `1px solid ${active ? cat.color : "var(--border)"}`,
                    background: active ? `${cat.color}18` : "none",
                    color: active ? cat.color : "var(--muted)",
                    cursor: "pointer",
                    transition: "all .1s",
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Triggers */}
        <Field label="Trigger principal" required hint="El texto que invoca el skill (ej: /code-review)">
          <input
            value={data.primaryTrigger}
            onChange={(e) => set("primaryTrigger", e.target.value)}
            placeholder="/mi-skill"
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>

        <Field label="Triggers adicionales" hint="Uno por línea · lenguaje natural o variantes del comando">
          <textarea
            value={data.extraTriggers}
            onChange={(e) => set("extraTriggers", e.target.value)}
            placeholder={"revisar código\nreview diff"}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>

        {/* Author */}
        <Field label="Autor" hint="Tu handle (@nombre) o email">
          <input
            value={data.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="@tu-handle"
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>

        {/* Compatibility */}
        <Field label="Compatibilidad declarada" hint="Harnesses donde ha sido probado">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {VALID_HARNESSES.map((h) => {
              const active = data.compatibility.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleHarness(h)}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "3px",
                    border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
                    background: active ? "rgba(46,204,138,0.1)" : "none",
                    color: active ? "var(--green)" : "var(--muted)",
                    cursor: "pointer",
                    transition: "all .1s",
                  }}
                >
                  {active ? "✓ " : ""}{h}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "8px",
            borderTop: "1px solid var(--border)",
            marginTop: "8px",
          }}
        >
          <button
            onClick={onNext}
            disabled={!isValid}
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              padding: "9px 20px",
              borderRadius: "4px",
              border: "none",
              background: isValid ? "var(--accent)" : "var(--faint)",
              color: isValid ? "#fff" : "var(--muted)",
              cursor: isValid ? "pointer" : "not-allowed",
              transition: "background .12s",
            }}
          >
            Siguiente → Editor
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
        <label
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          {label}
        </label>
        {required && (
          <span style={{ color: "var(--red)", fontSize: "11px" }}>*</span>
        )}
        {hint && (
          <span style={{ fontSize: "11px", color: "var(--faint)", marginLeft: "auto" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", color: "var(--red)", marginTop: "4px" }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text)",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color .12s",
};

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = "var(--accent)";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = "var(--border)";
}
