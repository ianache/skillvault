---
name: content-validator
description: "Actívame con el comando /course:content-validator o cuando lesson-builder, course-builder o evaluation-creator necesiten validar contenido antes de generar entregables. Este skill revisa que el contenido de cursos y lecciones no contenga información inventada (URLs inexistentes, frameworks ficticios, librerías inventadas, herramientas que no existen), que los objetivos sean coherentes con el contenido, y que las lecciones sean consistentes entre sí dentro del mismo curso. Bloquea la generación de entregables si detecta problemas y solicita corrección al usuario. También activa este skill cuando el usuario mencione \"validar\", \"revisar contenido\", \"verificar lección\", \"chequear referencias\" o cuando sospeche que hay datos técnicos incorrectos en los materiales del curso.
"
metadata:
  type: docs
  triggers:
    - /course:validator
    - course validator
config_requirements: []
---
 
# Content Validator — Validación de Contenido antes de Generar Entregables
 
Este skill es la puerta de entrada obligatoria antes de generar cualquier entregable
(PPT, guía de laboratorio, evaluación). Valida tres dimensiones: integridad técnica,
coherencia instruccional y consistencia entre lecciones.
 
**REGLA PRINCIPAL**: Si se detecta cualquier hallazgo de severidad ALTA, la generación
queda BLOQUEADA hasta que el usuario corrija o confirme explícitamente el dato.
 
---
 
## Cuándo se invoca este skill
 
`lesson-builder`, `course-builder` y `evaluation-creator` deben invocar este skill
**antes de generar cualquier entregable**. El flujo es:
 
```
Ficha confirmada → content-validator → APROBADO → generar entregables
                                     → BLOQUEADO → usuario corrige → re-validar
```
 
El usuario también puede invocarlo directamente con `/course:content-validator`
para revisar una ficha antes de continuar.
 
---
 
## Dimensión 1 — Integridad Técnica
 
Verifica que toda referencia técnica en la ficha del curso o lección sea real y
verificable. Esta es la validación más crítica.
 
### 1A. URLs y enlaces
 
**NUNCA incluir en entregables**:
- URLs inventadas o que no se haya verificado que existen
- Dominios ficticios (ej. `docs.superpowers.dev`, `repo.antigravity.io`)
- URLs de documentación de productos ficticios
**Regla de reemplazo obligatorio**:
Toda URL no verificada debe reemplazarse con un placeholder explícito:
```
[URL-PENDIENTE: descripción de qué debería enlazar aquí]
```
 
**Ejemplos de placeholders correctos**:
- `[URL-PENDIENTE: documentación oficial del framework]`
- `[URL-PENDIENTE: repositorio del proyecto — proveer al instructor]`
- `[URL-PENDIENTE: canal de soporte interno del equipo]`
### 1B. Frameworks, librerías y herramientas
 
**Verificar antes de incluir**:
- ¿El framework/librería existe en el ecosistema mencionado (npm, PyPI, Maven, etc.)?
- ¿La versión mencionada es real y está disponible públicamente?
- ¿El comando de instalación es correcto para esa herramienta?
**Señales de alerta** — investigar antes de incluir:
- Nombres de frameworks que no aparecen en búsquedas web
- Nombres de paquetes con combinaciones inusuales
- APIs o métodos que no corresponden a la documentación pública de la herramienta
- Versiones de software que no existen (ej. "Node.js 25" cuando la última es 22)
**Si el curso trabaja con tecnología propia/interna de la organización**:
Marcar explícitamente como `[TECNOLOGÍA INTERNA]` y agregar nota:
```
⚠️ NOTA: Este framework/herramienta es de uso interno.
El instructor debe proveer acceso y documentación antes del curso.
```
 
### 1C. Comandos y sintaxis
 
Verificar que los comandos en guías de laboratorio:
- Corresponden a la herramienta y versión mencionada
- Tienen la sintaxis correcta (flags, argumentos, orden)
- Los nombres de archivos y rutas son consistentes en todo el documento
---
 
## Dimensión 2 — Coherencia Instruccional
 
Verifica que la lección tenga coherencia interna entre sus componentes.
 
### 2A. Alineamiento objetivos → contenido
 
Cada objetivo de la lección debe tener:
- Al menos un tema en la agenda que lo desarrolle
- Al menos un ejercicio en el laboratorio que lo practique (si hay lab)
- Al menos una pregunta de evaluación que lo mida (si hay evaluación)
**Detectar y reportar**:
- Objetivos sin contenido correspondiente en la agenda
- Temas en la agenda que no corresponden a ningún objetivo
- Ejercicios de laboratorio desconectados de los objetivos declarados
### 2B. Coherencia de tiempos
 
- La suma de tiempos de la agenda debe igualar la duración total de la lección
- Ningún ejercicio de laboratorio debe exceder el tiempo asignado para laboratorio
- El tiempo del laboratorio no debe superar el 60% de la duración total de la lección
### 2C. Nivel de complejidad
 
- Los verbos de Bloom de los objetivos deben ser alcanzables en el tiempo disponible
- No mezclar objetivos de nivel 1 (Recordar) con objetivos de nivel 6 (Crear) en la
  misma lección de 1-2 horas sin una progresión clara
---
 
## Dimensión 3 — Consistencia entre lecciones
 
Aplica cuando hay más de una lección definida en el curso.
 
### 3A. Progresión de contenido
 
- Los contenidos de lecciones posteriores deben asumir los aprendizajes de las anteriores
- No repetir objetivos idénticos entre lecciones (refinamiento sí, duplicación no)
- Los prerrequisitos de cada lección deben estar cubiertos por lecciones anteriores
### 3B. Consistencia de nomenclatura
 
- Los nombres de herramientas, comandos y conceptos deben ser idénticos en todas
  las lecciones (no mezclar "Antigravity" con "Anti-Gravity" o "antigravity")
- Los códigos de lección deben seguir el mismo patrón (DEV-101-L1, DEV-101-L2...)
- El nombre del curso debe ser idéntico en todas las fichas de lección
### 3C. Consistencia de entorno
 
- Las versiones de software mencionadas deben ser las mismas en todas las lecciones
- Si la Lección 1 configura el entorno, las siguientes no deben contradecir esa config
---
 
## Protocolo de reporte
 
Al finalizar la validación, presenta siempre un reporte con esta estructura:
 
```
╔══════════════════════════════════════════════════════════╗
║           REPORTE DE VALIDACIÓN DE CONTENIDO             ║
╠══════════════════════════════════════════════════════════╣
║ Curso    : [Código] — [Nombre]                            ║
║ Lección  : [Código] — [Título]  (o "Todas las lecciones")║
║ Fecha    : [Fecha de validación]                          ║
╠══════════════════════════════════════════════════════════╣
║ RESULTADO: ✅ APROBADO / ❌ BLOQUEADO                     ║
╚══════════════════════════════════════════════════════════╝
 
HALLAZGOS
─────────────────────────────────────────────────────────
[ALTA]   ❌ [Descripción del problema — ubicación exacta]
         → Acción requerida: [qué debe corregir el usuario]
 
[MEDIA]  ⚠️  [Descripción del problema — ubicación exacta]
         → Sugerencia: [qué se recomienda ajustar]
 
[BAJA]   ℹ️  [Observación — ubicación exacta]
         → Opcional: [mejora sugerida]
 
RESUMEN
─────────────────────────────────────────────────────────
Hallazgos ALTOS  : [N]  → bloquean la generación
Hallazgos MEDIOS : [N]  → recomendados corregir
Hallazgos BAJOS  : [N]  → opcionales
 
[Si BLOQUEADO]:
⛔ La generación de entregables está BLOQUEADA hasta resolver
   los hallazgos ALTOS listados arriba.
   Una vez corregidos, indica "validar de nuevo" para continuar.
 
[Si APROBADO]:
✅ El contenido está validado. Puedes proceder a generar
   los entregables con lesson-builder.
```
 
---
 
## Clasificación de severidad
 
| Severidad | Condición                                          | Efecto             |
|-----------|----------------------------------------------------|--------------------|
| **ALTA**  | URL inventada / framework ficticio / comando erróneo / objetivo sin contenido | Bloquea generación |
| **ALTA**  | Tecnología interna sin marcar como tal             | Bloquea generación |
| **MEDIA** | Suma de tiempos no cuadra / verbo Bloom inapropiado | Advierte, no bloquea |
| **MEDIA** | Nomenclatura inconsistente entre lecciones         | Advierte, no bloquea |
| **BAJA**  | Objetivo podría ser más específico                 | Sugerencia opcional |
| **BAJA**  | Tiempo de un ejercicio parece ajustado             | Sugerencia opcional |
 
---
 
## Tecnologías conocidas — referencia rápida
 
El validador puede asumir como reales (sin investigar) las siguientes tecnologías
ampliamente documentadas. Para cualquier otra, verificar antes de incluir:
 
**Lenguajes**: Java, Python, TypeScript, JavaScript, Go, Rust, C#, Kotlin, Swift
**Frameworks web**: Angular, React, Vue, SpringBoot, FastAPI, Django, NestJS, Express
**Bases de datos**: PostgreSQL, MySQL, MongoDB, Redis, Oracle, SQL Server
**Cloud / Infra**: Docker, Kubernetes, OKE, AWS, GCP, Azure, Terraform, Ansible
**CI/CD**: GitLab CI, GitHub Actions, Jenkins, ArgoCD
**Data**: Apache Airflow, Trino, Spark, dbt, Kafka
**Gestores de paquetes**: npm, pip, Maven, Gradle, Poetry, Cargo
 
**Versiones estables a julio 2026** (referencia aproximada):
- Node.js: 22.x LTS / 20.x LTS
- Python: 3.12 / 3.11
- Java JDK: 21 LTS / 17 LTS
- Angular: 18.x
- SpringBoot: 3.3.x
Si el curso menciona versiones superiores a estas, marcar como [ALTA] para verificar.
 
---
 
## Manejo de tecnología interna / ficticia del curso
 
Cuando el curso usa tecnología propia de la organización (frameworks internos,
herramientas propietarias, sistemas con nombres inventados para el entrenamiento):
 
1. El usuario debe declararlo explícitamente al inicio: *"Este curso usa el framework
   interno XYZ"* o *"Los nombres son ficticios para el ejercicio"*
2. Una vez declarado, el validador lo marca como `[TECNOLOGÍA INTERNA — DECLARADA]`
   y no lo reporta como hallazgo ALTO
3. En los entregables, toda URL de tecnología interna se reemplaza con:
   `[URL-INTERNA: el instructor debe proveer este enlace]`
4. Todo comando de tecnología interna se marca con:
   `# ⚠️ Comando interno — verificar con el instructor`
---
 
## Integración con lesson-builder
 
`lesson-builder` debe seguir este protocolo antes de generar entregables:
 
```
1. Ficha de lección confirmada por el usuario
2. Invocar content-validator con la ficha completa
3. Si resultado = BLOQUEADO:
   a. Presentar el reporte al usuario
   b. Esperar correcciones
   c. Repetir desde el paso 2
4. Si resultado = APROBADO:
   a. Proceder con la generación del entregable solicitado
   b. Aplicar los placeholders indicados en el reporte
```
 
**El salto del paso 2 al 4 sin validación está prohibido.**
 