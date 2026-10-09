---
name: lesson-builder
description: "Actívame con el comando /course:lesson-builder o cuando el usuario quiera crear, diseñar o documentar lecciones de un curso de capacitación. Esto incluye: crear la ficha de lección (código, título, duración, objetivos, habilidades, contenido/agenda, metodología), generar la presentación PPT de la lección, crear la guía de laboratorio, y generar imágenes ilustrativas. También activa este skill cuando el usuario mencione \"lección\", \"clase\", \"módulo\", \"sesión\", \"PPT del curso\", \"presentación de la lección\", \"guía de laboratorio\", \"práctica\", \"lab\", o cuando quiera crear materiales para una lección específica. Funciona de forma independiente (sin necesidad de course-builder) o vinculado a un curso existente — pregunta solo código y nombre del curso si no están disponibles. NO genera evaluaciones — para eso usar evaluation-creator. IMPORTANTE: antes de generar cualquier entregable siempre ejecuta content-validator.
"
metadata:
  type: docs
  triggers:
    - /course:lesson
    - course lesson
config_requirements: []
---
 
# Lesson Builder — Creación de Lecciones
 
Este skill crea lecciones completas con todos sus materiales: ficha técnica, PPT,
guía de laboratorio e imágenes. Funciona solo o vinculado a un curso existente.
 
⚠️ REGLA ABSOLUTA: Ningún entregable (PPT, .docx, imágenes) puede generarse sin
haber ejecutado primero content-validator y obtenido resultado APROBADO. Esta regla
no tiene excepciones, aunque el usuario lo solicite explícitamente.
 
---
 
## Flujo de trabajo
 
1. **Identificar el curso** → pide solo código y nombre (mínimo necesario)
2. **Definir la lección** → completar la ficha de lección conversacionalmente
3. **Confirmar la ficha** → mostrar y pedir validación del usuario
4. **🛡️ Validar contenido** → ejecutar content-validator ANTES de generar nada
5. **Generar entregables** → solo si content-validator retorna APROBADO
6. **Continuar o cerrar** → preguntar si hay más lecciones que crear
---
 
## Paso 1 — Identificación del curso
 
Pregunta únicamente:
- Código del curso (ej. `CÓD-001`)
- Nombre del curso
Si el usuario ya los proporcionó en el chat, no vuelvas a pedirlos.
 
Pregunta también si el curso usa **tecnología interna o ficticia** (frameworks propios,
nombres inventados para el ejercicio). Si es así, registrar como declarado — el
validador no los reportará como error sino como `[TECNOLOGÍA INTERNA — DECLARADA]`.
 
---
 
## Paso 2 — Ficha de Lección
 
Recopila los datos en grupos. Muestra la ficha completa al terminar y pide confirmación.
 
### Grupos de preguntas
 
**Identidad:**
- Número de lección dentro del curso (ej. Lección 1 de 5)
- Código de lección: formato sugerido `[CÓD-CURSO]-L[N]`
- Título de la lección
**Tiempo y logística:**
- Duración (minutos u horas)
- Metodología: Exposición / Taller / Caso / Demostración / Debate / Combinada
**Contenido:**
- Objetivos de la lección (2-4, verbos de Bloom, medibles)
- Habilidades específicas que desarrolla esta lección
- Agenda / contenido: lista de temas con tiempos estimados
- Recursos necesarios: herramientas, plataformas, materiales
### Plantilla: Ficha de Lección
 
```
╔══════════════════════════════════════════════════════════════════╗
║                       FICHA DE LECCIÓN                           ║
╠══════════════════════════════════════════════════════════════════╣
║ CURSO           : [Código] — [Nombre del Curso]                   ║
║ LECCIÓN N°      : [N] de [Total]                                  ║
║ CÓDIGO          : [CÓD-CURSO-LN]                                  ║
║ TÍTULO          : [Título de la lección]                          ║
║ DURACIÓN        : [N minutos / N horas]                           ║
║ METODOLOGÍA     : [Exposición / Taller / Caso / Demo / etc.]      ║
╠══════════════════════════════════════════════════════════════════╣
║ OBJETIVOS DE LA LECCIÓN                                           ║
║ Al finalizar esta lección, el participante será capaz de:         ║
║   1. [Verbo Bloom + objeto + condición]                           ║
║   2. [...]                                                        ║
╠══════════════════════════════════════════════════════════════════╣
║ HABILIDADES A DESARROLLAR                                         ║
║   • [Habilidad específica de esta lección]                        ║
║   • [...]                                                         ║
╠══════════════════════════════════════════════════════════════════╣
║ AGENDA                                                            ║
║   1. [Tema o actividad] .................. [N min]                ║
║   2. [...]                                                        ║
╠══════════════════════════════════════════════════════════════════╣
║ RECURSOS        : [Herramientas, plataformas, materiales]         ║
╚══════════════════════════════════════════════════════════════════╝
```
 
---
 
## Paso 3 — Confirmación del usuario
 
Presentar la ficha completa y preguntar: *"¿Confirmamos esta ficha para proceder
con la validación y generación de materiales?"*
 
No avanzar hasta recibir confirmación explícita.
 
---
 
## Paso 4 — Validación con content-validator (OBLIGATORIO)
 
Lee `/mnt/skills/user/content-validator/SKILL.md` y aplica todas sus reglas
a la ficha confirmada ANTES de generar ningún entregable.
 
### Qué verificar en la ficha de lección
 
**Integridad técnica (Dimensión 1):**
 
□ Cada URL mencionada en recursos o referencias — ¿existe y es pública?
  → Si no se puede verificar: reemplazar con `[URL-PENDIENTE: descripción]`
 
□ Cada framework, librería o herramienta mencionada — ¿existe?
  → Contrastar con la lista de tecnologías conocidas en content-validator
  → Si es tecnología interna declarada: marcar como `[TECNOLOGÍA INTERNA — DECLARADA]`
  → Si es desconocida y no declarada: hallazgo ALTO
 
□ Las versiones de software mencionadas — ¿son reales y están vigentes?
  → Versiones superiores a las estables conocidas: hallazgo ALTO
 
□ Los comandos mencionados — ¿tienen sintaxis correcta para la herramienta?
  → Comandos inventados o con flags incorrectos: hallazgo ALTO
 
**Coherencia instruccional (Dimensión 2):**
 
□ ¿Cada objetivo tiene al menos un tema en la agenda que lo desarrolla?
  → Objetivo sin cobertura en agenda: hallazgo ALTO
 
□ ¿La suma de tiempos de la agenda coincide con la duración declarada?
  → Diferencia > 10 minutos: hallazgo MEDIO
 
□ ¿Los verbos de Bloom son apropiados para el tiempo disponible?
  → Objetivo nivel 6 (Crear) en lección de 1h sin andamiaje: hallazgo MEDIO
 
**Consistencia entre lecciones (Dimensión 3):**
 
□ ¿Los nombres de herramientas son idénticos a los usados en lecciones anteriores?
  → Inconsistencia de nomenclatura: hallazgo MEDIO
 
□ ¿Las versiones de software coinciden con las declaradas en lecciones anteriores?
  → Versión diferente sin justificación: hallazgo ALTO
 
□ ¿Los prerrequisitos de esta lección están cubiertos por lecciones anteriores?
  → Prerrequisito no cubierto: hallazgo MEDIO
 
### Resultado de la validación
 
Presentar siempre el reporte completo según el formato definido en content-validator.
 
**Si BLOQUEADO**: No generar ningún entregable. Presentar hallazgos ALTOS,
pedir correcciones y re-validar antes de continuar.
 
**Si APROBADO**: Confirmar al usuario y proceder con los entregables solicitados,
aplicando todos los placeholders indicados en el reporte.
 
---
 
## Paso 5 — Entregables (solo tras validación APROBADA)
 
Tras la validación exitosa, ofrece los entregables. Genera solo los que el usuario
solicite. Pregunta cuál quiere primero.
 
### Entregable A: PPT de la Lección (.pptx)
 
Lee `/mnt/skills/public/pptx/SKILL.md` antes de generar.
 
**Estructura estándar de slides:**
 
| N° | Tipo      | Contenido                                               |
|----|-----------|---------------------------------------------------------|
| 1  | Portada   | Título, código, nombre del curso, número de lección     |
| 2  | Agenda    | Temas con tiempos (de la ficha)                         |
| 3  | Objetivos | "Al finalizar esta lección serás capaz de..."           |
| 4+ | Contenido | 1 slide por tema; máx. 7 bullets × 7 palabras           |
| -1 | Resumen   | 3-5 puntos clave (takeaways)                            |
| -1 | Referencias | Solo referencias verificadas o con placeholder explícito|
 
> Si la lección incluye laboratorio, añadir slide de "Actividad práctica" antes del resumen.
 
**Reglas de contenido para el PPT:**
- Solo incluir herramientas y tecnologías que pasaron la validación
- URLs: usar exclusivamente las verificadas o los placeholders aprobados
- No inventar ejemplos de código con APIs o métodos no verificados
- Comandos: copiar exactamente los validados en la ficha, sin modificarlos
**Paletas de color disponibles** (preguntar preferencia si no se indica):
- **Oscura** (tech/data): fondo `#1a2b4a`, acento `#00a8e8`, texto `#ffffff`
- **Clara** (gestión/negocio): fondo `#ffffff`, primario `#0056a3`, acento `#f5a623`
- **Neutra**: fondo `#f8f9fa`, primario `#2d3748`, acento `#4a90d9`
Para detalles de layout y coordenadas pptxgenjs: `references/ppt-diseno.md`
 
Guardar como: `[CÓDIGO-LECCIÓN]-presentacion.pptx` en `/mnt/user-data/outputs/`
 
---
 
### Entregable B: Guía de Laboratorio (.docx)
 
Solo si la lección incluye práctica / laboratorio.
 
Lee `/mnt/skills/public/docx/SKILL.md` antes de generar.
 
**Estructura estándar:**
1. Encabezado (código, curso, lección, duración, versión)
2. Objetivos del laboratorio
3. Pre-requisitos
4. Entorno requerido (software, versiones, credenciales)
5. Preparación del entorno
6. Ejercicios (cada uno con: contexto, pasos numerados, resultado esperado, checkpoint ✓)
7. Actividad integradora (opcional)
8. Entregable del alumno
9. Criterios de evaluación
10. Preguntas de reflexión
11. Referencias
**Reglas de contenido para la guía de laboratorio:**
- URLs en sección de referencias: solo verificadas o con placeholder
  `[URL-PENDIENTE: descripción]`
- Comandos: solo los validados; agregar comentario si son internos:
  `# ⚠️ Comando interno — verificar con el instructor`
- Versiones de software: usar exactamente las validadas
- Nombres de archivos y rutas: consistentes en todo el documento
- Credenciales y tokens: nunca valores reales, siempre `<tu-token>` o `[CREDENCIAL]`
- Resultados esperados: describir estructura del output, no inventar valores exactos
  si dependen del entorno del alumno
**Convenciones tipográficas:**
- Comandos: `código monoespaciado`
- Notas: ℹ️ NOTA:
- Advertencias: ⚠️ PRECAUCIÓN:
- Errores comunes: ❌ ERROR FRECUENTE:
- Checkpoints: ✓ CHECKPOINT:
- Tecnología interna: ⚙️ INTERNO:
Para referencia completa del estándar: `references/guia-lab-estandar.md`
 
Guardar como: `[CÓDIGO-LECCIÓN]-lab.docx` en `/mnt/user-data/outputs/`
 
---
 
### Entregable C: Imágenes ilustrativas
 
Usar `image_search` para encontrar imágenes reales relevantes al tema.
 
Para prompts de generación IA (DALL-E, Firefly, Midjourney):
 
**Prompt de portada de lección:**
```
Professional course slide cover for a lesson about [TEMA REAL].
Modern corporate style. Visual elements related to [CAMPO].
Color palette: [colores]. No text overlay. 16:9 format, clean design.
```
 
---
 
## Tabla resumen de archivos generados
 
| Entregable          | Formato | Nombre de archivo              |
|---------------------|---------|-------------------------------|
| Ficha de lección    | .docx   | `[CÓD]-L[N]-ficha.docx`       |
| Presentación PPT    | .pptx   | `[CÓD]-L[N]-presentacion.pptx`|
| Guía de laboratorio | .docx   | `[CÓD]-L[N]-lab.docx`         |
 
> Para evaluaciones → usar **evaluation-creator**
> Para validación de contenido → usar **content-validator**
 
---
 
## Principios de diseño instruccional
 
- **Coherencia**: objetivos → contenido → actividad → evaluación alineados
- **Autocontenida**: la guía de lab funciona sin instrucciones verbales adicionales
- **Verificable**: todo dato técnico debe ser real o estar explícitamente marcado
- **PPT como soporte visual**: máximo 7 palabras por bullet; sin párrafos en slides
- **Checkpoints en lab**: cada ejercicio debe tener una verificación observable
- **Notas del presentador**: incluir en `slide.addNotes()` el script completo del slide