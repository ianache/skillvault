import { z } from "zod";

export const VALID_TYPES = ["code", "docs", "data", "ui", "infra", "ai"] as const;
export const VALID_TOOLS = [
  "Read", "Write", "Edit", "Glob", "Grep", "PowerShell", "Bash",
  "Agent", "Artifact", "WebFetch", "WebSearch", "Skill", "AskUserQuestion",
  "TaskCreate", "TaskUpdate", "TaskGet", "TaskList",
  "mcp__graphiti_kb__ingest", "mcp__graphiti_kb__search",
  "mcp__visualize__show_widget", "mcp__stitch__generate_screen_from_text",
] as const;
export const VALID_HARNESSES = ["claude", "codex", "opencode", "agy", "cursor"] as const;

// Frontmatter schema
export const skillFrontmatterSchema = z.object({
  name: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(64, "Máximo 64 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z
    .string()
    .min(20, "Mínimo 20 caracteres")
    .max(280, "Máximo 280 caracteres"),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Formato SemVer requerido: X.Y.Z")
    .optional()
    .default("1.0.0"),
  schema_version: z.string().optional().default("1.1"),
  author: z.string().optional(),
  metadata: z.object({
    type: z.enum(VALID_TYPES, {
      errorMap: () => ({ message: `Tipo debe ser: ${VALID_TYPES.join(", ")}` }),
    }),
    triggers: z
      .array(z.string().max(60, "Trigger max 60 chars"))
      .min(1, "Al menos 1 trigger requerido"),
    tools: z.array(z.string()).optional().default([]),
    subagent_type: z.string().optional(),
  }),
  compatibility: z
    .array(z.enum([...VALID_HARNESSES, "*"] as [string, ...string[]]))
    .optional()
    .default(["claude"]),
  dependencies: z.array(z.string()).optional().default([]),
  resources: z.array(z.string()).optional().default([]),
  scripts: z.array(z.string()).optional().default([]),
});

export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;

// Validate raw SKILL.md text (after gray-matter parse)
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed?: SkillFrontmatter;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning";
}

export function validateSkillFrontmatter(data: unknown): ValidationResult {
  const result = skillFrontmatterSchema.safeParse(data);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        field: issue.path.join(".") || "root",
        message: issue.message,
        severity: "error",
      });
    }
    return { valid: false, errors, warnings };
  }

  const parsed = result.data;

  // Warnings
  if (parsed.metadata.triggers.length < 3) {
    warnings.push({
      field: "metadata.triggers",
      message: "Se recomiendan al menos 3 triggers para mejor descubrimiento",
      severity: "warning",
    });
  }
  if (!parsed.author) {
    warnings.push({
      field: "author",
      message: "Sin autor: el skill aparecerá como anónimo en el catálogo",
      severity: "warning",
    });
  }
  if (!parsed.metadata.tools || parsed.metadata.tools.length === 0) {
    warnings.push({
      field: "metadata.tools",
      message: "Declarar las herramientas mejora la compatibilidad entre harnesses",
      severity: "warning",
    });
  }

  return { valid: true, errors, warnings, parsed };
}

// Required body sections
export const REQUIRED_SECTIONS = ["## Descripción", "## Cuándo usar", "## Instrucciones"];
export const RECOMMENDED_SECTIONS = ["## Ejemplos de uso"];

export function validateBodySections(body: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const section of REQUIRED_SECTIONS) {
    const key = section.replace("## ", "").toLowerCase();
    // Accept variants: ## Description, ## When to use, etc.
    const variants: Record<string, string[]> = {
      "descripción": ["## descripción", "## description", "## descripcion"],
      "cuándo usar": ["## cuándo usar", "## cuando usar", "## when to use", "## cuándo"],
      "instrucciones": ["## instrucciones", "## instructions", "## instrución"],
    };
    const checks = variants[key] ?? [section.toLowerCase()];
    const bodyLower = body.toLowerCase();
    if (!checks.some((v) => bodyLower.includes(v))) {
      errors.push({
        field: "body",
        message: `Sección requerida ausente: ${section}`,
        severity: "error",
      });
    }
  }

  for (const section of RECOMMENDED_SECTIONS) {
    if (!body.toLowerCase().includes(section.toLowerCase())) {
      warnings.push({
        field: "body",
        message: `Sección recomendada ausente: ${section}`,
        severity: "warning",
      });
    }
  }

  return { errors, warnings };
}

// Default SKILL.md template
export function getSkillTemplate(name = "mi-skill", type = "code"): string {
  return `---
name: ${name}
description: Describe aquí qué hace este skill en una frase clara (20-280 chars).
version: 1.0.0
schema_version: "1.1"
author: "@tu-handle"

metadata:
  type: ${type}
  triggers:
    - /${name}
    - descripción del trigger en lenguaje natural
  tools:
    - Read
    - Write

compatibility:
  - claude

dependencies: []
---

# ${name}

## Descripción

Explica qué hace este skill, para qué existe y cuál problema resuelve.
Usa 2-4 párrafos en prosa libre.

## Cuándo usar

Invoca este skill cuando:
- El usuario escribe \`/${name}\` o variantes
- Se menciona "..."

**No usar** para: casos donde no aplica.

## Instrucciones

### 1. Primer paso

Describe la primera acción que el modelo debe realizar.

### 2. Segundo paso

Continúa con el flujo de ejecución.

## Ejemplos de uso

\`\`\`
// Uso básico
Skill({ skill: "${name}" })

// Con argumentos
Skill({ skill: "${name}", args: "--flag valor" })
\`\`\`
`;
}
