---
name: evaluation-creator
description: "Actívame con el comando /course:evaluation-creator o cuando el usuario quiera crear evaluaciones, cuestionarios, exámenes, pruebas o instrumentos de evaluación para cursos o lecciones. Esto incluye: evaluaciones con preguntas de selección simple, selección múltiple, respuesta abierta, verdadero/falso, completar espacios y casos prácticos con rúbrica.
"
metadata:
  type: docs
  triggers:
    - /course:evaluation
    - lesson evaluation
    - evaluation
config_requirements: []
---

Actívame con el comando /course:evaluation-creator o cuando el usuario quiera crear
  evaluaciones, cuestionarios, exámenes, pruebas o instrumentos de evaluación para
  cursos o lecciones. Esto incluye: evaluaciones con preguntas de selección simple,
  selección múltiple, respuesta abierta, verdadero/falso, completar espacios y casos
  prácticos con rúbrica. Genera el cuestionario como formulario interactivo exportable
  a Google Forms (via Apps Script) y como documento Word (.docx) en versión alumno y
  versión docente con clave de respuestas. También activa este skill cuando el usuario
  mencione "evaluación", "cuestionario", "examen", "prueba", "quiz", "test", "preguntas
  de evaluación", "rúbrica", "clave de respuestas", o cuando quiera medir el aprendizaje
  de una lección o curso. Funciona solo (evaluación independiente) o vinculado a un
  curso/lección existente.
 
# Evaluation Creator — Creación de Evaluaciones
 
Crea evaluaciones completas con múltiples tipos de pregunta. Genera salida para
Google Forms (Apps Script) y .docx (versiones alumno y docente).
 
---
 
## Flujo de trabajo
 
1. **Identificar contexto** → curso/lección vinculada o evaluación independiente
2. **Definir parámetros** → tipo, puntaje total, tiempo, instrucciones
3. **Diseñar preguntas** → conversacionalmente o desde objetivos de la lección
4. **Confirmar banco de preguntas** → mostrar resumen y pedir validación
5. **Generar entregables** → Apps Script (Google Forms) + .docx alumno + .docx docente
---
 
## Paso 1 — Identificación del contexto
 
Pregunta si la evaluación está vinculada a un curso/lección o es independiente.
 
**Si está vinculada**, pedir solo:
- Código y nombre del curso
- Número y título de la lección (si es evaluación de lección)
**Si es independiente**, pedir:
- Título de la evaluación
- Tema o área que evalúa
---
 
## Paso 2 — Parámetros de la evaluación
 
Recopilar en un solo grupo de preguntas:
 
| Parámetro         | Descripción                                              |
|-------------------|----------------------------------------------------------|
| Tipo              | Diagnóstica / Formativa / Sumativa / Autoevaluación      |
| Puntaje total     | Sugerido: 20 puntos (ajustable)                          |
| Tiempo asignado   | En minutos                                               |
| Instrucciones     | Texto de instrucciones generales para el alumno          |
| Modo              | Individual / Grupal                                      |
| Recursos          | Con libro abierto / Sin recursos / Solo apuntes          |
 
---
## Paso 3 — Tipos de pregunta
 
El skill soporta 6 tipos. Para cada pregunta, el usuario puede indicar el tipo
o el skill puede sugerirlo según el objetivo de aprendizaje que evalúa.
 
### Tipo 1: Selección Simple (una sola respuesta correcta)
```
[N]. [Enunciado de la pregunta]
   A) [Opción]
   B) [Opción]
   C) [Opción]
   D) [Opción]
   Respuesta correcta: [Letra]
   Puntaje: [N] pts
   Nivel Bloom: [Recordar / Comprender]
```
Reglas:
- 4 opciones: 1 correcta + 2 distractores plausibles + 1 claramente incorrecta
- Enunciado completo sin leer las opciones
- Evitar "ninguna / todas las anteriores"
- Evitar dobles negaciones
### Tipo 2: Selección Múltiple (varias respuestas correctas)
```
[N]. [Enunciado] (Seleccione todas las que apliquen)
   ☐ A) [Opción]
   ☐ B) [Opción]
   ☐ C) [Opción]
   ☐ D) [Opción]
   Respuestas correctas: [Letras]
   Puntaje: [N] pts — parcial si aplica
   Nivel Bloom: [Comprender / Aplicar / Analizar]
```
Reglas:
- Mínimo 2 opciones correctas
- Indicar claramente "seleccione todas las que apliquen"
- Definir si hay puntaje parcial
### Tipo 3: Respuesta Abierta
```
[N]. [Pregunta o consigna]
   Extensión esperada: [N líneas / N palabras / N párrafos]
   Puntaje: [N] pts
   Nivel Bloom: [Analizar / Evaluar / Crear]
   Criterios de evaluación:
     - [Criterio 1]: [N] pts
     - [Criterio 2]: [N] pts
```
### Tipo 4: Verdadero / Falso
```
[N]. [Enunciado]    ( V )  ( F )
   Respuesta: [V/F]
   Justificación (versión docente): [Por qué es V o F]
   Puntaje: [N] pts
   Nivel Bloom: [Recordar / Comprender]
```
Reglas:
- Enunciados unívocos — sin ambigüedad
- 50% verdaderos / 50% falsos en el conjunto
- Evitar palabras absolutas: "siempre", "nunca", "todos"
### Tipo 5: Completar Espacios
```
[N]. [Oración con ________ para completar]
   Respuesta esperada: [Palabra o frase exacta]
   Puntaje: [N] pts
   Nivel Bloom: [Recordar / Aplicar]
```
Reglas:
- Un solo espacio por oración
- La respuesta debe ser única y precisa
- Máximo 3-4 palabras por respuesta
### Tipo 6: Caso Práctico con Rúbrica
```
[N]. CASO: [Descripción del escenario — 2-5 párrafos con datos y contexto]
 
   Preguntas del caso:
   [N.1] [Pregunta específica sobre el caso]
   [N.2] [Pregunta de análisis o recomendación]
 
   Puntaje total: [N] pts
   Nivel Bloom: [Analizar / Evaluar / Crear]
 
   RÚBRICA:
   | Criterio           | Excelente (4) | Bueno (3) | Regular (2) | Insuficiente (1) |
   |-------------------|---------------|-----------|-------------|-----------------|
   | Precisión conceptual | ...        | ...       | ...         | ...             |
   | Profundidad       | ...           | ...       | ...         | ...             |
   | Aplicación práctica | ...         | ...       | ...         | ...             |
   | Claridad          | ...           | ...       | ...         | ...             |
```
---

## Paso 4 — Distribución recomendada de preguntas (20 pts)
Sugerir esta distribución si el usuario no tiene preferencia:
 
| Sección                          | Pts | Tipo                   | Bloom              |
|----------------------------------|-----|------------------------|--------------------|
| Selección simple (4-5 preguntas) | 5   | Tipo 1                 | Recordar/Comprender|
| V/F (4 preguntas)                | 4   | Tipo 4                 | Recordar/Comprender|
| Completar espacios (4 preguntas) | 4   | Tipo 5                 | Aplicar            |
| Selección múltiple (1-2)         | 3   | Tipo 2                 | Analizar           |
| Caso práctico (1)                | 4   | Tipo 6                 | Evaluar/Crear      |
| **Total**                        | **20** |                     |                    |
 
> Si el usuario prefiere otra distribución, adaptar sin problema.
---
## Paso 5 — Generación de entregables
### Entregable A: Google Forms via Apps Script
Genera un script de Google Apps Script que crea el formulario automáticamente.
El usuario lo ejecuta en `script.google.com` > nuevo proyecto.
 
**Estructura del script:**
```javascript
function crearEvaluacion() {
  var form = FormApp.create('[TÍTULO DE LA EVALUACIÓN]');
  form.setDescription('[INSTRUCCIONES]');
  form.setIsQuiz(true);
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
 
  // Sección 1: [Nombre de sección]
  form.addSectionHeaderItem()
    .setTitle('SECCIÓN A: SELECCIÓN SIMPLE')
    .setHelpText('Seleccione la respuesta correcta para cada pregunta.');
  // Tipo 1 — Selección simple
  var q1 = form.addMultipleChoiceItem();
  q1.setTitle('[Enunciado de la pregunta]')
    .setChoices([
      q1.createChoice('A) [Opción A]', false),
      q1.createChoice('B) [Opción B]', true),   // correcta
      q1.createChoice('C) [Opción C]', false),
      q1.createChoice('D) [Opción D]', false)
    ])
    .setRequired(true)
    .setPoints([N]);
  // Tipo 2 — Selección múltiple
  var q2 = form.addCheckboxItem();
  q2.setTitle('[Enunciado] (Seleccione todas las que apliquen)')
    .setChoices([
      q2.createChoice('A) [Opción A]', true),
      q2.createChoice('B) [Opción B]', false),
      q2.createChoice('C) [Opción C]', true),
      q2.createChoice('D) [Opción D]', false)
    ])
    .setRequired(true)
    .setPoints([N]);
  // Tipo 3 — Respuesta abierta
  var q3 = form.addParagraphTextItem();
  q3.setTitle('[Pregunta abierta]')
    .setHelpText('Extensión esperada: [N] párrafos')
    .setRequired(true);
  // Nota: respuestas abiertas en Google Forms requieren calificación manual
  // Tipo 4 — Verdadero / Falso
  var q4 = form.addMultipleChoiceItem();
  q4.setTitle('[Enunciado V/F]')
    .setChoices([
      q4.createChoice('Verdadero', [true/false]),
      q4.createChoice('Falso', [false/true])
    ])
    .setRequired(true)
    .setPoints([N]);
  // Tipo 5 — Completar espacios
  var q5 = form.addShortAnswerItem();
  q5.setTitle('[Oración con espacio en blanco: ________]')
    .setRequired(true)
    .setPoints([N]);
  // Tipo 6 — Caso práctico (texto largo)
  form.addSectionHeaderItem()
    .setTitle('CASO PRÁCTICO')
    .setHelpText('[Descripción completa del caso]');
  var q6 = form.addParagraphTextItem();
  q6.setTitle('[Pregunta sobre el caso]')
    .setHelpText('Puntaje: [N] pts — Se evaluará con rúbrica')
    .setRequired(true);
 
  // Configuración final
  form.setConfirmationMessage('Tu evaluación ha sido enviada correctamente.');
 
  var url = form.getPublishedUrl();
  Logger.log('Formulario creado: ' + url);
  Logger.log('URL de edición: ' + form.getEditUrl());
}
```
> **Nota para el usuario**: Las preguntas de respuesta abierta y casos prácticos
> en Google Forms requieren calificación manual. El script las crea como ítems
> de texto largo sin puntuación automática.
 
Guardar como: `[CÓDIGO]-evaluacion-forms.gs` en `/mnt/user-data/outputs/`
---
### Entregable B: .docx Versión Alumno
Lee `/mnt/skills/public/docx/SKILL.md` antes de generar.
Incluir:
- Encabezado con: título, curso/lección, fecha, tiempo, puntaje total
- Instrucciones generales
- Todas las preguntas sin respuestas ni soluciones
- Espacio de respuesta adecuado para cada tipo
- Tabla de puntuación al final (para que el docente anote)
Guardar como: `[CÓDIGO]-eval-alumno.docx` en `/mnt/user-data/outputs/`
---
### Entregable C: .docx Versión Docente (con clave)
 
Misma estructura que versión alumno, más:
- Respuestas correctas marcadas en cada pregunta
- Justificación de respuestas V/F
- Rúbrica completa para preguntas abiertas y casos prácticos
- Tabla de niveles de desempeño:
| Puntaje | Nivel        | Descripción                             |
|---------|--------------|-----------------------------------------|
| 18-20   | Sobresaliente| Domina todos los objetivos              |
| 14-17   | Satisfactorio| Logra los objetivos principales         |
| 11-13   | En proceso   | Logra objetivos básicos                 |
| 0-10    | Insuficiente | No logra los objetivos mínimos          |
 
Guardar como: `[CÓDIGO]-eval-docente.docx` en `/mnt/user-data/outputs/`
---
 
## Tabla resumen de archivos generados
 
| Entregable              | Formato      | Nombre de archivo              |
|-------------------------|--------------|-------------------------------|
| Script Google Forms     | .gs          | `[CÓD]-evaluacion-forms.gs`   |
| Evaluación alumno       | .docx        | `[CÓD]-eval-alumno.docx`      |
| Evaluación docente      | .docx        | `[CÓD]-eval-docente.docx`     |
 
---
## Principios de evaluación
- **Alineamiento**: cada pregunta debe medir un objetivo de aprendizaje declarado
- **Validez**: la pregunta mide lo que dice medir — evitar preguntas trampa
- **Confiabilidad**: la respuesta correcta debe ser unívoca para sel. simple/V-F/completar
- **Gradación**: incluir preguntas de distintos niveles de dificultad
- **Proporcionalidad**: el puntaje refleja la complejidad del tipo de pregunta
- Para referencia completa de rúbricas y distribución: `references/evaluacion-guia.md`