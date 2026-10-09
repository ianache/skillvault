# Protocolo de aislamiento con git worktree

Aplica el protocolo de `af-requirements-orchestrator` (`../../af-requirements-orchestrator/references/worktree-protocol.md`) con las diferencias de abajo. Léelo para el detalle de detección, verificación previa, archivos compartidos, integración y limpieza.

## Contenido
- Cuándo aplica
- Diferencias respecto al protocolo de requerimientos
- Integración

## Cuándo aplica

- **Escribe archivos** (escenarios A–E y las correcciones de F y G): usa worktree.
- **Solo lee** (un F que no corrige nada, o consultas): no hace falta.
- Si el usuario ya declaró su preferencia (sí, no, o un directorio), respétala sin volver a preguntar.

## Diferencias respecto al protocolo de requerimientos

- **Rama:** `ux/<slug-del-alcance>` (p. ej. `ux/org-units`). Una rama por ejecución del orquestador, no una por skill.
- **Nombre corto (Windows):** 12 caracteres o menos (p. ej. `ux-orgunits`), por el mismo límite de rutas que afecta a `graphify update .`.
- **Verificación previa:** además de `git status --short`, comprueba que el worktree contiene `.claude/skills/` de los skills UX/UI, `.claude/skills/ux-development-handoff/validators/` y `knowledge-base/design/`. Los validadores se ejecutan por ruta relativa a la raíz del worktree. Si faltan por estar sin commitear, ofrece commitearlos primero o trabajar en el checkout actual; no los copies por tu cuenta.
- **Archivos compartidos:** además de `index.md` y `changelog.md`, el **DTM** es un archivo compartido (una entrada por SCR). Los subagentes en paralelo no lo editan: devuelven los datos de la entrada y el orquestador los registra una vez con `register-exploration` / `register-governed`.
- **Efectos externos fuera del aislamiento:** Stitch y Figma no están en el worktree. Un proyecto Stitch creado o un nodo Figma modificado persiste aunque se descarte el worktree. Antes de llamar a una herramienta externa que escribe, díselo al usuario; si se descarta el worktree, lista los `STP`/nodos creados para que alguien los limpie manualmente.
- **Binarios de exploración:** los HTML y PNG de `design/stitch/GEN-*/` pueden ser pesados; confírmalos en el resumen de cambios para que el usuario decida si van al commit.

## Integración

Como en el protocolo de requerimientos: `graphify update .`, resumen (`git status --short`, `git diff --stat` contra la base y decisiones humanas pendientes), propuesta de commit+merge, commit+PR, mantener o descartar, y esperar la respuesta. Sin commit, merge ni borrado por iniciativa propia. Con conflictos en `index.md`, `changelog.md` o el DTM conserva las entradas de ambos lados; en cualquier artefacto `approved` o `verified` no resuelvas en silencio: pregunta.

Si el worktree no es posible, trabaja en el checkout actual y registra en la UXS (sección 7) que no hubo aislamiento y por qué.
