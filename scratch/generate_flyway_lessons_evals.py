import os
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from pptx import Presentation
from pptx.util import Inches as PtInches, Pt as PtFont
from pptx.dml.color import RGBColor as PptRGBColor

# Color Palette Config (Blue, Black, Gray, White)
COLOR_PRIMARY_RGB = (0, 86, 163)       # Blue #0056a3
COLOR_SECONDARY_RGB = (0, 0, 0)        # Black
COLOR_TERTIARY_RGB = (128, 128, 128)   # Gray
COLOR_LIGHT_GRAY_RGB = (240, 240, 240) # Light Gray
COLOR_WHITE_RGB = (255, 255, 255)      # White

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def format_run(run, font_name="Calibri", size_pt=11, bold=False, italic=False, rgb_color=COLOR_SECONDARY_RGB):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*rgb_color)

def add_header_footer(doc, code_text, document_type="Ficha de Lección"):
    for section in doc.sections:
        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run(f"MS-FLY-101 — {code_text} | {document_type}")
        format_run(hrun, size_pt=8.5, rgb_color=COLOR_TERTIARY_RGB)
        
        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun = fp.add_run(f"Versión 1.0  |  Fecha: 2026-08-10  |  Confidencial y de Uso Interno")
        format_run(frun, size_pt=8.5, rgb_color=COLOR_TERTIARY_RGB)

def apply_table_styles(table):
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/>
        </w:tblBorders>
    ''')
    tblPr.append(tblBorders)

def add_callout(doc, text, color_hex="0056a3", bg_hex="F2F5F9"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=150, bottom=150, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="36" w:space="0" w:color="{color_hex}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(10.5)
    run.font.italic = True
    run.font.color.rgb = RGBColor(*COLOR_SECONDARY_RGB)
    
    empty_p = doc.add_paragraph()
    empty_p.paragraph_format.space_before = Pt(0)
    empty_p.paragraph_format.space_after = Pt(6)

# ==============================================================================
# DATA DEFINITIONS
# ==============================================================================
LESSONS = [
    {
        "num": 1,
        "code": "MS-FLY-101-L1",
        "title": "Fundamentos de Flyway y Configuración en Spring Boot 3.x con MySQL",
        "duration": "2 horas (120 minutos)",
        "methodology": "Combinada (Exposición Teórica, Demostración y Taller Práctico)",
        "objectives": [
            "Configurar de manera exitosa Flyway en un microservicio de Spring Boot 3.x para automatizar el aprovisionamiento de esquemas en bases de datos MySQL 5.x/8.x.",
            "Diseñar y estructurar scripts de migración versionados e incrementales aplicando de forma correcta la nomenclatura estándar de Flyway (V1__init.sql, V2__add_columns.sql).",
            "Inspeccionar y analizar los metadatos almacenados en la tabla flyway_schema_history para auditar el historial de cambios aplicados en la base de datos MySQL."
        ],
        "skills": [
            "Configuración de pipelines automatizados de migraciones de base de datos en aplicaciones Spring Boot.",
            "Diseño semántico de cambios incrementales de esquemas relacionales sin pérdida de datos.",
            "Auditoría básica de consistencia física de la base de datos mediante la tabla de historial de Flyway."
        ],
        "agenda": [
            ("1", "Introducción a Flyway y el ciclo de vida de migraciones de base de datos", "20 min"),
            ("2", "Configuración de dependencias en Spring Boot 3.x (Maven) y conexión con MySQL", "25 min"),
            ("3", "Estándar de nomenclatura y diseño de scripts SQL versionados", "25 min"),
            ("4", "Taller práctico de despliegue inicial y auditoría de la tabla flyway_schema_history", "40 min"),
            ("5", "Evaluación rápida y retrospectiva de la sesión", "10 min")
        ],
        "resources": [
            "Entorno de ejecución de Java JDK 17 o superior.",
            "Motor de base de datos MySQL 5.7 u 8.0 local o en contenedor Docker.",
            "Editor de código: IntelliJ IDEA o Visual Studio Code.",
            "Dependencia de Flyway Core e instalador de dependencias Maven.",
            "Plantilla inicial del proyecto Spring Boot 3.x proveída por el instructor."
        ],
        "lab": {
            "title": "Lab 1: Configuración de Entorno, Migración Inicial e Incremental con Flyway",
            "duration": "40 minutos",
            "objectives": [
                "Inicializar un proyecto Spring Boot 3.x con MySQL y Flyway.",
                "Escribir una migración base (V1__crear_tabla_usuarios.sql).",
                "Escribir una migración incremental (V2__crear_tabla_perfiles.sql).",
                "Validar la estructura resultante y auditar la tabla flyway_schema_history."
            ],
            "prep_steps": [
                "Iniciar un servidor local MySQL en el puerto 3306.",
                "Crear una base de datos vacía llamada 'flyway_db_l1' mediante el comando:",
                "    CREATE DATABASE flyway_db_l1;",
                "Asegurar que el archivo pom.xml del proyecto Java incluya la dependencia oficial:",
                "    <dependency>\n        <groupId>org.flywaydb</groupId>\n        <artifactId>flyway-core</artifactId>\n    </dependency>\n    <dependency>\n        <groupId>org.flywaydb</groupId>\n        <artifactId>flyway-mysql</artifactId>\n    </dependency>"
            ],
            "exercises": [
                {
                    "title": "Ejercicio 1: Configurar la Conexión de Base de Datos y Propiedades",
                    "desc": "El objetivo de este ejercicio es configurar el archivo application.yml para permitir que Spring Boot establezca conexión con MySQL y gatille Flyway automáticamente al iniciar.",
                    "steps": [
                        "Abrir el archivo src/main/resources/application.yml y agregar la siguiente configuración:",
                        "    spring:\n      datasource:\n        url: jdbc:mysql://localhost:3306/flyway_db_l1\n        username: root\n        password: <tu_password>\n      flyway:\n        enabled: true",
                        "Guardar los cambios e iniciar la aplicación. Verificar en consola el log de Flyway."
                    ],
                    "checkpoint": "✓ CHECKPOINT: En la consola deberá verse un log informativo que indica que Flyway se ha activado pero no encontró migraciones pendientes en 'db/migration'."
                },
                {
                    "title": "Ejercicio 2: Creación de la Migración Inicial de Base de Datos (V1)",
                    "desc": "Escribiremos el primer script SQL de migración en la carpeta reservada de Flyway para crear la tabla de usuarios.",
                    "steps": [
                        "Crear la estructura de directorios en resources si no existe: src/main/resources/db/migration",
                        "Crear un nuevo archivo llamado 'V1__crear_tabla_usuarios.sql' (doble guion bajo obligatorio) y escribir:",
                        "    CREATE TABLE users (\n      id BIGINT AUTO_INCREMENT PRIMARY KEY,\n      username VARCHAR(50) NOT NULL UNIQUE,\n      email VARCHAR(100) NOT NULL,\n      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    );",
                        "Correr el microservicio Spring Boot. Visualizar la terminal."
                    ],
                    "checkpoint": "✓ CHECKPOINT: En consola deberá mostrarse un log exitoso indicando: 'Successfully applied 1 migration to schema flyway_db_l1 (execution time ...)'."
                },
                {
                    "title": "Ejercicio 3: Agregar una Migración Incremental y Consultar el Historial",
                    "desc": "Simularemos el crecimiento natural del esquema del microservicio agregando una segunda migración que crea una tabla relacionada.",
                    "steps": [
                        "Crear el archivo 'V2__crear_tabla_perfiles.sql' en db/migration con la siguiente estructura:",
                        "    CREATE TABLE profiles (\n      id BIGINT AUTO_INCREMENT PRIMARY KEY,\n      user_id BIGINT NOT NULL,\n      bio TEXT,\n      avatar_url VARCHAR(255),\n      FOREIGN KEY (user_id) REFERENCES users(id)\n    );",
                        "Ejecutar de nuevo el proyecto Spring Boot.",
                        "Conectarse a MySQL mediante consola o GUI y consultar el historial ejecutando:",
                        "    SELECT * FROM flyway_schema_history;"
                    ],
                    "checkpoint": "✓ CHECKPOINT: Se deberán observar 2 registros en la tabla flyway_schema_history correspondientes a V1 y V2, mostrando el checksum de cada archivo, el autor, fecha y resultado 'SUCCESS'."
                }
            ],
            "evaluation_criteria": [
                "Configuración correcta del datasource en application.yml.",
                "Estructura física de MySQL alineada con las migraciones aplicadas de forma exitosa.",
                "Tabla de metadatos de Flyway correctamente poblada y auditada."
            ]
        },
        "quiz": {
            "title": "Evaluación Formativa - Lección 1",
            "time": "15 minutos",
            "score": "20 puntos",
            "questions": [
                {
                    "type": "simple",
                    "enunciado": "¿Cuál es el patrón correcto de nomenclatura de Flyway para una migración versionada básica que crea la tabla de órdenes?",
                    "options": [
                        "A) V1_crear_ordenes.sql",
                        "B) V1__crear_ordenes.sql",
                        "C) V1.crear_ordenes.sql",
                        "D) v1_crear_ordenes.sql"
                    ],
                    "correct": "B",
                    "justification": "Flyway exige que el prefijo 'V' vaya seguido de la versión, y después un doble guion bajo '__' como separador para la descripción del script.",
                    "pts": 5
                },
                {
                    "type": "vf",
                    "enunciado": "La tabla 'flyway_schema_history' es generada de forma automática por Flyway en la base de datos al correr la primera migración.",
                    "correct": "V",
                    "justification": "Verdadero. Al arrancar Flyway, este busca si existe dicha tabla de metadatos. Si no está presente, la crea antes de ejecutar la primera migración pendiente.",
                    "pts": 5
                },
                {
                    "type": "completar",
                    "enunciado": "Para desactivar temporalmente el inicio de Flyway en el arranque de la aplicación Spring Boot se debe configurar la propiedad 'spring.flyway.enabled' con el valor ________.",
                    "correct": "false",
                    "pts": 5
                },
                {
                    "type": "multiple",
                    "enunciado": "¿Qué dependencias son estrictamente necesarias en un archivo pom.xml para que Flyway pueda operar sobre una base de datos MySQL en Spring Boot 3.x? (Seleccione todas las que apliquen)",
                    "options": [
                        "☐ A) flyway-core",
                        "☐ B) flyway-mysql (o dependencias de compatibilidad de base de datos)",
                        "☐ C) spring-boot-starter-web",
                        "☐ D) mysql-connector-j"
                    ],
                    "correct": "ABD",
                    "pts": 5
                }
            ]
        }
    },
    {
        "num": 2,
        "code": "MS-FLY-101-L2",
        "title": "Flyway en Ecosistemas Spring Cloud: Alta Disponibilidad, Concurrencia y Resolución de Conflictos",
        "duration": "2 horas (120 minutos)",
        "methodology": "Combinada (Análisis de Casos de Negocio, Demostración y Laboratorio de Reparación)",
        "objectives": [
            "Implementar estrategias seguras de migración concurrentes evitando el bloqueo de instancias paralelas de microservicios escalados con Spring Cloud.",
            "Diseñar migraciones repetibles (Repeatable Migrations) para vistas o procedimientos MySQL, asegurando que se actualicen ante cada modificación del archivo fuente.",
            "Diagnosticar y reparar fallos de checksums y metadatos corruptos utilizando comandos de reparación (flyway.repair) de forma controlada."
        ],
        "skills": [
            "Configuración y optimización de Flyway ante alta concurrencia de instancias en Cloud.",
            "Mantenimiento declarativo de lógica de base de datos relacional (vistas y SP) mediante migraciones repetibles.",
            "Diagnóstico veloz y reparación de inconsistencias de metadatos de despliegue."
        ],
        "agenda": [
            ("1", "Análisis de problemas en entornos de alta disponibilidad (escalado horizontal e hilos de inicio)", "25 min"),
            ("2", "Diseño de migraciones repetibles (R__...) frente a migraciones versionadas (V__...)", "25 min"),
            ("3", "Fórmula de colisiones de checksum, modificaciones manuales de scripts y comandos de reparación", "30 min"),
            ("4", "Taller práctico: Reparación de base de datos tras mismatch de checksum y creación de vista repetible", "35 min"),
            ("5", "Retrospectiva y preguntas de cierre de la lección", "5 min")
        ],
        "resources": [
            "Entorno local de desarrollo configurado en Lección 1.",
            "Contenedor local MySQL 5.x/8.x.",
            "Librerías Spring Cloud configuradas o simuladas mediante levantamiento concurrente.",
            "Editor de código e intérprete de comandos SQL."
        ],
        "lab": {
            "title": "Lab 2: Migraciones Repetibles, Simulación de Mismatch de Checksum y flyway.repair()",
            "duration": "35 minutos",
            "objectives": [
                "Crear una migración repetible de vista de base de datos (R__crear_vista_usuarios.sql).",
                "Simular manualmente una alteración de script ya aplicado y generar un error de Checksum Mismatch en Spring Boot.",
                "Implementar la reparación controlada mediante el comando repair de Flyway en Spring Boot."
            ],
            "prep_steps": [
                "Crear una base de datos vacía llamada 'flyway_db_l2'.",
                "Configurar un nuevo proyecto o reutilizar la base del anterior apuntando la conexión del application.yml a flyway_db_l2.",
                "Asegurar que existan los archivos de migración inicial de la Lección 1 (V1__crear_tabla_usuarios.sql)."
            ],
            "exercises": [
                {
                    "title": "Ejercicio 1: Implementar una Vista usando Migración Repetible (Repeatable Migration)",
                    "desc": "Las migraciones repetibles se ejecutan cada vez que su checksum cambia. Son ideales para vistas o funciones que cambian continuamente en el ciclo de vida.",
                    "steps": [
                        "Crear el archivo 'R__crear_vista_usuarios_activos.sql' (prefijo R__ obligatorio) en db/migration:",
                        "    CREATE OR REPLACE VIEW active_users AS\n    SELECT username, email FROM users WHERE created_at IS NOT NULL;",
                        "Correr la aplicación. Verificar en consola que se ejecuta correctamente.",
                        "Modificar el archivo 'R__crear_vista_usuarios_activos.sql' agregando un campo adicional:",
                        "    CREATE OR REPLACE VIEW active_users AS\n    SELECT id, username, email FROM users WHERE created_at IS NOT NULL;",
                        "Correr nuevamente la aplicación."
                    ],
                    "checkpoint": "✓ CHECKPOINT: En el segundo arranque se verá que Flyway detecta el cambio en R__crear_vista_usuarios_activos.sql y lo re-ejecuta de forma automática sin errores."
                },
                {
                    "title": "Ejercicio 2: Simulación de Error de Checksum Mismatch",
                    "desc": "Este es el problema más común en producción cuando un desarrollador modifica un script SQL versionado que ya fue desplegado previamente.",
                    "steps": [
                        "Asegurarse de que 'V1__crear_tabla_usuarios.sql' ya corrió.",
                        "Abrir el archivo 'V1__crear_tabla_usuarios.sql' y agregar un comentario o modificar el tamaño de username de 50 a 60:",
                        "    username VARCHAR(60) NOT NULL UNIQUE,",
                        "Tratar de arrancar el microservicio Spring Boot."
                    ],
                    "checkpoint": "❌ ERROR FRECUENTE: La aplicación fallará en el arranque lanzando un mensaje similar a:\n'Migration checksum mismatch for migration version 1\n-> Applied to database : 123456789\n-> Resolved locally    : 987654321'"
                },
                {
                    "title": "Ejercicio 3: Reparación Controlada de Flyway mediante Configuración",
                    "desc": "Resolveremos el mismatch de checksum forzando a Flyway a recalcular el hash local de los archivos y alinearlo con la tabla de historial.",
                    "steps": [
                        "Para no dejar activa la configuración en producción permanentemente, habilitaremos temporalmente la opción de reparación en la configuración local de desarrollo.",
                        "Configurar en application.yml de forma temporal:",
                        "    spring:\n      flyway:\n        repair-on-migrate: true",
                        "Iniciar el microservicio Spring Boot.",
                        "Revisar el log de consola.",
                        "Una vez que el proyecto arranque de forma exitosa, retirar la propiedad 'repair-on-migrate' o setearla de nuevo en 'false' para evitar ocultar problemas futuros."
                    ],
                    "checkpoint": "✓ CHECKPOINT: En consola se verá un mensaje indicando que se reparó exitosamente el checksum de la versión 1 en la tabla flyway_schema_history y la aplicación iniciará sin colapsar."
                }
            ],
            "evaluation_criteria": [
                "Creación y actualización sin fricción de vistas de base de datos mediante scripts repetibles (R__).",
                "Diagnóstico acertado de colisiones de hash a nivel de consola de logs.",
                "Estrategia de resolución de fallos mediante el mecanismo repair-on-migrate de Flyway."
            ]
        },
        "quiz": {
            "title": "Evaluación Formativa - Lección 2",
            "time": "15 minutos",
            "score": "20 puntos",
            "questions": [
                {
                    "type": "simple",
                    "enunciado": "¿Qué tipo de migración en Flyway NO lleva una versión en su nombre y es ejecutada por el motor cada vez que detecta un cambio en el contenido del script SQL local?",
                    "options": [
                        "A) Migración Versionada (V)",
                        "B) Migración Deshacer (U)",
                        "C) Migración Repetible (R)",
                        "D) Migración Incremental (I)"
                    ],
                    "correct": "C",
                    "justification": "Las migraciones repetibles (prefijo 'R') no tienen una versión fija y se ejecutan cada vez que su checksum local cambia en comparación con el registrado en base de datos.",
                    "pts": 5
                },
                {
                    "type": "vf",
                    "enunciado": "La propiedad 'spring.flyway.repair-on-migrate: true' recalculará automáticamente las firmas hash locales y actualizará el historial para resolver inconsistencias de checksums.",
                    "correct": "V",
                    "justification": "Verdadero. Al habilitarse la propiedad de reparación, Flyway reconstruye las firmas de la tabla flyway_schema_history alineándolas con los archivos SQL disponibles en el classpath local.",
                    "pts": 5
                },
                {
                    "type": "completar",
                    "enunciado": "En arquitecturas de microservicios altamente distribuidas con autoescalado concurrente, para evitar colisiones de inicio en bases de datos compartidas se debe utilizar el mecanismo de bloqueo de base de datos que Flyway implementa internamente, también conocido como ________ lock.",
                    "correct": "database",
                    "pts": 5
                },
                {
                    "type": "multiple",
                    "enunciado": "Frente a un fallo de checksum provocado por cambios accidentales de sintaxis o espacios en un script V1 ya desplegado, ¿cuáles son soluciones aceptables? (Seleccione todas las que apliquen)",
                    "options": [
                        "☐ A) Correr un comando de reparación ('flyway.repair()') mediante API, Maven o habilitando la configuración correspondiente de Spring Boot.",
                        "☐ B) Borrar manualmente la base de datos de producción y recrear el historial completo.",
                        "☐ C) Modificar manualmente el campo de checksum correspondiente a V1 en la tabla flyway_schema_history para igualar el valor esperado local.",
                        "☐ D) Volver a formatear el archivo local V1 exactamente igual a como estaba cuando se ejecutó en base de datos."
                    ],
                    "correct": "AD",
                    "pts": 5
                }
            ]
        }
    }
]

FINAL_COURSE_EVALUATION = {
    "title": "Evaluación Final Integradora - Flyway en Microservicios",
    "time": "30 minutos",
    "score": "20 puntos",
    "questions": [
        {
            "type": "simple",
            "enunciado": "En un entorno Spring Boot, ¿qué ocurre si el checksum local de un script de migración versionada 'V1__init.sql' difiere del valor almacenado en la tabla 'flyway_schema_history'?",
            "options": [
                "A) Flyway ignora el cambio y continúa la migración con los siguientes scripts.",
                "B) Flyway sobrescribe automáticamente la base de datos aplicando la nueva versión del script.",
                "C) Flyway detiene el inicio de la aplicación arrojando un error de Checksum Mismatch en el arranque.",
                "D) Flyway calcula una nueva versión V2 automáticamente basándose en los cambios locales."
            ],
            "correct": "C",
            "justification": "Por seguridad del esquema de producción, Flyway detiene la inicialización de la aplicación lanzando una excepción si un archivo versionado previamente desplegado ha sufrido variaciones.",
            "pts": 4
        },
        {
            "type": "vf",
            "enunciado": "Las migraciones de deshacer (Undo migrations, prefijo 'U') están habilitadas de forma predeterminada en la versión comunitaria (Community Edition) de Flyway.",
            "correct": "F",
            "justification": "Falso. Las migraciones de deshacer u 'Undo migrations' (prefijo 'U') pertenecen a las características avanzadas disponibles únicamente en las ediciones pagas de Flyway (Teams/Enterprise Edition).",
            "pts": 4
        },
        {
            "type": "completar",
            "enunciado": "El comando que se utiliza para sincronizar los checksums locales y solucionar el estado fallido de una migración alterada en el historial de Flyway se denomina ________.",
            "correct": "repair",
            "pts": 4
        },
        {
            "type": "multiple",
            "enunciado": "Al diseñar un pipeline de despliegue automatizado (CI/CD) para microservicios que utilizan base de datos por microservicio (Database-per-Microservice), ¿cuáles son las recomendaciones ideales de configuración? (Seleccione todas las que apliquen)",
            "options": [
                "☐ A) Habilitar la ejecución automática de Flyway en el arranque del microservicio únicamente en entornos locales y de desarrollo.",
                "☐ B) Compartir una única tabla flyway_schema_history para todos los microservicios del ecosistema dentro de una única base de datos central.",
                "☐ C) Utilizar scripts independientes y bases de datos aisladas para cada microservicio garantizando el desacoplamiento total.",
                "☐ D) En producción, preferir la ejecución de migraciones fuera del arranque de la app (ej. como un Job de Kubernetes) para reducir riesgos de bloqueos concurrentes."
            ],
            "correct": "ACD",
            "pts": 4
        },
        {
            "type": "caso",
            "title": "Caso Práctico: Despliegue de Microservicio en Cluster Kubernetes y Bloqueo Concurrente",
            "desc": (
                "Escenario: El equipo de ingeniería despliega el microservicio 'orders-service' en un clúster Kubernetes utilizando autoescalado horizontal (HPA) con un mínimo de 5 réplicas paralelas de inicio.\n"
                "La base de datos MySQL 8 es compartida únicamente por estas réplicas (esquema aislado por servicio). "
                "Durante el despliegue del fin de semana, que incluye la creación de índices grandes en un script de migración versionado 'V5__add_indexes.sql', se observa que las 5 réplicas de Spring Boot arrancan simultáneamente. "
                "Tres réplicas se cierran repentinamente con errores de bloqueo de base de datos, mientras que una réplica reporta una migración fallida en el historial, impidiendo que el servicio se estabilice."
            ),
            "questions": [
                "1. Explique cuál fue el problema original y cómo interactuó la concurrencia de inicios de Spring Boot con el sistema de locks de Flyway.\n"
                "2. Proponga una estrategia de solución inmediata para reparar el historial y una arquitectura recomendada para evitar este problema en futuros despliegues automatizados de alta disponibilidad."
            ],
            "pts": 4,
            "rubric": {
                "Excelente (4 pts)": "Identifica con precisión el problema de concurrencia e hilos de inicio tratando de alterar el esquema a la vez. Propone el uso de 'repair' o limpieza controlada en la base de datos de forma inmediata y, para el futuro, sugiere desacoplar las migraciones del arranque del pod mediante un Kubernetes Init Container, un Job dedicado o habilitando los locks a nivel de base de datos de Flyway de forma robusta.",
                "Bueno (3 pts)": "Describe adecuadamente el conflicto de concurrencia y el bloqueo en la tabla de historial. Propone reparar la tabla de forma manual y realizar el arranque secuencial como plan futuro.",
                "Regular (2 pts)": "Menciona que hubo un choque en base de datos pero no explica el mecanismo de locks de Flyway. Recomienda desactivar Flyway en producción.",
                "Insuficiente (1 pt)": "No detecta la causa del bloqueo ni propone soluciones coherentes con el entorno de Spring Cloud / Kubernetes."
            }
        }
    ]
}

# ==============================================================================
# DOCUMENT GENERATION LOGIC
# ==============================================================================
def create_all_course_materials(base_dir):
    os.makedirs(base_dir, exist_ok=True)
    print(f"Directorio de salida: {base_dir}")
    
    for l in LESSONS:
        print(f"\n--- Creando materiales para Lección {l['num']}: {l['title']} ---")
        
        # 1. FICHA TÉCNICA DE LECCIÓN (.docx)
        ficha_path = os.path.join(base_dir, f"{l['code']}-ficha.docx")
        doc_f = Document()
        for s in doc_f.sections:
            s.top_margin = Inches(1.0)
            s.bottom_margin = Inches(1.0)
            s.left_margin = Inches(1.0)
            s.right_margin = Inches(1.0)
        add_header_footer(doc_f, l['code'], "Ficha de Lección")
        
        # Title
        p_title = doc_f.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_title.paragraph_format.space_before = Pt(12)
        p_title.paragraph_format.space_after = Pt(24)
        r_title = p_title.add_run("FICHA TÉCNICA DE LECCIÓN")
        format_run(r_title, size_pt=20, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        
        # Table info
        table = doc_f.add_table(rows=6, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        apply_table_styles(table)
        
        info_data = [
            ("CURSO", "MS-FLY-101 — Control de Versiones con Flyway en Microservicios"),
            ("LECCIÓN N°", f"{l['num']} de 2"),
            ("CÓDIGO", l['code']),
            ("TÍTULO", l['title']),
            ("DURACIÓN", l['duration']),
            ("METODOLOGÍA", l['methodology'])
        ]
        
        col_widths = [Inches(2.0), Inches(4.5)]
        for idx, (lbl, val) in enumerate(info_data):
            row = table.rows[idx]
            # label cell
            c_lbl = row.cells[0]
            c_lbl.width = col_widths[0]
            set_cell_background(c_lbl, "0056a3")
            set_cell_margins(c_lbl, top=100, bottom=100, left=150, right=150)
            p_lbl = c_lbl.paragraphs[0]
            r_lbl = p_lbl.add_run(lbl)
            format_run(r_lbl, size_pt=9.5, bold=True, rgb_color=COLOR_WHITE_RGB)
            
            # value cell
            c_val = row.cells[1]
            c_val.width = col_widths[1]
            set_cell_background(c_val, "FFFFFF" if idx % 2 == 0 else "F9F9F9")
            set_cell_margins(c_val, top=100, bottom=100, left=150, right=150)
            p_val = c_val.paragraphs[0]
            r_val = p_val.add_run(val)
            format_run(r_val, size_pt=10, rgb_color=COLOR_SECONDARY_RGB)
            
        doc_f.add_paragraph().paragraph_format.space_after = Pt(12)
        
        # Section Objectives
        h_obj = doc_f.add_paragraph()
        r_h_obj = h_obj.add_run("OBJETIVOS DE LA LECCIÓN")
        format_run(r_h_obj, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h_obj.paragraph_format.space_before = Pt(12)
        h_obj.paragraph_format.space_after = Pt(6)
        
        for obj in l['objectives']:
            p_b = doc_f.add_paragraph(style='List Bullet')
            p_b.paragraph_format.space_after = Pt(4)
            p_b.paragraph_format.left_indent = Inches(0.4)
            r_b = p_b.add_run(obj)
            format_run(r_b, size_pt=10.5)
            
        doc_f.add_paragraph().paragraph_format.space_after = Pt(12)
        
        # Section Skills
        h_sk = doc_f.add_paragraph()
        r_h_sk = h_sk.add_run("HABILIDADES A DESARROLLAR")
        format_run(r_h_sk, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h_sk.paragraph_format.space_before = Pt(12)
        h_sk.paragraph_format.space_after = Pt(6)
        
        for sk in l['skills']:
            p_b = doc_f.add_paragraph(style='List Bullet')
            p_b.paragraph_format.space_after = Pt(4)
            p_b.paragraph_format.left_indent = Inches(0.4)
            r_b = p_b.add_run(sk)
            format_run(r_b, size_pt=10.5)
            
        doc_f.add_paragraph().paragraph_format.space_after = Pt(12)
        
        # Section Agenda
        h_ag = doc_f.add_paragraph()
        r_h_ag = h_ag.add_run("AGENDA DE LA SESIÓN")
        format_run(r_h_ag, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h_ag.paragraph_format.space_before = Pt(12)
        h_ag.paragraph_format.space_after = Pt(6)
        
        ag_table = doc_f.add_table(rows=len(l['agenda'])+1, cols=3)
        ag_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        apply_table_styles(ag_table)
        
        headers = ["ID", "Tema o Actividad de Aprendizaje", "Duración"]
        col_widths_ag = [Inches(0.6), Inches(4.7), Inches(1.2)]
        
        # Header Row
        hdr_row = ag_table.rows[0]
        for j, h_name in enumerate(headers):
            cell = hdr_row.cells[j]
            cell.width = col_widths_ag[j]
            set_cell_background(cell, "0056a3")
            set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j != 1 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(h_name)
            format_run(r, size_pt=10, bold=True, rgb_color=COLOR_WHITE_RGB)
            
        # Content Rows
        for i, (theme_id, theme_name, theme_dur) in enumerate(l['agenda']):
            row = ag_table.rows[i+1]
            data = [theme_id, theme_name, theme_dur]
            for j, val in enumerate(data):
                cell = row.cells[j]
                cell.width = col_widths_ag[j]
                set_cell_background(cell, "FFFFFF" if i % 2 == 0 else "F9F9F9")
                set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j != 1 else WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(val)
                format_run(r, size_pt=9.5, rgb_color=COLOR_SECONDARY_RGB)
                
        doc_f.add_paragraph().paragraph_format.space_after = Pt(12)
        
        # Section Resources
        h_res = doc_f.add_paragraph()
        r_h_res = h_res.add_run("RECURSOS REQUERIDOS")
        format_run(r_h_res, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h_res.paragraph_format.space_before = Pt(12)
        h_res.paragraph_format.space_after = Pt(6)
        
        for res in l['resources']:
            p_b = doc_f.add_paragraph(style='List Bullet')
            p_b.paragraph_format.space_after = Pt(4)
            p_b.paragraph_format.left_indent = Inches(0.4)
            r_b = p_b.add_run(res)
            format_run(r_b, size_pt=10.5)
            
        doc_f.save(ficha_path)
        print(f"Ficha técnica guardada: {ficha_path}")
        
        # 2. PRESENTACIÓN PPT (.pptx)
        ppt_path = os.path.join(base_dir, f"{l['code']}-presentacion.pptx")
        prs = Presentation()
        prs.slide_width = PtInches(13.333) # 16:9
        prs.slide_height = PtInches(7.5)
        blank_layout = prs.slide_layouts[6]
        
        # Cover Slide
        slide_cover = prs.slides.add_slide(blank_layout)
        # Blue Header Band
        shape_band = slide_cover.shapes.add_shape(1, 0, 0, prs.slide_width, PtInches(1.8))
        shape_band.fill.solid()
        shape_band.fill.fore_color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
        shape_band.line.fill.background()
        
        tx_box = slide_cover.shapes.add_textbox(PtInches(0.8), PtInches(2.2), PtInches(11.7), PtInches(3.5))
        tf = tx_box.text_frame
        tf.word_wrap = True
        
        p_t = tf.paragraphs[0]
        p_t.text = l['title']
        p_t.font.name = "Calibri"
        p_t.font.size = PtFont(36)
        p_t.font.bold = True
        p_t.font.color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
        p_t.space_after = PtFont(16)
        
        p_sub = tf.add_paragraph()
        p_sub.text = f"MICROSERVICIOS Y SPRING BOOT/CLOUD — LECCIÓN {l['num']}"
        p_sub.font.name = "Calibri"
        p_sub.font.size = PtFont(16)
        p_sub.font.bold = True
        p_sub.font.color.rgb = PptRGBColor(*COLOR_SECONDARY_RGB)
        p_sub.space_after = PtFont(24)
        
        p_foot = tf.add_paragraph()
        p_foot.text = f"Código: {l['code']} | Duración: {l['duration']}"
        p_foot.font.name = "Calibri"
        p_foot.font.size = PtFont(13)
        p_foot.font.italic = True
        p_foot.font.color.rgb = PptRGBColor(*COLOR_TERTIARY_RGB)
        
        # Slides of topics
        slides_data = [
            {
                "title": "Agenda de la Sesión",
                "bullets": [f"{theme_name} [{theme_dur}]" for _, theme_name, theme_dur in l['agenda']]
            },
            {
                "title": "Objetivos de Aprendizaje",
                "bullets": l['objectives']
            },
            {
                "title": "Habilidades a Desarrollar",
                "bullets": l['skills']
            },
            {
                "title": "Prerrequisitos y Recursos",
                "bullets": l['resources']
            }
        ]
        
        for sd in slides_data:
            slide = prs.slides.add_slide(blank_layout)
            # Left accent bar in blue
            shape_bar = slide.shapes.add_shape(1, 0, 0, PtInches(0.4), prs.slide_height)
            shape_bar.fill.solid()
            shape_bar.fill.fore_color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
            shape_bar.line.fill.background()
            
            # Title
            t_box = slide.shapes.add_textbox(PtInches(0.8), PtInches(0.5), PtInches(11.7), PtInches(1.2))
            tf_t = t_box.text_frame
            tf_t.word_wrap = True
            p = tf_t.paragraphs[0]
            p.text = sd["title"]
            p.font.name = "Calibri"
            p.font.size = PtFont(32)
            p.font.bold = True
            p.font.color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
            
            # Bullets
            b_box = slide.shapes.add_textbox(PtInches(1.0), PtInches(1.8), PtInches(11.3), PtInches(5.0))
            tf_b = b_box.text_frame
            tf_b.word_wrap = True
            for idx, bullet in enumerate(sd["bullets"]):
                if idx == 0:
                    p_b = tf_b.paragraphs[0]
                else:
                    p_b = tf_b.add_paragraph()
                p_b.text = "• " + bullet
                p_b.font.name = "Calibri"
                p_b.font.size = PtFont(15)
                p_b.font.color.rgb = PptRGBColor(*COLOR_SECONDARY_RGB)
                p_b.space_after = PtFont(12)
                p_b.level = 0
                
        prs.save(ppt_path)
        print(f"Presentación PPT guardada: {ppt_path}")
        
        # 3. GUÍA DE LABORATORIO (.docx)
        lab_path = os.path.join(base_dir, f"{l['code']}-lab.docx")
        doc_l = Document()
        for s in doc_l.sections:
            s.top_margin = Inches(1.0)
            s.bottom_margin = Inches(1.0)
            s.left_margin = Inches(1.0)
            s.right_margin = Inches(1.0)
        add_header_footer(doc_l, l['code'], "Guía de Lab")
        
        # Title
        p_title = doc_l.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_title.paragraph_format.space_before = Pt(12)
        p_title.paragraph_format.space_after = Pt(24)
        r_title = p_title.add_run(l['lab']['title'].upper())
        format_run(r_title, size_pt=18, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        
        # Lab Info Table
        table = doc_l.add_table(rows=4, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        apply_table_styles(table)
        
        lab_info = [
            ("CÓDIGO DE LECCIÓN", l['code']),
            ("TÍTULO LECCIÓN", l['title']),
            ("DURACIÓN ESTIMADA", l['lab']['duration']),
            ("VERSIÓN / FECHA", "1.0  /  2026-08-10")
        ]
        col_widths_lab = [Inches(2.2), Inches(4.3)]
        for idx, (lbl, val) in enumerate(lab_info):
            row = table.rows[idx]
            cell_lbl = row.cells[0]
            cell_lbl.width = col_widths_lab[0]
            set_cell_background(cell_lbl, "000000") # Black label for labs
            set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
            p_lbl = cell_lbl.paragraphs[0]
            r_lbl = p_lbl.add_run(lbl)
            format_run(r_lbl, size_pt=9, bold=True, rgb_color=COLOR_WHITE_RGB)
            
            cell_val = row.cells[1]
            cell_val.width = col_widths_lab[1]
            set_cell_background(cell_val, "FFFFFF" if idx % 2 == 0 else "F9F9F9")
            set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)
            p_val = cell_val.paragraphs[0]
            r_val = p_val.add_run(val)
            format_run(r_val, size_pt=9.5, rgb_color=COLOR_SECONDARY_RGB)
            
        doc_l.add_paragraph().paragraph_format.space_after = Pt(12)
        
        # 1. OBJETIVOS DEL LABORATORIO
        h1 = doc_l.add_paragraph()
        r_h1 = h1.add_run("1. OBJETIVOS DEL LABORATORIO")
        format_run(r_h1, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h1.paragraph_format.space_before = Pt(12)
        h1.paragraph_format.space_after = Pt(6)
        
        for obj in l['lab']['objectives']:
            p_b = doc_l.add_paragraph(style='List Bullet')
            p_b.paragraph_format.space_after = Pt(4)
            p_b.paragraph_format.left_indent = Inches(0.4)
            r_b = p_b.add_run(obj)
            format_run(r_b, size_pt=10)
            
        doc_l.add_paragraph().paragraph_format.space_after = Pt(6)
        
        # 2. ENTORNO Y REQUISITOS TÉCNICOS
        h2 = doc_l.add_paragraph()
        r_h2 = h2.add_run("2. ENTORNO Y REQUISITOS TÉCNICOS")
        format_run(r_h2, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h2.paragraph_format.space_before = Pt(12)
        h2.paragraph_format.space_after = Pt(6)
        
        p_env = doc_l.add_paragraph()
        r_env = p_env.add_run("Para completar este laboratorio de forma exitosa, el estudiante requiere:")
        format_run(r_env, size_pt=10, italic=True)
        p_env.paragraph_format.space_after = Pt(6)
        
        for item in l['resources']:
            p_b = doc_l.add_paragraph(style='List Bullet')
            p_b.paragraph_format.space_after = Pt(4)
            p_b.paragraph_format.left_indent = Inches(0.4)
            r_b = p_b.add_run(item)
            format_run(r_b, size_pt=10)
            
        doc_l.add_paragraph().paragraph_format.space_after = Pt(6)
        
        # 3. PREPARACIÓN DEL ENTORNO
        h3 = doc_l.add_paragraph()
        r_h3 = h3.add_run("3. PREPARACIÓN DEL ENTORNO")
        format_run(r_h3, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h3.paragraph_format.space_before = Pt(12)
        h3.paragraph_format.space_after = Pt(6)
        
        for step in l['lab']['prep_steps']:
            if step.strip().startswith("CREATE") or step.strip().startswith("<dependency>"):
                p_code = doc_l.add_paragraph()
                p_code.paragraph_format.left_indent = Inches(0.6)
                p_code.paragraph_format.space_after = Pt(4)
                r_c = p_code.add_run(step)
                format_run(r_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
            else:
                p_step = doc_l.add_paragraph(style='List Number')
                p_step.paragraph_format.space_after = Pt(4)
                p_step.paragraph_format.left_indent = Inches(0.4)
                r_s = p_step.add_run(step)
                format_run(r_s, size_pt=10)
                
        doc_l.add_paragraph().paragraph_format.space_after = Pt(6)
        
        # 4. EJERCICIOS Y PASOS DE EJECUCIÓN
        h4 = doc_l.add_paragraph()
        r_h4 = h4.add_run("4. EJERCICIOS Y PASOS DE EJECUCIÓN")
        format_run(r_h4, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h4.paragraph_format.space_before = Pt(12)
        h4.paragraph_format.space_after = Pt(6)
        
        for ex in l['lab']['exercises']:
            p_ex = doc_l.add_paragraph()
            r_ex = p_ex.add_run(ex['title'])
            format_run(r_ex, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
            p_ex.paragraph_format.space_before = Pt(8)
            p_ex.paragraph_format.space_after = Pt(4)
            
            p_desc = doc_l.add_paragraph()
            r_desc = p_desc.add_run(ex['desc'])
            format_run(r_desc, size_pt=10)
            p_desc.paragraph_format.space_after = Pt(6)
            
            for step in ex['steps']:
                if step.strip().startswith("spring:") or step.strip().startswith("CREATE") or step.strip().startswith("username"):
                    p_code = doc_l.add_paragraph()
                    p_code.paragraph_format.left_indent = Inches(0.6)
                    p_code.paragraph_format.space_after = Pt(4)
                    r_c = p_code.add_run(step)
                    format_run(r_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
                else:
                    p_step = doc_l.add_paragraph(style='List Number')
                    p_step.paragraph_format.space_after = Pt(4)
                    p_step.paragraph_format.left_indent = Inches(0.4)
                    r_s = p_step.add_run(step)
                    format_run(r_s, size_pt=10)
                    
            add_callout(doc_l, ex['checkpoint'])
            
        doc_l.add_paragraph().paragraph_format.space_after = Pt(12)
        
        # 5. EVALUACIÓN Y CRITERIOS
        h5 = doc_l.add_paragraph()
        r_h5 = h5.add_run("5. EVALUACIÓN DE DESEMPEÑO")
        format_run(r_h5, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h5.paragraph_format.space_before = Pt(12)
        h5.paragraph_format.space_after = Pt(6)
        
        for cr in l['lab']['evaluation_criteria']:
            p_b = doc_l.add_paragraph(style='List Bullet')
            p_b.paragraph_format.space_after = Pt(4)
            p_b.paragraph_format.left_indent = Inches(0.4)
            r_b = p_b.add_run(cr)
            format_run(r_b, size_pt=10)
            
        doc_l.save(lab_path)
        print(f"Guía de lab guardada: {lab_path}")
        
        # 4. EVALUACIONES (.docx ALUMNO, .docx DOCENTE, .gs FORMS)
        generate_quizzes(base_dir, l['code'], l['title'], l['quiz'], is_final=False)

    # 5. EVALUACIÓN FINAL INTEGRADORA
    print("\n--- Creando evaluación final integradora del curso ---")
    generate_quizzes(base_dir, "MS-FLY-101-FINAL", "Evaluación Final Integradora — Flyway en Microservicios", FINAL_COURSE_EVALUATION, is_final=True)

# ==============================================================================
# QUIZ GENERATION HELPER
# ==============================================================================
def generate_quizzes(base_dir, prefix, title_context, quiz_data, is_final=False):
    # Output file paths
    alumno_path = os.path.join(base_dir, f"{prefix}-eval-alumno.docx")
    docente_path = os.path.join(base_dir, f"{prefix}-eval-docente.docx")
    forms_path = os.path.join(base_dir, f"{prefix}-evaluacion-forms.gs")
    
    # 1. ALUMNO DOCX
    doc_a = Document()
    setup_quiz_docx(doc_a, prefix, title_context, quiz_data, teacher_version=False, is_final=is_final)
    doc_a.save(alumno_path)
    print(f"Evaluación Alumno guardada: {alumno_path}")
    
    # 2. DOCENTE DOCX
    doc_d = Document()
    setup_quiz_docx(doc_d, prefix, title_context, quiz_data, teacher_version=True, is_final=is_final)
    doc_d.save(docente_path)
    print(f"Evaluación Docente guardada: {docente_path}")
    
    # 3. GOOGLE FORMS APPS SCRIPT
    gs_content = generate_apps_script(prefix, quiz_data)
    with open(forms_path, "w", encoding="utf-8") as f:
        f.write(gs_content)
    print(f"Apps Script para Google Forms guardado: {forms_path}")

def setup_quiz_docx(doc, prefix, title_context, quiz_data, teacher_version=False, is_final=False):
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
    add_header_footer(doc, prefix, "Evaluación Docente" if teacher_version else "Evaluación Alumno")
    
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(24)
    v_str = " (VERSIÓN DOCENTE - SOLUCIONARIO)" if teacher_version else " (VERSIÓN ALUMNO)"
    r_title = p_title.add_run(f"{quiz_data['title'].upper()}{v_str}")
    format_run(r_title, size_pt=16, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    # Header Info Table
    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_table_styles(table)
    
    info_data = [
        ("CURSO / TÍTULO", title_context),
        ("TIEMPO ESTIMADO", quiz_data['time']),
        ("PUNTAJE MÁXIMO", quiz_data['score']),
        ("INSTRUCCIONES", "Lea atentamente cada enunciado y responda marcando o redactando según el tipo de pregunta.")
    ]
    col_widths = [Inches(2.2), Inches(4.3)]
    for idx, (lbl, val) in enumerate(info_data):
        row = table.rows[idx]
        cell_lbl = row.cells[0]
        cell_lbl.width = col_widths[0]
        set_cell_background(cell_lbl, "0056a3")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        p_lbl = cell_lbl.paragraphs[0]
        r_lbl = p_lbl.add_run(lbl)
        format_run(r_lbl, size_pt=9, bold=True, rgb_color=COLOR_WHITE_RGB)
        
        cell_val = row.cells[1]
        cell_val.width = col_widths[1]
        set_cell_background(cell_val, "FFFFFF" if idx % 2 == 0 else "F9F9F9")
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)
        p_val = cell_val.paragraphs[0]
        r_val = p_val.add_run(val)
        format_run(r_val, size_pt=9.5, rgb_color=COLOR_SECONDARY_RGB)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(18)
    
    # Questions
    for i, q in enumerate(quiz_data['questions']):
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(12)
        p_q.paragraph_format.space_after = Pt(6)
        
        # Format Question title and points
        r_q_num = p_q.add_run(f"Pregunta {i+1}: ")
        format_run(r_q_num, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        
        enunciado_text = q.get('enunciado', q.get('title', ''))
        r_q_text = p_q.add_run(enunciado_text)
        format_run(r_q_text, size_pt=11, bold=True, rgb_color=COLOR_SECONDARY_RGB)
        
        p_pts = doc.add_paragraph()
        p_pts.paragraph_format.space_after = Pt(6)
        r_pts = p_pts.add_run(f"({q['pts']} puntos)")
        format_run(r_pts, size_pt=9.5, italic=True, rgb_color=COLOR_TERTIARY_RGB)
        
        if q['type'] == 'simple' or q['type'] == 'multiple':
            for opt in q['options']:
                p_o = doc.add_paragraph()
                p_o.paragraph_format.left_indent = Inches(0.4)
                p_o.paragraph_format.space_after = Pt(4)
                r_o = p_o.add_run(opt)
                
                # If teacher version, highlight correct choice
                is_correct_option = False
                if teacher_version:
                    if q['type'] == 'simple' and opt.strip().startswith(q['correct']):
                        is_correct_option = True
                    elif q['type'] == 'multiple':
                        # Find letters in opt like 'A)' and check if inside correct letters
                        letter = opt.split(')')[0].replace('☐', '').replace('☑', '').strip()
                        if letter in q['correct']:
                            is_correct_option = True
                
                if is_correct_option:
                    format_run(r_o, size_pt=10, bold=True, rgb_color=COLOR_PRIMARY_RGB)
                else:
                    format_run(r_o, size_pt=10)
                    
        elif q['type'] == 'vf':
            p_o = doc.add_paragraph()
            p_o.paragraph_format.left_indent = Inches(0.4)
            p_o.paragraph_format.space_after = Pt(4)
            
            if teacher_version:
                r_o = p_o.add_run(f"Respuesta correcta: {q['correct']}")
                format_run(r_o, size_pt=10, bold=True, rgb_color=COLOR_PRIMARY_RGB)
            else:
                r_o = p_o.add_run("(   ) Verdadero      (   ) Falso")
                format_run(r_o, size_pt=10)
                
        elif q['type'] == 'completar':
            p_o = doc.add_paragraph()
            p_o.paragraph_format.left_indent = Inches(0.4)
            p_o.paragraph_format.space_after = Pt(4)
            
            if teacher_version:
                r_o = p_o.add_run(f"Respuesta esperada: {q['correct']}")
                format_run(r_o, size_pt=10, bold=True, rgb_color=COLOR_PRIMARY_RGB)
            else:
                r_o = p_o.add_run("Respuesta: ________________________")
                format_run(r_o, size_pt=10)
                
        elif q['type'] == 'caso':
            p_c = doc.add_paragraph()
            p_c.paragraph_format.left_indent = Inches(0.2)
            p_c.paragraph_format.space_after = Pt(6)
            r_c = p_c.add_run(q['desc'])
            format_run(r_c, size_pt=10, italic=True)
            
            for sub_q in q['questions']:
                p_sub = doc.add_paragraph()
                p_sub.paragraph_format.left_indent = Inches(0.4)
                p_sub.paragraph_format.space_after = Pt(6)
                r_sub = p_sub.add_run(sub_q)
                format_run(r_sub, size_pt=10, bold=True)
                
                if not teacher_version:
                    # Provide empty lines for students
                    for _ in range(3):
                        p_ln = doc.add_paragraph()
                        p_ln.paragraph_format.left_indent = Inches(0.4)
                        p_ln.paragraph_format.space_after = Pt(2)
                        r_ln = p_ln.add_run("__________________________________________________________________")
                        format_run(r_ln, size_pt=10, rgb_color=COLOR_TERTIARY_RGB)
            
            if teacher_version:
                h_rub = doc.add_paragraph()
                r_rub_h = h_rub.add_run("RÚBRICA DE EVALUACIÓN DEL CASO:")
                format_run(r_rub_h, size_pt=10, bold=True, rgb_color=COLOR_PRIMARY_RGB)
                h_rub.paragraph_format.space_before = Pt(6)
                h_rub.paragraph_format.space_after = Pt(4)
                
                for level, rubric_desc in q['rubric'].items():
                    p_rub_row = doc.add_paragraph()
                    p_rub_row.paragraph_format.left_indent = Inches(0.4)
                    p_rub_row.paragraph_format.space_after = Pt(3)
                    r_lvl = p_rub_row.add_run(f"• {level}: ")
                    format_run(r_lvl, size_pt=9.5, bold=True)
                    r_desc = p_rub_row.add_run(rubric_desc)
                    format_run(r_desc, size_pt=9.5)
                    
        # Add explanation / justification if teacher version
        if teacher_version and 'justification' in q:
            p_just = doc.add_paragraph()
            p_just.paragraph_format.left_indent = Inches(0.4)
            p_just.paragraph_format.space_before = Pt(4)
            p_just.paragraph_format.space_after = Pt(4)
            r_just_lbl = p_just.add_run("Justificación para el docente: ")
            format_run(r_just_lbl, size_pt=9.5, bold=True, rgb_color=COLOR_PRIMARY_RGB)
            r_just_txt = p_just.add_run(q['justification'])
            format_run(r_just_txt, size_pt=9.5, italic=True, rgb_color=COLOR_TERTIARY_RGB)
            
        doc.add_paragraph().paragraph_format.space_after = Pt(8)
        
    # Teacher Performance Table at the end
    if teacher_version:
        doc.add_page_break()
        h_perf = doc.add_paragraph()
        r_perf = h_perf.add_run("TABLA DE NIVELES DE DESEMPEÑO")
        format_run(r_perf, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
        h_perf.paragraph_format.space_before = Pt(12)
        h_perf.paragraph_format.space_after = Pt(6)
        
        perf_table = doc.add_table(rows=5, cols=3)
        perf_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        apply_table_styles(perf_table)
        
        perf_headers = ["Puntaje", "Nivel", "Descripción"]
        perf_rows = [
            ("18-20", "Sobresaliente", "Domina todos los objetivos de aprendizaje de Flyway en microservicios."),
            ("14-17", "Satisfactorio", "Logra los objetivos principales con pequeños errores de sintaxis o procedimentales."),
            ("11-13", "En proceso", "Logra comprender los conceptos básicos pero requiere andamiaje en la resolución de fallos."),
            ("0-10", "Insuficiente", "No logra cumplir con los objetivos técnicos mínimos establecidos en las guías de laboratorio.")
        ]
        
        col_widths_perf = [Inches(1.0), Inches(1.5), Inches(4.0)]
        
        hdr_row = perf_table.rows[0]
        for j, h_name in enumerate(perf_headers):
            cell = hdr_row.cells[j]
            cell.width = col_widths_perf[j]
            set_cell_background(cell, "0056a3")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(h_name)
            format_run(r, size_pt=10, bold=True, rgb_color=COLOR_WHITE_RGB)
            
        for i, row_data in enumerate(perf_rows):
            row = perf_table.rows[i+1]
            for j, val in enumerate(row_data):
                cell = row.cells[j]
                cell.width = col_widths_perf[j]
                set_cell_background(cell, "FFFFFF" if i % 2 == 0 else "F9F9F9")
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                p = cell.paragraphs[0]
                r = p.add_run(val)
                format_run(r, size_pt=9.5, rgb_color=COLOR_SECONDARY_RGB)
    else:
        # Alumno Grading block
        doc.add_paragraph().paragraph_format.space_after = Pt(24)
        tbl_score = doc.add_table(rows=2, cols=3)
        tbl_score.alignment = WD_TABLE_ALIGNMENT.CENTER
        apply_table_styles(tbl_score)
        
        score_headers = ["PUNTAJE OBTENIDO", "EVALUADOR", "FIRMA"]
        col_widths_sc = [Inches(2.5), Inches(2.5), Inches(1.5)]
        
        hdr_row = tbl_score.rows[0]
        for j, h_name in enumerate(score_headers):
            cell = hdr_row.cells[j]
            cell.width = col_widths_sc[j]
            set_cell_background(cell, "CCCCCC")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(h_name)
            format_run(r, size_pt=9.5, bold=True, rgb_color=COLOR_SECONDARY_RGB)
            
        row_content = tbl_score.rows[1]
        for j in range(3):
            cell = row_content.cells[j]
            cell.width = col_widths_sc[j]
            set_cell_background(cell, "FFFFFF")
            set_cell_margins(cell, top=200, bottom=200, left=120, right=120)

# ==============================================================================
# APPS SCRIPT GENERATOR
# ==============================================================================
def generate_apps_script(prefix, quiz_data):
    script_lines = []
    script_lines.append("/**")
    script_lines.append(f" * Auto-generated Google Apps Script to create: {quiz_data['title']}")
    script_lines.append(" * Copy and paste this script into script.google.com and run createQuiz()")
    script_lines.append(" */")
    script_lines.append("function createQuiz() {")
    script_lines.append(f"  var form = FormApp.create({repr(quiz_data['title'])});")
    script_lines.append("  form.setDescription('Tiempo asignado: ' + " + repr(quiz_data['time']) + " + '\\nScore máximo: ' + " + repr(quiz_data['score']) + " + '\\n\\nLea las preguntas cuidadosamente y responda.');")
    script_lines.append("  form.setIsQuiz(true);")
    script_lines.append("  form.setCollectEmail(true);")
    script_lines.append("  form.setLimitOneResponsePerUser(true);")
    script_lines.append("")
    
    for i, q in enumerate(quiz_data['questions']):
        script_lines.append(f"  // Pregunta {i+1}")
        if q['type'] == 'simple':
            script_lines.append("  var q" + str(i+1) + " = form.addMultipleChoiceItem();")
            script_lines.append("  q" + str(i+1) + ".setTitle(" + repr(f"Pregunta {i+1}: {q['enunciado']}") + ")")
            choices_code = []
            for opt in q['options']:
                is_correct = "false"
                # get option letter
                letter = opt.strip().split(')')[0].replace('☐', '').replace('☑', '').strip()
                if letter == q['correct']:
                    is_correct = "true"
                choices_code.append(f"    q{i+1}.createChoice({repr(opt)}, {is_correct})")
            script_lines.append("    .setChoices([\n" + ",\n".join(choices_code) + "\n    ])")
            script_lines.append(f"    .setPoints({q['pts']})")
            script_lines.append("    .setRequired(true);")
            
        elif q['type'] == 'multiple':
            script_lines.append("  var q" + str(i+1) + " = form.addCheckboxItem();")
            script_lines.append("  q" + str(i+1) + ".setTitle(" + repr(f"Pregunta {i+1}: {q['enunciado']}") + ")")
            choices_code = []
            for opt in q['options']:
                is_correct = "false"
                letter = opt.strip().split(')')[0].replace('☐', '').replace('☑', '').strip()
                if letter in q['correct']:
                    is_correct = "true"
                choices_code.append(f"    q{i+1}.createChoice({repr(opt)}, {is_correct})")
            script_lines.append("    .setChoices([\n" + ",\n".join(choices_code) + "\n    ])")
            script_lines.append(f"    .setPoints({q['pts']})")
            script_lines.append("    .setRequired(true);")
            
        elif q['type'] == 'vf':
            script_lines.append("  var q" + str(i+1) + " = form.addMultipleChoiceItem();")
            script_lines.append("  q" + str(i+1) + ".setTitle(" + repr(f"Pregunta {i+1}: {q['enunciado']}") + ")")
            choices_code = [
                f"    q{i+1}.createChoice('Verdadero', {'true' if q['correct'] == 'V' else 'false'})",
                f"    q{i+1}.createChoice('Falso', {'true' if q['correct'] == 'F' else 'false'})"
            ]
            script_lines.append("    .setChoices([\n" + ",\n".join(choices_code) + "\n    ])")
            script_lines.append(f"    .setPoints({q['pts']})")
            script_lines.append("    .setRequired(true);")
            
        elif q['type'] == 'completar':
            script_lines.append("  var q" + str(i+1) + " = form.addShortAnswerItem();")
            script_lines.append("  q" + str(i+1) + ".setTitle(" + repr(f"Pregunta {i+1}: {q['enunciado']}") + ")")
            script_lines.append(f"  q{i+1}.setPoints({q['pts']});")
            script_lines.append(f"  q{i+1}.setRequired(true);")
            
        elif q['type'] == 'caso':
            script_lines.append("  form.addSectionHeaderItem()")
            script_lines.append("    .setTitle(" + repr(q['title']) + ")")
            script_lines.append("    .setHelpText(" + repr(q['desc']) + ");")
            for sub_idx, sub_q in enumerate(q['questions']):
                script_lines.append("  var q" + str(i+1) + "_" + str(sub_idx+1) + " = form.addParagraphTextItem();")
                script_lines.append("  q" + str(i+1) + "_" + str(sub_idx+1) + ".setTitle(" + repr(sub_q) + ")")
                script_lines.append("    .setHelpText('Caso Práctico — Calificación Manual con Rúbrica')")
                script_lines.append("    .setRequired(true);")
                
        script_lines.append("")
        
    script_lines.append("  form.setConfirmationMessage('Tu evaluación ha sido enviada correctamente.');")
    script_lines.append("  var url = form.getPublishedUrl();")
    script_lines.append("  Logger.log('Formulario publicado creado con éxito: ' + url);")
    script_lines.append("  Logger.log('Edite el formulario aquí: ' + form.getEditUrl());")
    script_lines.append("}")
    
    return "\n".join(script_lines)

if __name__ == "__main__":
    base_dir = r"C:\Users\ianache\Desktop\DATA\01-DOCUMENTOS\02-PROYECTOS\112-skillvault\MS-FLY-101"
    create_all_course_materials(base_dir)
