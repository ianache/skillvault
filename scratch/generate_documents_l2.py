import os
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from pptx import Presentation
from pptx.util import Inches as PtInches, Pt as PtFont
from pptx.dml.color import RGBColor as PptRGBColor

# Color Palette Config (Dark Red, Black, Gray, White)
COLOR_PRIMARY_RGB = (139, 0, 0)       # Dark Red #8B0000
COLOR_SECONDARY_RGB = (0, 0, 0)        # Black
COLOR_TERTIARY_RGB = (128, 128, 128)   # Gray
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

def add_callout(doc, text, color_hex="8B0000", bg_hex="F9F2F2"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=150, bottom=150, left=200, right=200)
    
    # Left border only (thick color)
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
    
    # Add an empty spacing paragraph after
    empty_p = doc.add_paragraph()
    empty_p.paragraph_format.space_before = Pt(0)
    empty_p.paragraph_format.space_after = Pt(6)

def format_run(run, font_name="Calibri", size_pt=11, bold=False, italic=False, rgb_color=COLOR_SECONDARY_RGB):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*rgb_color)

def add_header_footer(doc, title_text):
    for section in doc.sections:
        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run(f"PY-101 — {title_text} | Ficha de Lección")
        format_run(hrun, size_pt=8.5, rgb_color=COLOR_TERTIARY_RGB)
        
        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun = fp.add_run("Versión 1.0  |  Fecha: 2026-08-09  |  Confidencial y de Uso Interno")
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

# ==========================================
# 1. GENERATE FICHA DE LECCIÓN L2 (.docx)
# ==========================================
def generate_ficha(output_path):
    print("Generando Ficha de Lección L2...")
    doc = Document()
    
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
    add_header_footer(doc, "Lección 2")
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(24)
    r_title = p_title.add_run("FICHA TÉCNICA DE LECCIÓN")
    format_run(r_title, size_pt=20, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    table = doc.add_table(rows=6, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_table_styles(table)
    
    info_data = [
        ("CURSO", "PY-101 — Python y DuckDB para el Aseguramiento de Calidad y Consistencia de Datos"),
        ("LECCIÓN N°", "2 de 4"),
        ("CÓDIGO", "PY-101-L2"),
        ("TÍTULO", "Exploración y diagnóstico de calidad de datos"),
        ("DURACIÓN", "2 horas (120 minutos)"),
        ("METODOLOGÍA", "Combinada (Demostración y Taller Práctico)")
    ]
    
    col_widths = [Inches(1.8), Inches(4.7)]
    for i, (label, val) in enumerate(info_data):
        row = table.rows[i]
        cell_lbl = row.cells[0]
        cell_lbl.width = col_widths[0]
        set_cell_background(cell_lbl, "8B0000")
        set_cell_margins(cell_lbl, top=100, bottom=100, left=150, right=150)
        p_lbl = cell_lbl.paragraphs[0]
        r_lbl = p_lbl.add_run(label)
        format_run(r_lbl, size_pt=9.5, bold=True, rgb_color=COLOR_WHITE_RGB)
        
        cell_val = row.cells[1]
        cell_val.width = col_widths[1]
        set_cell_background(cell_val, "FFFFFF" if i % 2 == 0 else "F9F9F9")
        set_cell_margins(cell_val, top=100, bottom=100, left=150, right=150)
        p_val = cell_val.paragraphs[0]
        r_val = p_val.add_run(val)
        format_run(r_val, size_pt=10, rgb_color=COLOR_SECONDARY_RGB)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Section: Objetivos
    h_obj = doc.add_paragraph()
    r_h_obj = h_obj.add_run("OBJETIVOS DE LA LECCIÓN")
    format_run(r_h_obj, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_obj.paragraph_format.space_before = Pt(12)
    h_obj.paragraph_format.space_after = Pt(6)
    
    p_intro_obj = doc.add_paragraph()
    r_intro_obj = p_intro_obj.add_run("Al finalizar esta lección, el participante será capaz de:")
    format_run(r_intro_obj, size_pt=10.5, italic=True)
    p_intro_obj.paragraph_format.space_after = Pt(6)
    
    objectives = [
        "Utilizar propiedades y métodos de pandas (info, describe, shape) para evaluar la completitud, tipos y dimensiones de un dataset local.",
        "Ejecutar consultas SQL rápidas sobre archivos planos locales usando la librería DuckDB, facilitando auditorías ágiles de datos sin sobrecargar memoria.",
        "Aplicar estrategias de remoción e imputación de valores nulos (NaN/None) y detección de registros duplicados en Python para mitigar fallos lógicos."
    ]
    for obj in objectives:
        p_bullet = doc.add_paragraph(style='List Bullet')
        p_bullet.paragraph_format.space_after = Pt(4)
        p_bullet.paragraph_format.left_indent = Inches(0.4)
        run_b = p_bullet.add_run(obj)
        format_run(run_b, size_pt=10.5)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Section: Habilidades
    h_hab = doc.add_paragraph()
    r_h_hab = h_hab.add_run("HABILIDADES A DESARROLLAR")
    format_run(r_h_hab, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_hab.paragraph_format.space_before = Pt(12)
    h_hab.paragraph_format.space_after = Pt(6)
    
    skills = [
        "Diagnóstico ágil de integridad estructural de datos usando estadísticas descriptivas.",
        "Consulta SQL directa de archivos locales (CSV/Parquet) embebida en Python vía DuckDB.",
        "Análisis y tratamiento selectivo de valores faltantes (nulos) mediante remoción o imputación estratégica.",
        "Detección, análisis y remoción consistente de registros duplicados."
    ]
    for sk in skills:
        p_bullet = doc.add_paragraph(style='List Bullet')
        p_bullet.paragraph_format.space_after = Pt(4)
        p_bullet.paragraph_format.left_indent = Inches(0.4)
        run_b = p_bullet.add_run(sk)
        format_run(run_b, size_pt=10.5)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Section: Agenda
    h_agenda = doc.add_paragraph()
    r_h_agenda = h_agenda.add_run("AGENDA DE LA SESIÓN")
    format_run(r_h_agenda, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_agenda.paragraph_format.space_before = Pt(12)
    h_agenda.paragraph_format.space_after = Pt(6)
    
    agenda_table = doc.add_table(rows=6, cols=3)
    agenda_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_table_styles(agenda_table)
    
    agenda_headers = ["ID", "Tema o Actividad de Aprendizaje", "Duración"]
    agenda_rows = [
        ("1", "Exploración estructural y descriptiva de datos con pandas (info, describe, shape, value_counts)", "25 min"),
        ("2", "Consultas SQL ágiles directamente sobre archivos CSV y planos locales usando DuckDB", "30 min"),
        ("3", "Diagnóstico de completitud: Identificación de nulos y estrategias de tratamiento (imputación/remoción)", "25 min"),
        ("4", "Taller práctico: Detección, análisis de impacto y remoción de registros duplicados en Python", "30 min"),
        ("5", "Preguntas, discusión de mejores prácticas aplicadas y cierre de sesión", "10 min")
    ]
    
    col_widths_agenda = [Inches(0.6), Inches(4.7), Inches(1.2)]
    
    # Header row
    hdr_row = agenda_table.rows[0]
    for j, name in enumerate(agenda_headers):
        cell = hdr_row.cells[j]
        cell.width = col_widths_agenda[j]
        set_cell_background(cell, "8B0000")
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j != 1 else WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(name)
        format_run(run, size_pt=10, bold=True, rgb_color=COLOR_WHITE_RGB)
        
    # Content rows
    for i, data in enumerate(agenda_rows):
        row = agenda_table.rows[i+1]
        for j, val in enumerate(data):
            cell = row.cells[j]
            cell.width = col_widths_agenda[j]
            set_cell_background(cell, "FFFFFF" if i % 2 == 0 else "F9F9F9")
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j != 1 else WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(val)
            format_run(run, size_pt=9.5, rgb_color=COLOR_SECONDARY_RGB)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Section: Recursos
    h_rec = doc.add_paragraph()
    r_h_rec = h_rec.add_run("RECURSOS REQUERIDOS")
    format_run(r_h_rec, size_pt=13, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_rec.paragraph_format.space_before = Pt(12)
    h_rec.paragraph_format.space_after = Pt(6)
    
    recursos = [
        "Editor de código: VS Code con extensiones de Python y Jupyter en funcionamiento.",
        "Librerías Python: pandas 2.0+ y DuckDB 1.0+ instaladas localmente en el kernel activo.",
        "Datasets de entrenamiento: Un dataset de facturación con transacciones duplicadas y un maestro de productos con códigos nulos e inconsistentes.",
        "Guía de Laboratorio Práctico interactiva."
    ]
    for rec in recursos:
        p_bullet = doc.add_paragraph(style='List Bullet')
        p_bullet.paragraph_format.space_after = Pt(4)
        p_bullet.paragraph_format.left_indent = Inches(0.4)
        run_b = p_bullet.add_run(rec)
        format_run(run_b, size_pt=10.5)
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"Ficha de lección L2 guardada exitosamente en {output_path}")

# ==========================================
# 2. GENERATE PRESENTACIÓN PPT L2 (.pptx)
# ==========================================
def generate_presentation(output_path):
    print("Generando Presentación PPT L2...")
    prs = Presentation()
    prs.slide_width = PtInches(13.333)
    prs.slide_height = PtInches(7.5)
    
    blank_layout = prs.slide_layouts[6]
    
    slides_data = [
        # Slide 1: Portada
        {
            "type": "portada",
            "title": "Exploración y diagnóstico de calidad de datos",
            "subtitle": "CURSO: PY-101 — Python y DuckDB para el Aseguramiento de Calidad y Consistencia de Datos",
            "footer": "Lección 2 de 4  |  Código: PY-101-L2",
            "notes": "Bienvenidos a la segunda sesión. Hoy daremos el salto del análisis descriptivo de pandas a auditorías más complejas usando consultas SQL rápidas con DuckDB, y aprenderemos a tratar nulos y registros duplicados que representan fallas críticas en los almacenes de datos corporativos."
        },
        # Slide 2: Agenda
        {
            "type": "content",
            "title": "Agenda de la Sesión",
            "bullets": [
                "01. Exploración visual y estructural ágil con pandas (info, describe, shape) [25 min]",
                "02. Consultas SQL inmediatas en local usando la potencia de DuckDB [30 min]",
                "03. Diagnóstico de completitud: Tratamiento sistemático de valores nulos (NaN) [25 min]",
                "04. Taller práctico: Detección y depuración limpia de registros duplicados [30 min]",
                "05. Cierre, preguntas clave e introducción a la siguiente sesión [10 min]"
            ],
            "notes": "Hoy estructuramos la sesión en dos bloques técnicos principales: auditorías veloces usando SQL directo con DuckDB y la limpieza estructural de nulos y duplicados mediante pandas."
        },
        # Slide 3: Objetivos
        {
            "type": "content",
            "title": "Objetivos de Aprendizaje",
            "bullets": [
                "Evaluar la estructura, tipos de datos y completitud inicial de tablas con funciones rápidas de pandas.",
                "Escribir consultas SQL ágiles sobre archivos locales usando DuckDB de forma nativa en Jupyter.",
                "Seleccionar y aplicar estrategias óptimas para aislar o imputar registros con valores nulos (NaN).",
                "Construir scripts reutilizables para detectar y eliminar duplicados en base a llaves de unicidad."
            ],
            "notes": "Estos objetivos están diseñados para darles herramientas reales de auditoría. Al final de la sesión podrán combinar SQL estándar para consultar sus archivos de prueba locales y usar Python para limpiar registros duplicados o corruptos."
        },
        # Slide 4: Exploración con pandas
        {
            "type": "content",
            "title": "Exploración estructural con pandas",
            "bullets": [
                "DataFrame.shape: Retorna de inmediato el conteo exacto de registros y columnas cargadas.",
                "DataFrame.info(): Muestra el listado de campos, tipo lógico detectado y conteo de valores válidos no nulos.",
                "DataFrame.describe(): Genera métricas estadísticas rápidas (media, mínimos, máximos, cuartiles) para variables numéricas.",
                "value_counts(): Excelente para examinar cardinalidad, consistencia de categorías y distribución de frecuencias."
            ],
            "notes": "Las funciones shape, info y describe son el paso obligatorio para todo analista de QA al recibir un set de datos. Nos permiten dimensionar rápidamente el volumen e identificar inconsistencias en los tipos lógicos de datos."
        },
        # Slide 5: Consultas Rápidas con DuckDB
        {
            "type": "content",
            "title": "Auditorías SQL Locales con DuckDB",
            "bullets": [
                "DuckDB: Un motor de base de datos relacional analítico optimizado para correr localmente de forma ultra veloz.",
                "SQL Directo: Permite ejecutar consultas SQL estándar (SELECT, JOIN, GROUP BY) directamente sobre archivos CSV, Parquet o JSON.",
                "Eficiencia de Memoria: Procesa archivos de gigabytes en segundos sin consumir recursos excesivos en el equipo del analista.",
                "Integración simple: Se conecta nativamente con Python mediante celdas interactivas en Jupyter Notebooks."
            ],
            "notes": "DuckDB es la herramienta revelación para auditoría de datos. Si están acostumbrados a SQL, no necesitan importar los datos a una base de datos pesada como Oracle o SQL Server; pueden consultar un archivo CSV local en su computadora usando SQL puro gracias a DuckDB."
        },
        # Slide 6: Tratamiento de Valores Nulos (NaN)
        {
            "type": "content",
            "title": "Análisis de Completitud: Manejo de Nulos",
            "bullets": [
                "Identificación: pandas representa valores nulos como NaN o None. Se detectan con 'isna()' o 'isnull()'.",
                "Remoción Directa: Eliminación de filas nulas mediante 'dropna()', seleccionando si afecta a campos clave (subset).",
                "Estrategia de Imputación: Rellenar nulos de forma controlada mediante 'fillna()' usando valores fijos o estadísticos (mediana, moda).",
                "Impacto Instruccional: Un nulo mal procesado en producción puede tumbar un flujo ETL o corromper un reporte de BI."
            ],
            "notes": "No siempre es correcto borrar las filas que contienen valores nulos. Como analistas, debemos decidir si imputamos (rellenamos) con la mediana, con un valor por defecto como 'Desconocido', o si removemos el registro si el campo nulo es una llave de negocio indispensable."
        },
        # Slide 7: Tratamiento de Duplicados
        {
            "type": "content",
            "title": "Análisis de Unicidad: Duplicados",
            "bullets": [
                "Detección: Identificación de filas repetidas mediante el método 'duplicated()'.",
                "Alcance de Llave: Validación de duplicados en registros completos o especificando columnas de negocio específicas (ej. código_cliente).",
                "Depuración: Eliminación limpia utilizando 'drop_duplicates()', decidiendo si retener el primer registro ('first') o el último ('last').",
                "Auditoría: Validar y documentar las causas de los duplicados (ej. fallas de sincronización del API, reintentos de envío)."
            ],
            "notes": "La unicidad garantiza la consistencia del negocio. En el taller de hoy, identificaremos duplicados parciales (donde solo la llave de negocio está duplicada con información diferente) y aprenderemos a depurarlos sistemáticamente."
        },
        # Slide 8: Resumen y Takeaways
        {
            "type": "content",
            "title": "Puntos Clave (Takeaways)",
            "bullets": [
                "Inspección obligatoria: Nunca inicie un análisis de calidad sin correr 'info()' y verificar dimensiones.",
                "Dualidad ideal: Use la velocidad de DuckDB para consultas rápidas y pandas para transformaciones complejas.",
                "Decisión de negocio: La limpieza de nulos y duplicados requiere validación de las reglas de negocio del sistema.",
                "Auditabilidad: Guardar el script de diagnóstico documentado en el Jupyter Notebook garantiza reproducibilidad."
            ],
            "notes": "Para resumir, recuerden que la combinación de DuckDB y pandas les da lo mejor de ambos mundos: la agilidad declarativa de SQL y la flexibilidad programática de Python para tratar problemas de consistencia."
        },
        # Slide 9: Referencias y Recursos
        {
            "type": "content",
            "title": "Referencias y Recursos de Aprendizaje",
            "bullets": [
                "Documentación de DuckDB SQL: duckdb.org/docs",
                "Guía de pandas (Valores Faltantes): pandas.pydata.org/docs/user_guide/missing_data.html",
                "Repositorio de Ejemplos del Curso: [URL-PENDIENTE: repositorio del proyecto — proveer al instructor]",
                "Mejores Prácticas de QA de Datos: Estándar corporativo de completitud y consistencia."
            ],
            "notes": "Utilicen la documentación oficial de DuckDB para ver las funciones de agregación y el enlace pendiente del repositorio para descargar los notebooks con ejercicios resueltos de esta lección."
        }
    ]
    
    for slide_info in slides_data:
        slide = prs.slides.add_slide(blank_layout)
        
        # Slide Speaker Notes
        notes_slide = slide.notes_slide
        text_frame = notes_slide.notes_text_frame
        text_frame.text = slide_info.get("notes", "")
        
        if slide_info["type"] == "portada":
            # Header accent band
            shape_band = slide.shapes.add_shape(1, 0, 0, prs.slide_width, PtInches(1.8))
            shape_band.fill.solid()
            shape_band.fill.fore_color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
            shape_band.line.fill.background()
            
            txBox = slide.shapes.add_textbox(PtInches(0.8), PtInches(2.2), PtInches(11.7), PtInches(3.5))
            tf = txBox.text_frame
            tf.word_wrap = True
            
            p_title = tf.paragraphs[0]
            p_title.text = slide_info["title"]
            p_title.font.name = "Calibri"
            p_title.font.size = PtFont(40)
            p_title.font.bold = True
            p_title.font.color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
            p_title.space_after = PtFont(16)
            
            p_sub = tf.add_paragraph()
            p_sub.text = slide_info["subtitle"]
            p_sub.font.name = "Calibri"
            p_sub.font.size = PtFont(16)
            p_sub.font.bold = True
            p_sub.font.color.rgb = PptRGBColor(*COLOR_SECONDARY_RGB)
            p_sub.space_after = PtFont(24)
            
            p_foot = tf.add_paragraph()
            p_foot.text = slide_info["footer"]
            p_foot.font.name = "Calibri"
            p_foot.font.size = PtFont(13)
            p_foot.font.italic = True
            p_foot.font.color.rgb = PptRGBColor(*COLOR_TERTIARY_RGB)
            
        else:
            # Left accent bar
            shape_bar = slide.shapes.add_shape(1, 0, 0, PtInches(0.4), prs.slide_height)
            shape_bar.fill.solid()
            shape_bar.fill.fore_color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
            shape_bar.line.fill.background()
            
            title_box = slide.shapes.add_textbox(PtInches(0.8), PtInches(0.5), PtInches(11.7), PtInches(1.2))
            tf_title = title_box.text_frame
            tf_title.word_wrap = True
            p_t = tf_title.paragraphs[0]
            p_t.text = slide_info["title"]
            p_t.font.name = "Calibri"
            p_t.font.size = PtFont(32)
            p_t.font.bold = True
            p_t.font.color.rgb = PptRGBColor(*COLOR_PRIMARY_RGB)
            
            content_box = slide.shapes.add_textbox(PtInches(1.0), PtInches(1.8), PtInches(11.3), PtInches(5.0))
            tf_content = content_box.text_frame
            tf_content.word_wrap = True
            
            for index, bullet in enumerate(slide_info["bullets"]):
                if index == 0:
                    p_b = tf_content.paragraphs[0]
                else:
                    p_b = tf_content.add_paragraph()
                    
                p_b.text = "• " + bullet
                p_b.font.name = "Calibri"
                p_b.font.size = PtFont(15)
                p_b.font.color.rgb = PptRGBColor(*COLOR_SECONDARY_RGB)
                p_b.space_after = PtFont(12)
                p_b.level = 0
                
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    prs.save(output_path)
    print(f"Presentación PPT L2 guardada exitosamente en {output_path}")

# ==========================================
# 3. GENERATE GUÍA DE LABORATORIO L2 (.docx)
# ==========================================
def generate_lab_guide(output_path):
    print("Generando Guía de Laboratorio L2...")
    doc = Document()
    
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
    add_header_footer(doc, "Guía de Lab 2")
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(24)
    r_title = p_title.add_run("GUÍA DE LABORATORIO PRÁCTICO")
    format_run(r_title, size_pt=18, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    table = doc.add_table(rows=5, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_table_styles(table)
    
    info_data = [
        ("CÓDIGO DE LECCIÓN", "PY-101-L2"),
        ("TÍTULO LECCIÓN", "Exploración y diagnóstico de calidad de datos"),
        ("TÍTULO LABORATORIO", "Lab 2: Consultas SQL Locales con DuckDB y Saneamiento de Nulos y Duplicados"),
        ("DURACIÓN ESTIMADA", "30 minutos"),
        ("VERSIÓN / FECHA", "1.0  /  2026-08-09")
    ]
    
    col_widths = [Inches(2.2), Inches(4.3)]
    for i, (label, val) in enumerate(info_data):
        row = table.rows[i]
        cell_lbl = row.cells[0]
        cell_lbl.width = col_widths[0]
        set_cell_background(cell_lbl, "000000")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        p_lbl = cell_lbl.paragraphs[0]
        r_lbl = p_lbl.add_run(label)
        format_run(r_lbl, size_pt=9, bold=True, rgb_color=COLOR_WHITE_RGB)
        
        cell_val = row.cells[1]
        cell_val.width = col_widths[1]
        set_cell_background(cell_val, "FFFFFF" if i % 2 == 0 else "F9F9F9")
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)
        p_val = cell_val.paragraphs[0]
        r_val = p_val.add_run(val)
        format_run(r_val, size_pt=9.5, rgb_color=COLOR_SECONDARY_RGB)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # 1. OBJETIVOS
    h1 = doc.add_paragraph()
    r_h1 = h1.add_run("1. OBJETIVOS DEL LABORATORIO")
    format_run(r_h1, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    
    objectives = [
        "Consultar archivos CSV locales utilizando sentencias SQL a través de DuckDB.",
        "Identificar campos con datos faltantes (nulos) y aplicar imputación de modas/constantes o remoción.",
        "Analizar la unicidad del dataset para aislar, documentar y borrar registros duplicados."
    ]
    for obj in objectives:
        p_bullet = doc.add_paragraph(style='List Bullet')
        p_bullet.paragraph_format.space_after = Pt(4)
        p_bullet.paragraph_format.left_indent = Inches(0.4)
        run_b = p_bullet.add_run(obj)
        format_run(run_b, size_pt=10)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 2. ENTORNO
    h2 = doc.add_paragraph()
    r_h2 = h2.add_run("2. ENTORNO Y REQUISITOS TÉCNICOS")
    format_run(r_h2, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(6)
    
    env_items = [
        "Estación de trabajo con VS Code, Jupyter y Python 3.10+ configurados en la Lección 1.",
        "Librerías pandas y DuckDB instaladas en el kernel local.",
        "Dataset de transacciones con nulos y registros duplicados provisto por el docente."
    ]
    for item in env_items:
        p_bullet = doc.add_paragraph(style='List Bullet')
        p_bullet.paragraph_format.space_after = Pt(4)
        p_bullet.paragraph_format.left_indent = Inches(0.4)
        run_b = p_bullet.add_run(item)
        format_run(run_b, size_pt=10)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 3. PREPARACIÓN
    h3 = doc.add_paragraph()
    r_h3 = h3.add_run("3. PREPARACIÓN DEL ENTORNO")
    format_run(r_h3, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h3.paragraph_format.space_before = Pt(12)
    h3.paragraph_format.space_after = Pt(6)
    
    steps_prep = [
        "Inicie su terminal o consola local de comandos en VS Code.",
        "Instale de manera exitosa la librería DuckDB en su kernel activo corriendo:",
        "    pip install duckdb",
        "Abra el Jupyter Notebook 'mi_primer_auditoria.ipynb' o cree una copia llamada 'diagnostico_calidad.ipynb'."
    ]
    for step in steps_prep:
        if step.strip().startswith("pip"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            p_step.paragraph_format.left_indent = Inches(0.4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 4. EJERCICIOS
    h4 = doc.add_paragraph()
    r_h4 = h4.add_run("4. EJERCICIOS Y PASOS DE EJECUCIÓN")
    format_run(r_h4, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h4.paragraph_format.space_before = Pt(12)
    h4.paragraph_format.space_after = Pt(6)
    
    # Ejercicio 1: DuckDB
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    h_ex1 = doc.add_paragraph()
    r_ex1 = h_ex1.add_run("Ejercicio 1: Consultas SQL Locales con DuckDB")
    format_run(r_ex1, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_ex1.paragraph_format.space_after = Pt(4)
    
    p_ex1_desc = doc.add_paragraph()
    p_ex1_desc.paragraph_format.space_after = Pt(6)
    r_ex1_desc = p_ex1_desc.add_run("Audite la completitud y haga consultas de agregación sobre el archivo 'clientes.csv' usando sentencias SQL directo vía DuckDB:")
    format_run(r_ex1_desc, size_pt=10)
    
    steps_ex1 = [
        "Cree una celda de código, importe duckdb y ejecute una consulta que lea el CSV directamente:",
        "    import duckdb",
        "    # Consultar CSV directamente",
        "    duckdb.sql(\"SELECT * FROM 'clientes.csv' LIMIT 5\").show()",
        "Ejecute un agrupamiento SQL para auditar la cardinalidad del campo de ciudades en una nueva celda:",
        "    duckdb.sql(\"\"\"",
        "        SELECT ciudad, COUNT(*) as total_clientes ",
        "        FROM 'clientes.csv' ",
        "        GROUP BY ciudad ",
        "        ORDER BY total_clientes DESC",
        "    \"\"\").show()"
    ]
    for step in steps_ex1:
        if step.strip().startswith("import") or step.strip().startswith("duckdb") or step.strip().startswith("SELECT") or step.strip().startswith("FROM") or step.strip().startswith("GROUP") or step.strip().startswith("ORDER") or step.strip().startswith('""') or step.strip().startswith('#'):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            p_step.paragraph_format.left_indent = Inches(0.4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: DuckDB imprimirá los resultados en pantalla con formato tabular limpio de consola de manera instantánea.")
    
    # Ejercicio 2: Nulos
    h_ex2 = doc.add_paragraph()
    r_ex2 = h_ex2.add_run("Ejercicio 2: Saneamiento y Tratamiento de Valores Nulos")
    format_run(r_ex2, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_ex2.paragraph_format.space_before = Pt(12)
    h_ex2.paragraph_format.space_after = Pt(4)
    
    p_ex2_desc = doc.add_paragraph()
    p_ex2_desc.paragraph_format.space_after = Pt(6)
    r_ex2_desc = p_ex2_desc.add_run("Aprenderá a aislar y auditar las filas del dataset con valores nulos, y luego imputar un valor constante para asegurar la consistencia del campo.")
    format_run(r_ex2_desc, size_pt=10)
    
    steps_ex2 = [
        "Identifique y cuente la cantidad de nulos por cada columna usando pandas:",
        "    import pandas as pd",
        "    df = pd.read_csv('clientes.csv')",
        "    print('Nulos por columna:')",
        "    print(df.isna().sum())",
        "Filtre y visualice únicamente los registros de clientes que tienen el email como nulo:",
        "    df[df['email'].isna()]",
        "Rellene los valores nulos en el campo del teléfono con el marcador constante 'SIN-TELEFONO' de forma irreversible:",
        "    df['telefono'] = df['telefono'].fillna('SIN-TELEFONO')",
        "    print('Nulos restantes en telefono:', df['telefono'].isna().sum())"
    ]
    for step in steps_ex2:
        if step.strip().startswith("import") or step.strip().startswith("df") or step.strip().startswith("print"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            p_step.paragraph_format.left_indent = Inches(0.4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: El contador final de nulos para la columna 'telefono' debe resultar exactamente en 0.")
    
    # Ejercicio 3: Duplicados
    h_ex3 = doc.add_paragraph()
    r_ex3 = h_ex3.add_run("Ejercicio 3: Detección y Remoción de Registros Duplicados")
    format_run(r_ex3, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h_ex3.paragraph_format.space_before = Pt(12)
    h_ex3.paragraph_format.space_after = Pt(4)
    
    p_ex3_desc = doc.add_paragraph()
    p_ex3_desc.paragraph_format.space_after = Pt(6)
    r_ex3_desc = p_ex3_desc.add_run("Los duplicados lógicos pueden inflar métricas operacionales. Aprenderá a identificarlos basándose en una llave única de negocio.")
    format_run(r_ex3_desc, size_pt=10)
    
    steps_ex3 = [
        "Audite si existen registros con el identificador de cliente 'id_cliente' duplicado:",
        "    # Identificar filas duplicadas por ID de cliente",
        "    duplicados = df[df.duplicated(subset=['id_cliente'], keep=False)]",
        "    print('Registros con ID duplicado encontrados:', len(duplicados))",
        "    duplicados.head()",
        "Elimine los registros duplicados de forma limpia, preservando únicamente la primera aparición del cliente:",
        "    df_limpio = df.drop_duplicates(subset=['id_cliente'], keep='first')",
        "    print('Filas antes:', len(df), ' | Filas despues:', len(df_limpio))"
    ]
    for step in steps_ex3:
        if step.strip().startswith("#") or step.strip().startswith("duplicados") or step.strip().startswith("df_") or step.strip().startswith("print"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            p_step.paragraph_format.left_indent = Inches(0.4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: La diferencia entre las filas antes y después debe ser igual al volumen de registros redundantes detectados previamente.")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # 5. EVALUACIÓN
    h5 = doc.add_paragraph()
    r_h5 = h5.add_run("5. EVALUACIÓN DE DESEMPEÑO")
    format_run(r_h5, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h5.paragraph_format.space_before = Pt(12)
    h5.paragraph_format.space_after = Pt(6)
    
    criteria = [
        "Ejecución exitosa de sentencias SQL directas con agregación (GROUP BY) usando DuckDB en su notebook.",
        "Visualización y aislamiento exacto de registros nulos, justificando la estrategia de imputación seleccionada.",
        "Depuración consistente de duplicados utilizando llaves lógicas de negocio, demostrando el cambio en dimensiones de datos."
    ]
    for cr in criteria:
        p_bullet = doc.add_paragraph(style='List Bullet')
        p_bullet.paragraph_format.space_after = Pt(4)
        p_bullet.paragraph_format.left_indent = Inches(0.4)
        run_b = p_bullet.add_run(cr)
        format_run(run_b, size_pt=10)
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"Guía de Laboratorio L2 guardada exitosamente en {output_path}")

if __name__ == "__main__":
    base_dir = r"C:\Users\ianache\Desktop\DATA\01-DOCUMENTOS\02-PROYECTOS\112-skillvault\PY-101"
    generate_ficha(os.path.join(base_dir, "PY-101-L2-ficha.docx"))
    generate_presentation(os.path.join(base_dir, "PY-101-L2-presentacion.pptx"))
    generate_lab_guide(os.path.join(base_dir, "PY-101-L2-lab.docx"))
    print("PROCESO DE GENERACIÓN LECCIÓN 2 COMPLETADO CON ÉXITO.")
