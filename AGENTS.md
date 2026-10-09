# AGENTS.md — UX/UI Potenciado por IA (Pack V2)

Instrucciones para agentes de IA (Claude Code, Codex, etc.) que trabajan en este repositorio.

## Contexto

Material del track **UX/UI** del Programa de Formación de Competencias 2026 (COMSATEL · Malla V2).
El repositorio contiene fichas formales, guías de laboratorio y Skills agentic que producen
artefactos de conocimiento UX gobernados en formato **Google OKF v0.2**.

Idioma de trabajo: **español**. Identificadores técnicos (campos OKF, nombres de skills) en inglés.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `01_Fichas_Formales/` | Fichas UX-101 a UX-106 (`.docx`). Fuente canónica de objetivos y alcance de cada curso. |
| `02_Guias_Laboratorio/` | Guías de laboratorio UX-101 a UX-106 (`.docx`). |
| `.claude/skills/` | Ocho Skills con `SKILL.md`, `templates/`, `examples/`, `manifest.yaml` y, cuando hace falta, `references/`. Los validadores y pruebas del diseño↔código viven en `ux-development-handoff/validators` y `tests`. |
| `docs/skills-regeneration/` | Inventario, matriz de impacto, diseño del cambio, esquema, gate `DESIGN_READY_FOR_DEV`, migración y reportes (2026-10-01). |
| `README.md` | Resumen del pack y secuencia canónica. |

## Cadena de trazabilidad

Todo artefacto debe preservar el linaje hacia sus conceptos upstream:

```
US (User Story) → UXR (UX Requirement) → FLW (Flow) → SCR (Screen) → CMP (Component) → AC (Acceptance Criteria)
```

Cadena de diseño (Skills 2.0): `US → UXR → FLW → SCR → Stitch (exploration_design) → Figma (governed_design) → CMP/TKN → HOF → DCP → Código → Test Evidence`.
Un solo proyecto Stitch gobernado (`STP-*`) por iniciativa; el vínculo SCR↔diseño vive en el Design Traceability Map (`DTM-*`); Desarrollo implementa `governed_design`. Gate: `DESIGN_READY_FOR_DEV`.

## Reglas para agentes

### Human-in-the-loop
- Distinguir siempre **hechos, supuestos, preguntas abiertas y decisiones humanas**.
- **Nunca** resolver en silencio información de negocio faltante: registrarla como pregunta abierta.
- Detenerse para revisión humana ante ambigüedad, conflicto o decisión de producto.
- Una UI generada **no** está aprobada solo porque renderiza.

### No inventar
- Investigación de usuarios, reglas de negocio, evidencia de accesibilidad ni aprobaciones.

### Convenciones OKF v0.2
- Los outputs Markdown usan el frontmatter del `concept-template.md` de cada skill.
- Salvo indicación explícita en contrario, todo contenido nuevo o modificado que se genere y almacene en `knowledge-base/` debe cumplir Google OKF v0.2 e incluir su frontmatter estándar.
- `knowledge-base/` debe mantener `index.md` como índice de los artefactos y `changelog.md` como registro cronológico de altas, cambios y retiros. Ambos archivos también deben incluir frontmatter OKF v0.2 y actualizarse junto con cada cambio en la base de conocimiento.
- El índice debe enlazar a artefactos existentes; el changelog debe identificar la fecha y los artefactos afectados, sin registrar como hechos decisiones o verificaciones no confirmadas.
- Conceptos nuevos o modificados inician con `status: draft`.
- `generated.by` = `<skill>/<versión>` (p. ej. `ux-requirements-analyzer/1.0`).
- `generated.at` en ISO 8601 con zona `-05:00`.
- **Nunca** establecer ni fabricar `verified`: solo lo asigna un flujo humano.
- `sources` debe apuntar a artefactos existentes y resolubles.

### Diseño
- Preferir **tokens semánticos** del Design System sobre valores visuales crudos.
- Accesibilidad objetivo: **WCAG 2.2 AA**.
- Los exports de herramientas externas (Figma, Stitch, Claude Design) son **referencias**,
  no el artefacto canónico de conocimiento.

### Archivos
- No modificar los `.docx` de `01_Fichas_Formales/` ni `02_Guias_Laboratorio/` salvo pedido explícito.
- Al crear o editar una skill, mantener la estructura: `SKILL.md` con frontmatter (`name`, `description`) y secciones Purpose, Course, Input/Output contract,
  Preconditions, Invariants, Workflow, Quality gates, Failure / blocking behavior, Downstream consumers, Must NOT, Definition of Done
  + `templates/` + `examples/` + `manifest.yaml` (versión). Contratos extensos van en `references/`.

## Definition of Done (general)

Un output está listo cuando:
1. Es trazable a sus fuentes.
2. No oculta preguntas abiertas críticas.
3. Es reproducible desde el contexto registrado.
4. La verificación humana queda pendiente (salvo que la aporte un flujo humano).
5. Puede incorporarse al bundle OKF UX/UI sin perder procedencia.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- **REGLA OBLIGATORIA — ubicación única:** `graphify-out/` vive SIEMPRE en la raíz del workspace (`./graphify-out/`). Está prohibido crear o actualizar `knowledge-base/graphify-out/` o cualquier `graphify-out/` dentro de subcarpetas. Ejecuta `graphify update .` (y cualquier otro comando graphify) únicamente desde la raíz del workspace; si tu directorio actual es una subcarpeta, vuelve a la raíz primero. Si aparece un `graphify-out/` anidado, elimínalo (no lo fusiones) y reporta el hallazgo.
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Before every commit (`git commit`, including commits made by agents or skills): run `graphify update .` so the graph reflects the staged changes, then stage the refreshed `graphify-out/` (`git add graphify-out/`) and include it in the same commit. If `graphify update .` fails, stop and report the error instead of committing a stale graph.

## archify

**Cuándo usar Archify:**
- Generar diagramas interactivos (HTML + temas, zoom, exportación) de arquitectura
- Visualizar flujos de procesos, modelos de datos, topología de componentes
- Crear candidatos JSON con especificaciones completas y luego ejecutar `finalize`

**Flujo de trabajo automatizado:**

1. **Generar candidatos JSON** con especificaciones completas:
   - `architecture.json` — Componentes, capas, relaciones, integraciones
   - `dataflow.json` — Entidades, relaciones, flujos de datos (Party Model)
   - `workflow.json` — Procesos, actores, transiciones, decisiones

2. **Usar ruta corta para evitar errores de finalize en Windows:**
   ```powershell
   mkdir "C:\temp\archify" -Force | Out-Null
   copy ".archify\*.json" "C:\temp\archify\" -Force
   cd "C:\temp\archify"
   ```

3. **Ejecutar finalize en paralelo (PowerShell):**
   ```powershell
   node "C:\Users\ianache\.claude\skills\archify\bin\archify.mjs" finalize architecture 01-architecture-general.json 01-architecture-general.html --quality showcase
   node "C:\Users\ianache\.claude\skills\archify\bin\archify.mjs" finalize dataflow 02-data-model-flow.json 02-data-model-flow.html --quality showcase
   node "C:\Users\ianache\.claude\skills\archify\bin\archify.mjs" finalize workflow 03-workflow-procesos.json 03-workflow-procesos.html --quality showcase
   ```

4. **Copiar resultados a proyecto:**
   ```powershell
   copy "*.html" "[project-root]\archify-diagrams\" -Force
   ```

5. **Reportar rutas finales al usuario** para visualización en navegador

**Guardrails:**
- Usar calidad "showcase" (no "standard") para arquitectura y workflows
- JSONs deben cumplir schemas: `schemas/architecture.schema.json`, `dataflow.schema.json`, `workflow.schema.json`
- Evitar rutas largas en Windows (máx ~100 caracteres en paths)
- Si finalize falla, usar ruta corta `C:\temp\archify\` como alternativa
- No inventar información en diagramas; basarse en documentación y especificaciones
