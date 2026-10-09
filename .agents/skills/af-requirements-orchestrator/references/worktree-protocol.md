# Protocolo de aislamiento con git worktree

Un worktree separa el trabajo de requerimientos de la rama principal hasta que una persona decide incorporarlo. Importa porque un ciclo completo toca decenas de archivos de `knowledge-base/` (términos, reglas, historias, `index.md`, `changelog.md`), y una pasada fallida o descartada no debe ensuciar la rama de trabajo.

## Contenido
- Cuándo aplica
- 1. Detectar y crear
- 2. Verificación previa
- 3. Trabajo dentro del worktree
- 4. Integración
- 5. Limpieza
- Alternativa sin worktree

## Cuándo aplica

- **Escribe archivos** (escenarios A–C, E, F y las correcciones del D): usa worktree.
- **Solo lee** (un D que no corrige nada, o consultas): no hace falta.
- Si el usuario ya declaró su preferencia (sí, no, o un directorio), respétala sin volver a preguntar.

## 1. Detectar y crear

Delega en `superpowers:using-git-worktrees`: detecta si ya estás en un worktree (no crees otro), pide consentimiento si no hay preferencia declarada y usa la herramienta nativa (`EnterWorktree`) antes que `git worktree add`.

- **Rama:** `req/<slug-del-alcance>` (p. ej. `req/gestion-colaboradores`). Una rama por ejecución del orquestador, no una por skill.
- Si el orquestador ya creó el worktree, los skills `af-*` que invocan trabajan en él.
- **Nombre corto (Windows):** nombra el worktree con 12 caracteres o menos (p. ej. `req-cursos`). Windows limita las rutas a 260 caracteres y graphify escribe archivos como `<worktree>\graphify-out\cache\ast\v0.9.65-s4\<64 hex>.<sufijo>.tmp`; con un nombre largo, `graphify update .` falla con `No such file or directory`. Antes de empezar, comprueba que `len(<raíz del worktree>) + 118` quede por debajo de 255. Si ya falló, `git worktree move` con un nombre corto conserva los cambios sin commitear.

## 2. Verificación previa

Un worktree parte del **último commit**. Lo que está sin commitear en el checkout principal no existe en él.

1. Ejecuta `git status --short` en el checkout principal.
2. Si hay archivos modificados o sin seguimiento que el trabajo necesita (artefactos que se van a actualizar, o los propios skills `af-*`), dilo al usuario y ofrece: commitearlos primero, trabajar en el checkout actual, o continuar sabiendo qué faltará. No los copies al worktree por tu cuenta.
3. Verifica en el worktree que `.claude/skills/af-*` y `knowledge-base/` existen; los comandos de los skills (`python .claude/skills/...`) usan rutas relativas a la raíz del worktree y se ejecutan desde allí.
4. Si el worktree no contiene este orquestador (porque está sin commitear), ejecuta `audit_requirements.py` por su ruta absoluta en el checkout principal y pásale `knowledge-base` del worktree. El script solo lee el directorio que recibe.
5. Compara con la rama base (`git log --oneline HEAD..main`): si `main` avanzó, avísalo en el resumen de integración, porque `index.md`, `changelog.md` y `graphify-out/` son los archivos que suelen chocar.

## 3. Trabajo dentro del worktree

- Todo el ciclo ocurre en el worktree, incluidas las ejecuciones en paralelo de subagentes.
- **Archivos compartidos:** los skills `af-*` actualizan `knowledge-base/index.md` y `changelog.md` al terminar. Si varios corren en paralelo sobre el mismo worktree, se pisarían. Al delegar en paralelo, indícales que omitan esos pasos y devuelvan las entradas; el orquestador las aplica una sola vez.
- No hagas commit por tu cuenta. El repositorio exige que solo se haga a petición del usuario.

## 4. Integración

Cuando la auditoría esté limpia (o con los errores restantes declarados):

1. Ejecuta `graphify update .` en el worktree (regla del repositorio previa a todo commit) para que `graphify-out/` refleje los cambios.
2. Resume los cambios: `git status --short` y `git diff --stat` contra la rama base, más la lista de decisiones humanas pendientes.
3. **Propón y espera.** Ofrece: commit y merge a la rama principal, commit y PR, mantener el worktree, o descartarlo. No integres, no hagas commit y no borres sin la respuesta explícita del usuario. Si elige commit, incluye `graphify-out/` en el mismo commit.
4. Si la rama principal avanzó y hay conflictos: en `index.md` y `changelog.md` conserva las entradas de ambos lados; en cualquier artefacto `approved` o con `verified`, no resuelvas en silencio y pregunta al usuario.

## 5. Limpieza

Tras integrar o descartar, sale del worktree con `ExitWorktree`. Si hay cambios sin commitear, confirma con el usuario antes de eliminarlo.

## Alternativa sin worktree

Si el usuario lo declina, el sandbox bloquea `git worktree add`, o el repositorio no es git, trabaja en el checkout actual y registra en la RQS (sección 7) que no hubo aislamiento y por qué. No es un error; lo importante es que quede dicho.
