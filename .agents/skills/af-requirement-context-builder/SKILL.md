---
name: af-requirement-context-builder
description: Construye un Requirement Context Pack trazable antes de redactar o refinar requisitos, separando evidencia, inferencias, vacíos y decisiones humanas.
---

# Requirement Context Builder

## Propósito

Construir un contexto funcional mínimo y suficiente para que un Analista Funcional, otro rol o un agente posterior pueda entender el problema sin volver a descubrirlo desde cero.

## Cuándo activarse

Actívate cuando el usuario:

- necesita comprender una iniciativa, cambio o necesidad de negocio antes de especificarla;
- solicita ordenar información dispersa de producto, procesos, datos o integraciones;
- pide preparar contexto para User Stories, análisis de impacto o revisión funcional;
- entrega fuentes y pide un contexto trazable o un Context Pack.

No redactes User Stories completas ni propongas una solución técnica como salida principal. Esas tareas corresponden a Skills posteriores.

## Entradas mínimas

- Producto, proceso o iniciativa bajo análisis.
- Objetivo de negocio o pregunta de trabajo.
- Alcance conocido, aunque sea incompleto.
- Fuentes autorizadas disponibles.

Si falta una entrada crítica, formula una pregunta concreta y explica por qué bloquea el análisis. No inventes el dato.

## Knowledge and Tools

Usa sólo fuentes autorizadas y el contexto necesario:

- Knowledge Base empresarial.
- Context Pack entregado por el usuario.
- Documentación de producto o proceso.
- GDrive por producto, cuando esté autorizado.
- GitLab Issues, cuando esté autorizado.
- MCP de conocimiento, cuando esté disponible y permitido.

Registra la fuente de cada hallazgo. Si no puedes confirmar una afirmación, declárala como hipótesis o vacío.

## Workflow

### 1. Delimitar

Identifica producto, objetivo, actores iniciales, alcance incluido y alcance excluido. Reescribe el objetivo como resultado observable de negocio.

### 2. Recuperar

Busca sólo el contexto necesario para responder la pregunta de trabajo. Prioriza fuentes actuales, específicas y autorizadas. Evita recuperar datos personales o información que no cambia la decisión.

### 3. Clasificar

Separa cada hallazgo en:

- Hecho: aparece respaldado por una fuente.
- Supuesto: se usa provisionalmente, pero necesita confirmación.
- Vacío: falta información para continuar con seguridad.
- Hipótesis: interpretación propuesta por el agente que aún no tiene respaldo suficiente.
- Decisión humana: elección o validación realizada por una persona responsable.

### 4. Mapear

Identifica actores, procesos, estados, datos, reglas conocidas, dependencias, consumidores y restricciones funcionales. No conviertas una ausencia de evidencia en una dependencia confirmada.

### 5. Construir

Produce el Requirement Context Pack usando la plantilla de `references/requirement-context-pack-template.md`. Incluye trazabilidad entre hallazgos y fuentes.

### 6. Validar

Ejecuta una revisión de consistencia. Señala contradicciones, términos ambiguos, fuentes faltantes y preguntas que deben responder otros roles. Deja una sección explícita para validación humana.

## Formato de salida

Entrega estas secciones, en este orden:

1. Metadata y pregunta de trabajo.
2. Objetivo y alcance.
3. Resumen ejecutivo del contexto.
4. Registro de evidencia.
5. Hechos confirmados.
6. Supuestos e hipótesis.
7. Vacíos y preguntas abiertas.
8. Actores, procesos, datos y dependencias.
9. Restricciones y riesgos funcionales.
10. Decisiones y validación humana.
11. Knowledge Candidates con provenance.
12. Handoff para el siguiente rol.

El resultado generado se debe colocar en `requirements\context-packs`. El o los archivos deben ajustarse al standard Google OKF v0.2 (frontmatter) y tener un nombre `[id de OKF]-[nombre].md`

## Guardrails

- Evidence before assertion: toda conclusión relevante tiene una fuente o está marcada como hipótesis.
- Human accountability: no cierres una decisión de negocio en nombre del usuario.
- Least context necessary: recupera sólo lo que necesitas y respeta permisos.
- No inventes nombres de sistemas, reglas, actores, métricas o dependencias.
- Separa texto recuperado, inferencia del agente y decisión humana.
- No conviertas un Knowledge Candidate en conocimiento canónico sin verificación y provenance.
- Si detectas datos sensibles, minimízalos y solicita una fuente autorizada o una versión anonimizada.

## Acceptance Criteria

El trabajo está listo cuando:

- el objetivo y el alcance pueden leerse sin contexto oral adicional;
- cada hallazgo relevante tiene fuente o clasificación explícita;
- hechos, supuestos, vacíos, hipótesis y decisiones no se mezclan;
- actores, procesos, datos y dependencias aparecen relacionados;
- las preguntas abiertas tienen destinatario y prioridad;
- otra persona puede continuar el análisis usando el pack;
- la validación humana y los pendientes quedan visibles.

## Referencias

- `references/requirement-context-pack-template.md`
- `references/evidence-log-template.md`
- `references/human-validation-checklist.md`

## Aislamiento con git worktree

Cuando la tarea vaya a crear o editar archivos, trabaja en un worktree de git aislado para que la rama principal no reciba nada hasta que una persona lo decida.

- Comprueba primero: si `git rev-parse --git-dir` y `git rev-parse --git-common-dir` difieren, ya estás en un worktree enlazado (por ejemplo, creado por `af-requirements-orchestrator`). Trabaja ahí y no crees otro.
- En el checkout principal, ofrece un worktree con `superpowers:using-git-worktrees` (rama `req/<slug>`) y respeta la respuesta o la preferencia ya declarada. Un worktree parte del último commit: ejecuta `git status --short` y di al usuario qué archivos sin commitear no tendrá.
- Si quien te invoca dice que actualizará `knowledge-base/index.md` y `changelog.md`, omite esos pasos y devuelve las entradas.
- Nunca hagas commit, merge ni elimines el worktree por iniciativa propia. Al terminar, resume `git status --short` y `git diff --stat` y deja que el usuario elija merge, PR, conservar o descartar. Las tareas de solo lectura no necesitan worktree.
