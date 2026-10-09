---
name: course-builder
description: "Actívame con el comando /course:course-builder o cuando el usuario quiera crear, definir o documentar la ficha técnica de un curso de capacitación, e-learning o formación profesional. Esto incluye: definir el código del curso, nombre, sumilla, objetivos de aprendizaje (con taxonomía de Bloom), habilidades a desarrollar, duración, modalidad, público objetivo y prerrequisitos. También activa este skill cuando el usuario mencione \"crear un curso\", \"ficha de curso\", \"diseñar un curso\", \"sílabo\", \"sumilla\", \"objetivos de aprendizaje\", \"público objetivo\", o cuando quiera estructurar un programa de formación desde cero. Una vez completada la ficha, este skill la exporta a .docx y señala al usuario que puede continuar con lesson-builder para crear las lecciones. "
metadata:
  type: docs
  triggers:
    - /course:builder
    - course builder
    - course design
config_requirements: []
---
 
# Course Builder — Ficha Técnica del Curso
 
Este skill recopila de forma conversacional todos los datos necesarios para definir
un curso de capacitación y genera su ficha técnica oficial en formato .docx.
 
---
 
## Flujo de trabajo
 
1. Saluda e indica que vas a guiar la creación de la ficha técnica del curso
2. Recopila los datos en grupos lógicos (no todos a la vez)
3. Muestra la ficha completa formateada y pide confirmación
4. Genera el .docx y lo presenta al usuario
5. Sugiere continuar con **lesson-builder** para crear las lecciones
---
 
## Grupos de preguntas — orden sugerido
 
### Grupo 1: Identidad del curso
- **Código**: formato recomendado `CÓD-XXX` o el estándar de la organización
- **Nombre completo**: claro y descriptivo, sin abreviaciones
### Grupo 2: Descripción
- **Sumilla**: 3-5 oraciones que resuman contenido, enfoque y valor del curso
- **Modalidad**: Presencial / Virtual / Híbrida
### Grupo 3: Objetivos y habilidades
- **Objetivos de aprendizaje**: mínimo 3, máximo 6 (ver referencia Bloom abajo)
- **Habilidades a desarrollar**: técnicas y/o blandas que el participante adquirirá
### Grupo 4: Logística
- **Duración total**: en horas, indicando número de sesiones si aplica
- **Público objetivo**: perfil del participante ideal (rol, experiencia, área)
- **Prerrequisitos**: conocimientos o experiencia previa necesaria (o "Ninguno")
---
 
## Plantilla de la Ficha Técnica del Curso
 
Una vez recopilados todos los datos, presenta la ficha con este formato exacto
antes de generar el .docx:
 
```
╔══════════════════════════════════════════════════════════════════╗
║                   FICHA TÉCNICA DEL CURSO                        ║
╠══════════════════════════════════════════════════════════════════╣
║ CÓDIGO          : [CÓD-XXX]                                      ║
║ NOMBRE          : [Nombre completo del curso]                     ║
╠══════════════════════════════════════════════════════════════════╣
║ SUMILLA                                                           ║
║ [Descripción breve del curso en 3-5 oraciones]                    ║
╠══════════════════════════════════════════════════════════════════╣
║ OBJETIVOS DE APRENDIZAJE                                          ║
║ Al finalizar el curso, el participante será capaz de:             ║
║   1. [Verbo Bloom + objeto + condición]                           ║
║   2. [...]                                                        ║
║   3. [...]                                                        ║
╠══════════════════════════════════════════════════════════════════╣
║ HABILIDADES A DESARROLLAR                                         ║
║   • [Habilidad técnica o blanda]                                  ║
║   • [...]                                                         ║
╠══════════════════════════════════════════════════════════════════╣
║ DURACIÓN        : [N horas] ([N sesiones] de [N h c/u])           ║
║ MODALIDAD       : [Presencial / Virtual / Híbrida]                ║
║ PÚBLICO OBJETIVO: [Perfil del participante ideal]                 ║
║ PRERREQUISITOS  : [Conocimientos o experiencia previa]            ║
╚══════════════════════════════════════════════════════════════════╝
```
 
---
 
## Taxonomía de Bloom — referencia rápida
 
Usa verbos adecuados al nivel cognitivo que el curso busca desarrollar:
 
| Nivel      | Verbos ejemplo                                          |
|------------|---------------------------------------------------------|
| Recordar   | identificar, listar, nombrar, reconocer, definir        |
| Comprender | explicar, describir, resumir, clasificar, interpretar   |
| Aplicar    | implementar, ejecutar, usar, demostrar, configurar      |
| Analizar   | comparar, diferenciar, examinar, estructurar, analizar  |
| Evaluar    | juzgar, recomendar, justificar, priorizar, validar      |
| Crear      | diseñar, construir, desarrollar, proponer, formular     |
 
> Para referencia completa con fórmula y ejemplos: `references/bloom-taxonomy.md`
 
**Fórmula de objetivo bien redactado:**
`[Verbo infinitivo] + [objeto de la acción] + [contexto/condición]`
 
Mal: "Aprender sobre Docker"
Bien: "Implementar contenedores Docker configurando volúmenes y variables de entorno"
 
---
 
## Generación del .docx
 
Lee `/mnt/skills/public/docx/SKILL.md` antes de generar el archivo.
 
El documento debe incluir:
- Encabezado con logo de la organización (si se proporciona) y título "FICHA TÉCNICA DEL CURSO"
- Tabla principal con todos los campos de la plantilla
- Estilos: fuente Calibri, encabezados en azul `#0056a3`, tabla con bordes y sombreado alterno
- Pie de página: versión 1.0 y fecha de creación
Guardar como: `[CÓDIGO]-ficha-curso.docx` en `/mnt/user-data/outputs/`
 
---
 
## Al finalizar
 
Después de presentar el .docx, informa al usuario:
 
> "La ficha del curso está lista. Para crear las lecciones con sus materiales
> (presentaciones, guías de laboratorio e imágenes), puedes continuar con
> **lesson-builder**. Solo necesitarás indicar el código y nombre del curso."
 