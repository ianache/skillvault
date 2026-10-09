"""Valida la consistencia de un modelo de información conceptual (IMD-NNN).

Uso:
    python check_model.py <modelo.md> [--skip-links] [--extract <carpeta>]

Comprueba:
- que cada concepto de los diagramas Mermaid esté en la tabla de conceptos (columna "Nombre en diagrama") y viceversa;
- que cada relación R-NN tenga cardinalidad, una clasificación válida y fuente;
- que las relaciones INFERENCE del diagrama estén marcadas con "(inf.)" (aviso si ninguna lo está);
- que no queden textos de plantilla "<...>";
- que los enlaces relativos a archivos .md existan (salvo --skip-links).
Con --extract escribe cada diagrama Mermaid como d1.mmd, d2.mmd… en <carpeta> para validarlo con mermaid-cli.
Sale con código 1 si hay errores.
"""
import os
import re
import sys

CLASSES = ("FACT", "INFERENCE", "UNKNOWN", "RETIRADA")
EDGE = re.compile(r"^\s*([A-Z0-9_]+)\s+[|}o][|o]?--[|o][|{o]?\s+([A-Z0-9_]+)\s*:\s*\"([^\"]*)\"")
ENTITY_ONLY = re.compile(r"^\s*([A-Z0-9_]+)\s*\{")


def table_rows(text, heading):
    """Filas de la primera tabla bajo un encabezado '## N. <heading>'."""
    m = re.search(r"^## \d+\. " + re.escape(heading) + r".*?$(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not m:
        return None
    rows = [l for l in m.group(1).splitlines() if l.startswith("|")]
    if len(rows) < 2:
        return []
    header = [c.strip() for c in rows[0].strip("|").split("|")]
    out = []
    for line in rows[2:]:
        cells = [c.strip() for c in line.strip("|").split("|")]
        out.append(dict(zip(header, cells)))
    return out


def main(path, skip_links, extract_dir=None):
    text = open(path, encoding="utf-8").read()
    errors, warnings = [], []
    if extract_dir:
        os.makedirs(extract_dir, exist_ok=True)
        for i, block in enumerate(re.findall(r"```mermaid\n(.*?)```", text, re.S), 1):
            with open(os.path.join(extract_dir, f"d{i}.mmd"), "w", encoding="utf-8") as fh:
                fh.write(block)
            print(f"Diagrama extraído: {os.path.join(extract_dir, f'd{i}.mmd')}")

    diagram_entities, inf_edges = set(), 0
    for block in re.findall(r"```mermaid\n(.*?)```", text, re.S):
        if "erDiagram" not in block:
            continue
        for line in block.splitlines():
            m = EDGE.match(line)
            if m:
                diagram_entities.update([m.group(1), m.group(2)])
                inf_edges += "(inf.)" in m.group(3)
            elif ENTITY_ONLY.match(line):
                diagram_entities.add(ENTITY_ONLY.match(line).group(1))
    if not diagram_entities:
        errors.append("No hay diagramas erDiagram con relaciones.")

    concepts = table_rows(text, "Conceptos")
    if concepts is None:
        errors.append("Falta la sección '## 4. Conceptos'.")
        concepts = []
    table_names = set()
    for row in concepts:
        name = row.get("Nombre en diagrama", "")
        if not name:
            errors.append(f"Concepto '{row.get('Concepto', '?')}' sin 'Nombre en diagrama'.")
            continue
        if name.startswith(("—", "-")):
            continue  # concepto derivado: no aparece en diagramas
        for n in re.split(r"[,/ ]+", name):
            if n:
                table_names.add(n.strip("`"))
        if not row.get("Glosario"):
            errors.append(f"Concepto '{row.get('Concepto')}' sin columna Glosario.")
        if not row.get("Fuente"):
            errors.append(f"Concepto '{row.get('Concepto')}' sin fuente.")
    for e in sorted(diagram_entities - table_names):
        errors.append(f"'{e}' aparece en un diagrama pero no en la tabla de conceptos.")
    for e in sorted(table_names - diagram_entities):
        warnings.append(f"'{e}' está en la tabla de conceptos pero en ningún diagrama.")

    relations = table_rows(text, "Relaciones")
    if relations is None:
        errors.append("Falta la sección '## 5. Relaciones'.")
        relations = []
    seen, n_inf = set(), 0
    for row in relations:
        rid = row.get("ID", "")
        if not re.fullmatch(r"R-\d{2,}", rid):
            errors.append(f"Relación con ID inválido: '{rid}'.")
        if rid in seen:
            errors.append(f"ID de relación duplicado: {rid}.")
        seen.add(rid)
        cls = row.get("Clasificación", "")
        if not any(c in cls for c in CLASSES):
            errors.append(f"{rid}: la clasificación debe incluir {', '.join(CLASSES)}.")
        n_inf += "INFERENCE" in cls
        for col in ("Relación", "Cardinalidad", "Fuente"):
            if not row.get(col):
                errors.append(f"{rid}: falta '{col}'.")
    if n_inf and not inf_edges:
        warnings.append("Hay relaciones INFERENCE en la tabla, pero ninguna arista del diagrama lleva '(inf.)'.")

    for placeholder in re.findall(r"<[A-Za-zÁÉÍÓÚáéíóúñ][^<>\n]{2,}>", text):
        if not placeholder.startswith("<a ") and not placeholder.startswith("</"):
            errors.append(f"Texto de plantilla sin completar: {placeholder}")

    if not skip_links:
        base = os.path.dirname(os.path.abspath(path))
        for target in sorted(set(re.findall(r"\]\(([^)#:]+\.md)(?:#[^)]*)?\)", text))):
            if not os.path.exists(os.path.normpath(os.path.join(base, target))):
                errors.append(f"Enlace roto: {target}")

    for w in warnings:
        print("AVISO", w)
    for e in errors:
        print("ERROR", e)
    print(f"{len(diagram_entities)} conceptos en diagramas, {len(relations)} relaciones, "
          f"{len(errors)} errores, {len(warnings)} avisos.")
    return 1 if errors else 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    argv = sys.argv[1:]
    extract = None
    if "--extract" in argv:
        i = argv.index("--extract")
        if i + 1 >= len(argv):
            sys.exit(__doc__)
        extract = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    args = [a for a in argv if a != "--skip-links"]
    if len(args) != 1:
        sys.exit(__doc__)
    sys.exit(main(args[0], "--skip-links" in argv, extract))
