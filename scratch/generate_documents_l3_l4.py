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

def format_run(run, font_name="Calibri", size_pt=11, bold=False, italic=False, rgb_color=COLOR_SECONDARY_RGB):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*rgb_color)

def add_header_footer(doc, title_text):
    for section in doc.sections:
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run(f"PY-101 — {title_text} | Ficha de Lección")
        format_run(hrun, size_pt=8.5, rgb_color=COLOR_TERTIARY_RGB)
        
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
# 1. GENERATE L3 DOCUMENTS
# ==========================================
def generate_l3_ficha(output_path):
    print("Generando Ficha de Lección L3...")
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
    add_header_footer(doc, "Lección 3")
    
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
        ("LECCIÓN N°", "3 de 4"),
        ("CÓDIGO", "PY-101-L3"),
        ("TÍTULO", "Limpieza, transformación y validación"),
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
        "Validar esquemas lógicos verificando tipos de datos (dtypes) y aplicando funciones de conversión o casteo seguro (astype, to_datetime) en pandas de forma robusta.",
        "Implementar filtros condicionales cruzados y agrupaciones complejas (groupby) en Python para aislar anomalías transaccionales lógicas.",
        "Formular reglas de consistencia de negocio verificando límites numéricos, rangos permitidos, cardinalidad y consistencia relacional cruzada entre campos."
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
        "Conversión y casteo seguro de datos con pandas (pd.to_datetime, pd.to_numeric).",
        "Filtrado condicional múltiple y agregación analítica de anomalías lógicas.",
        "Validación lógica de restricciones de negocio cruzadas (ej. Fecha Envío >= Fecha Pedido).",
        "Análisis de consistencia lógica, límites y rangos permitidos."
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
        ("1", "Validación formal de tipos de datos (dtypes) y conversión/casteo correcto en pandas", "25 min"),
        ("2", "Análisis de consistencia avanzada: Filtrados avanzados, agrupaciones (groupby) y ordenamientos", "25 min"),
        ("3", "Validación de rangos permitidos, cardinalidad y consistencia lógica cruzada entre campos de negocio", "30 min"),
        ("4", "Taller práctico: Saneamiento y validación relacional de un dataset transaccional real", "30 min"),
        ("5", "Preguntas, discusión de mejores prácticas de transformación de datos y cierre de sesión", "10 min")
    ]
    col_widths_agenda = [Inches(0.6), Inches(4.7), Inches(1.2)]
    
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
    doc.save(output_path)
    print(f"Ficha L3 generada en {output_path}")

def generate_l3_presentation(output_path):
    print("Generando Presentación L3...")
    prs = Presentation()
    prs.slide_width = PtInches(13.333)
    prs.slide_height = PtInches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    slides_data = [
        {
            "type": "portada",
            "title": "Limpieza, transformación y validación de datos",
            "subtitle": "CURSO: PY-101 — Python y DuckDB para el Aseguramiento de Calidad y Consistencia de Datos",
            "footer": "Lección 3 de 4  |  Código: PY-101-L3",
            "notes": "Bienvenidos a la lección 3. Hoy profundizaremos en el casteo correcto de tipos de datos y la implementación de validaciones cruzadas entre campos para auditar reglas de negocio."
        },
        {
            "type": "content",
            "title": "Agenda de la Sesión",
            "bullets": [
                "01. Validación de esquemas y casteo de tipos (dtypes) [25 min]",
                "02. Agrupación y filtrado analítico con groupby y queries lógicas [25 min]",
                "03. Formulación de reglas lógicas cruzadas y validación de rangos [30 min]",
                "04. Taller práctico: Saneamiento de un dataset transaccional con fallas de tipo [30 min]",
                "05. Resumen, mejores prácticas y cierre [10 min]"
            ],
            "notes": "Nuestra sesión aborda desde el casteo técnico de campos numéricos y fechas, hasta la escritura de reglas de negocio complejas en Python."
        },
        {
            "type": "content",
            "title": "Objetivos de Aprendizaje",
            "bullets": [
                "Castear campos de manera segura convirtiendo tipos lógicos con astype, to_numeric y to_datetime.",
                "Escribir filtros cruzados y agrupamientos lógicos para identificar incoherencias de consistencia.",
                "Discurrir y aplicar reglas lógicas para aislar violaciones de restricciones lógicas corporativas."
            ],
            "notes": "Buscamos que logren total dominio sobre las conversiones de formatos y la lógica condicional cruzada."
        },
        {
            "type": "content",
            "title": "Casteo Seguro de Tipos de Datos",
            "bullets": [
                "dtypes en pandas: Muestra los formatos almacenados internamente. El tipo 'object' suele esconder inconsistencias.",
                "Conversión Numérica: pd.to_numeric() permite convertir cadenas a números, manejando errores mediante el parámetro errors='coerce'.",
                "Conversión Temporal: pd.to_datetime() es clave para interpretar fechas, controlando el argumento de formato (format='%%Y-%%m-%%d').",
                "Conversión Categórica: astype('category') optimiza memoria y agiliza auditorías de campos repetitivos."
            ],
            "notes": "Un error común en QA es tener columnas de fechas u montos interpretados como texto ('object'). Si es así, no podremos validar rangos matemáticos ni cronologías hasta castearlos correctamente."
        },
        {
            "type": "content",
            "title": "Validaciones Cruzadas entre Campos",
            "bullets": [
                "Consistencia lógica condicional: Comprobación de que la relación entre dos o más columnas cumpla reglas de negocio.",
                "Ejemplo de Fechas: Verificar cronología lógica de hitos (ej. Fecha de Envío debe ser posterior a la Fecha de Creación de Orden).",
                "Ejemplo Económico: Comprobar consistencia de montos (ej. Total de Orden = Sumatoria de Subtotales + Impuestos - Descuentos).",
                "Aislamiento: Filtrar y exportar únicamente aquellos registros que violan las condiciones de negocio para su reporte técnico."
            ],
            "notes": "Las validaciones cruzadas son la esencia de las auditorías funcionales. Validamos que las leyes de negocio que definimos en los requerimientos se reflejen exactamente en los registros de datos."
        },
        {
            "type": "content",
            "title": "Taller Práctico: Saneamiento de Datos",
            "bullets": [
                "Fase 1: Identificar campos 'object' que deberían ser numéricos o temporales en el dataset de órdenes.",
                "Fase 2: Castear de forma segura las columnas usando 'errors=coerce' para capturar valores corruptos no convertibles.",
                "Fase 3: Escribir la validación de rango (Monto > 0) y validación de fecha (Fecha_Envio >= Fecha_Orden).",
                "Fase 4: Agrupar por estado de orden y calcular el conteo de errores lógicos utilizando agrupaciones avanzadas."
            ],
            "notes": "En la práctica de hoy, simularemos la limpieza y validación de un dataset de órdenes de compra con datos de tipo erróneo y fechas inconsistentes."
        }
    ]
    
    for slide_info in slides_data:
        slide = prs.slides.add_slide(blank_layout)
        notes_slide = slide.notes_slide
        notes_slide.notes_text_frame.text = slide_info.get("notes", "")
        
        if slide_info["type"] == "portada":
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
    print(f"PPT L3 generada en {output_path}")

def generate_l3_lab(output_path):
    print("Generando Lab L3...")
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
    add_header_footer(doc, "Guía de Lab 3")
    
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
        ("CÓDIGO DE LECCIÓN", "PY-101-L3"),
        ("TÍTULO LECCIÓN", "Limpieza, transformación y validación"),
        ("TÍTULO LABORATORIO", "Lab 3: Casteo Seguro de Esquemas y Verificación Lógica Cruzada"),
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
    
    # Section 1: Objetivos
    h1 = doc.add_paragraph()
    r_h1 = h1.add_run("1. OBJETIVOS DEL LABORATORIO")
    format_run(r_h1, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    
    objectives = [
        "Verificar dtypes de columnas y aplicar casteo forzado de tipos numéricos y de fechas.",
        "Implementar agrupaciones groupby avanzadas para totalizar inconsistencias por categoría.",
        "Generar filtros relacionales cruzados para detectar incoherencias temporales (ej. fecha envío < fecha creación)."
    ]
    for obj in objectives:
        p_b = doc.add_paragraph(style='List Bullet')
        p_b.paragraph_format.space_after = Pt(4)
        p_b.add_run(obj).font.size = Pt(10)
        
    # Exercise 1
    h_ex1 = doc.add_paragraph()
    r_ex1 = h_ex1.add_run("Ejercicio 1: Casteo Seguro de Tipos de Datos (dtypes)")
    format_run(r_ex1, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    steps_ex1 = [
        "Cargue un conjunto de órdenes de compra con tipos lógicos erróneos:",
        "    import pandas as pd",
        "    df_ordenes = pd.read_excel('ordenes_compra.xlsx')",
        "    print(df_ordenes.dtypes)",
        "Castee la columna 'fecha_pedido' a tipo de fecha y 'monto_total' a float de forma segura:",
        "    df_ordenes['fecha_pedido'] = pd.to_datetime(df_ordenes['fecha_pedido'], errors='coerce')",
        "    df_ordenes['monto_total'] = pd.to_numeric(df_ordenes['monto_total'], errors='coerce')",
        "    print(df_ordenes.dtypes)"
    ]
    for step in steps_ex1:
        if step.strip().startswith("import") or step.strip().startswith("df_") or step.strip().startswith("print"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: La columna fecha_pedido debe figurar ahora como datetime64[ns] y monto_total como float64.")
    
    # Exercise 2
    h_ex2 = doc.add_paragraph()
    r_ex2 = h_ex2.add_run("Ejercicio 2: Validación Lógica Cruzada")
    format_run(r_ex2, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    steps_ex2 = [
        "Identifique transacciones cuyas fechas de envío sean inconsistentes con su creación:",
        "    df_ordenes['fecha_envio'] = pd.to_datetime(df_ordenes['fecha_envio'], errors='coerce')",
        "    # Encontrar incoherencias de orden temporal",
        "    anomalias_fechas = df_ordenes[df_ordenes['fecha_envio'] < df_ordenes['fecha_pedido']]",
        "    print('Cantidad de órdenes con fechas incoherentes:', len(anomalias_fechas))",
        "    anomalias_fechas.head()",
        "Implemente una validación cruzada matemática para asegurar consistencia de precios unitarios:",
        "    # Verificar que el total guardado sea coherente con precio * cantidad",
        "    df_ordenes['total_calculado'] = df_ordenes['precio_unitario'] * df_ordenes['cantidad']",
        "    anomalias_precios = df_ordenes[abs(df_ordenes['monto_total'] - df_ordenes['total_calculado']) > 0.01]",
        "    print('Discrepancias de total calculadas:', len(anomalias_precios))"
    ]
    for step in steps_ex2:
        if step.strip().startswith("df_") or step.strip().startswith("print") or step.strip().startswith("#") or step.strip().startswith("anomalias_"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: La tabla anomalias_fechas listará detalladamente aquellos IDs de transacción cuyo envío se registró antes que la creación del pedido.")
    
    doc.save(output_path)
    print(f"Guía de Lab L3 guardada exitosamente en {output_path}")


# ==========================================
# 2. GENERATE L4 DOCUMENTS
# ==========================================
def generate_l4_ficha(output_path):
    print("Generando Ficha de Lección L4...")
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
    add_header_footer(doc, "Lección 4")
    
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
        ("LECCIÓN N°", "4 de 4"),
        ("CÓDIGO", "PY-101-L4"),
        ("TÍTULO", "Reglas de validación automáticas y reporte final"),
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
        "Construir funciones de validación parametrizables y reutilizables en Python para automatizar rutinas repetitivas de QA sobre conjuntos de datos estructurados.",
        "Compilar resúmenes de calidad de datos que detallen porcentajes y tasas de cumplimiento de las reglas de consistencia de manera analítica.",
        "Generar gráficos explicativos con la librería matplotlib que evidencien visualmente el estado del dato ante equipos de desarrollo y directivos."
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
        "Programación modular de funciones de auditoría parametrizables en Python.",
        "Cálculo de métricas de cobertura y KPIs de calidad de datos.",
        "Creación de histogramas, diagramas de barras y visualizaciones base con matplotlib.",
        "Estructuración de tableros gráficos de resumen de calidad de datos."
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
        ("1", "Automatización de auditorías: Programación modular de funciones de validación reutilizables en Python", "30 min"),
        ("2", "Estructuración de resúmenes de calidad de datos y cálculo analítico de KPIs clave", "25 min"),
        ("3", "Creación de reportes y visualizaciones gráficas profesionales utilizando la librería matplotlib", "25 min"),
        ("4", "Taller práctico: Ejecución del pipeline de validación automatizada y generación de reportes", "30 min"),
        ("5", "Evaluación final, retroalimentación del curso de capacitación y cierre", "10 min")
    ]
    col_widths_agenda = [Inches(0.6), Inches(4.7), Inches(1.2)]
    
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
    doc.save(output_path)
    print(f"Ficha L4 generada en {output_path}")

def generate_l4_presentation(output_path):
    print("Generando Presentación L4...")
    prs = Presentation()
    prs.slide_width = PtInches(13.333)
    prs.slide_height = PtInches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    slides_data = [
        {
            "type": "portada",
            "title": "Reglas de validación automáticas y reporte final",
            "subtitle": "CURSO: PY-101 — Python y DuckDB para el Aseguramiento de Calidad y Consistencia de Datos",
            "footer": "Lección 4 de 4  |  Código: PY-101-L4",
            "notes": "Bienvenidos a la última sesión del curso. Hoy integraremos todo el conocimiento construyendo un pipeline de auditoría automática reutilizable y crearemos reportes visuales ejecutivos."
        },
        {
            "type": "content",
            "title": "Agenda de la Sesión",
            "bullets": [
                "01. Automatización: Funciones modulares de validación de datos [30 min]",
                "02. Cuantificación: KPIs y resúmenes métricos de calidad de datos [25 min]",
                "03. Visualización: Creación de tableros y reportes visuales con matplotlib [25 min]",
                "04. Taller práctico: Ejecución del pipeline automático sobre transacciones finales [30 min]",
                "05. Retroalimentación, evaluación final y cierre del curso [10 min]"
            ],
            "notes": "Dividiremos la sesión entre codificación de funciones de control y la estructuración del reporte final en formato de gráficos ejecutivos."
        },
        {
            "type": "content",
            "title": "Objetivos de Aprendizaje",
            "bullets": [
                "Crear funciones parametrizables en Python para automatizar validaciones lógicas repetitivas.",
                "Estructurar un DataFrame de reporte consolidando la tasa de cumplimiento de cada regla.",
                "Utilizar la librería matplotlib para trazar gráficos informativos que evidencien visualmente el diagnóstico de calidad."
            ],
            "notes": "Buscamos capacitar al alumno para que deje de correr consultas manuales de manera unitaria y pase a ejecutar pipelines completos reutilizables."
        },
        {
            "type": "content",
            "title": "Automatización: Funciones de Control",
            "bullets": [
                "Programación modular: Encapsular reglas lógicas dentro de funciones de Python (def) que acepten un DataFrame como parámetro.",
                "Retorno consistente: Diseñar las funciones para que retornen una tupla (estatus: bool, registros_con_falla: DataFrame).",
                "Reutilización: Permitir auditar múltiples datasets de entrada con un único conjunto estructurado de funciones core.",
                "Mantenibilidad: Modificar una única función central para actualizar una regla de negocio en todo el pipeline."
            ],
            "notes": "Las funciones parametrizadas permiten auditar datasets masivos de manera idéntica en cada ciclo de pruebas, automatizando rutinas repetitivas que antes requerían horas en Excel."
        },
        {
            "type": "content",
            "title": "Reporte Gráfico con matplotlib",
            "bullets": [
                "Visualización ejecutiva: Traducir conteos y tablas de fallos a gráficos que comuniquen de inmediato el estado general de los datos.",
                "Gráficos de barras: Excelentes para comparar el volumen de registros con fallas frente a registros válidos.",
                "Gráficos circulares o de dona: Ideales para mostrar el porcentaje global de consistencia y tasa de completitud.",
                "Comunicación efectiva: Presentar resúmenes gráficos a los equipos de desarrollo acelera drásticamente la depuración de errores lógicos."
            ],
            "notes": "Una imagen vale más que mil palabras, sobre todo en control de calidad. Mostrar un reporte de dona con la distribución de nulos o duplicados permite enfocar los esfuerzos del equipo de desarrollo inmediatamente."
        },
        {
            "type": "content",
            "title": "Taller Práctico Final: Pipeline Automatizado",
            "bullets": [
                "Fase 1: Diseñar tres funciones para verificar nulos, duplicados y consistencia temporal cruzada en órdenes.",
                "Fase 2: Ejecutar secuencialmente las funciones recopilando el conteo de errores lógicos en un diccionario.",
                "Fase 3: Calcular KPIs consolidados (tasa de error por regla, porcentaje de integridad global).",
                "Fase 4: Generar y guardar como imagen el gráfico de barras que detalla las inconsistencias detectadas.",
                "Fase 5: Exportar los resultados de inconsistencias para su remediación."
            ],
            "notes": "La práctica final integrará todas las lecciones del curso. Construiremos un script que toma datos crudos, ejecuta el pipeline completo de validación y emite un reporte de calidad gráfico automatizado."
        }
    ]
    
    for slide_info in slides_data:
        slide = prs.slides.add_slide(blank_layout)
        notes_slide = slide.notes_slide
        notes_slide.notes_text_frame.text = slide_info.get("notes", "")
        
        if slide_info["type"] == "portada":
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
    print(f"PPT L4 generada en {output_path}")

def generate_l4_lab(output_path):
    print("Generando Lab L4...")
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
    add_header_footer(doc, "Guía de Lab 4")
    
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
        ("CÓDIGO DE LECCIÓN", "PY-101-L4"),
        ("TÍTULO LECCIÓN", "Reglas de validación automáticas y reporte final"),
        ("TÍTULO LABORATORIO", "Lab 4: Automatización de Pipelines y Estructuración de Reportes Gráficos de QA"),
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
    
    # Section 1: Objetivos
    h1 = doc.add_paragraph()
    r_h1 = h1.add_run("1. OBJETIVOS DEL LABORATORIO")
    format_run(r_h1, size_pt=12, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    
    objectives = [
        "Encapsular reglas lógicas en funciones modulares parametrizables de Python.",
        "Implementar un pipeline automatizado de control de calidad sobre múltiples datasets.",
        "Generar un reporte visual interactivo en formato de gráfico de barras utilizando matplotlib."
    ]
    for obj in objectives:
        p_b = doc.add_paragraph(style='List Bullet')
        p_b.paragraph_format.space_after = Pt(4)
        p_b.add_run(obj).font.size = Pt(10)
        
    # Exercise 1
    h_ex1 = doc.add_paragraph()
    r_ex1 = h_ex1.add_run("Ejercicio 1: Modularización de Funciones de Validación")
    format_run(r_ex1, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    steps_ex1 = [
        "Defina una función genérica en su notebook para comprobar si existen nulos en columnas clave:",
        "    def validar_nulos(df, columnas):",
        "        errores = df[df[columnas].isna().any(axis=1)]",
        "        print(f'Validacion de nulos: {len(errores)} fallas encontradas.')",
        "        return errores",
        "Defina una función para verificar si hay duplicados en base a un campo llave:",
        "    def validar_duplicados(df, llave):",
        "        errores = df[df.duplicated(subset=[llave], keep=False)]",
        "        print(f'Validacion de duplicados: {len(errores)} fallas encontradas.')",
        "        return errores"
    ]
    for step in steps_ex1:
        if step.strip().startswith("def") or step.strip().startswith("errores") or step.strip().startswith("print") or step.strip().startswith("return"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: Las funciones quedarán disponibles en memoria listas para aceptar cualquier DataFrame como argumento.")
    
    # Exercise 2
    h_ex2 = doc.add_paragraph()
    r_ex2 = h_ex2.add_run("Ejercicio 2: Creación de Reportes con matplotlib")
    format_run(r_ex2, size_pt=11, bold=True, rgb_color=COLOR_PRIMARY_RGB)
    
    steps_ex2 = [
        "Instale matplotlib si no la tiene instalada ejecutando en su terminal:",
        "    pip install matplotlib",
        "Genere un reporte visual de barras detallando las fallas de calidad lógicas encontradas:",
        "    import matplotlib.pyplot as plt",
        "    reglas = ['Validez Email', 'Duplicados ID', 'Fechas Incoherentes']",
        "    fallas = [12, 4, 8]  # Valores resultantes de la ejecucion",
        "    plt.figure(figsize=(8, 4))",
        "    plt.bar(reglas, fallas, color='darkred')",
        "    plt.title('Distribución de Inconsistencias por Regla de Calidad')",
        "    plt.ylabel('Cantidad de Registros Erróneos')",
        "    plt.savefig('reporte_calidad_final.png')",
        "    plt.show()"
    ]
    for step in steps_ex2:
        if step.strip().startswith("import") or step.strip().startswith("reglas") or step.strip().startswith("fallas") or step.strip().startswith("plt.") or step.strip().startswith("pip"):
            p_code = doc.add_paragraph()
            p_code.paragraph_format.left_indent = Inches(0.6)
            p_code.paragraph_format.space_after = Pt(4)
            run_c = p_code.add_run(step)
            format_run(run_c, font_name="Consolas", size_pt=9.5, rgb_color=COLOR_PRIMARY_RGB)
        else:
            p_step = doc.add_paragraph(style='List Number')
            p_step.paragraph_format.space_after = Pt(4)
            run_s = p_step.add_run(step)
            format_run(run_s, size_pt=10)
            
    add_callout(doc, "✓ CHECKPOINT: Matplotlib desplegará la interfaz del gráfico de barras interactivo y guardará el archivo 'reporte_calidad_final.png' en su disco local.")
    
    doc.save(output_path)
    print(f"Guía de Lab L4 guardada exitosamente en {output_path}")

if __name__ == "__main__":
    base_dir = r"C:\Users\ianache\Desktop\DATA\01-DOCUMENTOS\02-PROYECTOS\112-skillvault\PY-101"
    
    # Generate Lesson 3
    generate_l3_ficha(os.path.join(base_dir, "PY-101-L3-ficha.docx"))
    generate_l3_presentation(os.path.join(base_dir, "PY-101-L3-presentacion.pptx"))
    generate_l3_lab(os.path.join(base_dir, "PY-101-L3-lab.docx"))
    
    # Generate Lesson 4
    generate_l4_ficha(os.path.join(base_dir, "PY-101-L4-ficha.docx"))
    generate_l4_presentation(os.path.join(base_dir, "PY-101-L4-presentacion.pptx"))
    generate_l4_lab(os.path.join(base_dir, "PY-101-L4-lab.docx"))
    
    print("PROCESO DE GENERACIÓN LECCIONES 3 Y 4 COMPLETADO CON ÉXITO.")
