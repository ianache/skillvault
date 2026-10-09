"""Mantiene el Glosario de negocio: un archivo OKF v0.2 por término y un catálogo índice generado.

Uso (<dir> es la carpeta del glosario, p. ej. knowledge-base/business/glossary):
    python glossary.py new <dir> "<Nombre>"  # crea terms/TRM-NNNN-<slug>.md desde la plantilla
    python glossary.py build <dir>           # sincroniza description/sources de cada término y regenera el índice
    python glossary.py check <dir>           # valida términos e índice; sale con código 1 si hay errores
"""
import glob
import os
import re
import sys
import unicodedata

CATALOG = "GLS-001-glosario-de-negocio.md"
TEMPLATE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "templates", "term-template.md")
IDX_START, IDX_END = "<!-- glossary:index:start -->", "<!-- glossary:index:end -->"
FILE_RE = re.compile(r"^(TRM-\d{4})-[a-z0-9-]+\.md$")
FIELD = re.compile(r"^- \*\*(.+?):\*\*\s*(.*)$")
SOURCE = re.compile(r"^\s+- \[(N[123])\]\s+(.+)$")
CITATION = re.compile(r"\s*\[[^\]]*\]")
LINK = re.compile(r"\]\(([^)#]+\.md)(?:#[^)]*)?\)")

REQUIRED = ["ID", "Tipo", "Sinónimos", "Definición", "Ámbito", "Fuentes",
            "Clasificación", "Confianza", "Responsable"]
ALLOWED = {
    "Tipo": {"concepto", "término", "sigla", "abreviatura"},
    "Clasificación": {"fact", "decision", "assumption", "inference", "gap"},
    "Confianza": {"high", "medium", "low"},
}
STATUS = {"draft", "approved", "deprecated"}
NONE = {"", "—", "-"}
SLUG_MAX = 40


def sort_key(text):
    """Orden alfabético del español: sin mayúsculas ni tildes, Ñ tras N, cifras primero."""
    text = text.lower().replace("ñ", "n\x7f")
    text = "".join(c for c in unicodedata.normalize("NFD", text)
                   if unicodedata.category(c) != "Mn")
    return re.sub(r"[^0-9a-z\x7f ]", "", text).strip()


def slugify(text):
    text = "".join(c for c in unicodedata.normalize("NFD", text.lower())
                   if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    if len(text) > SLUG_MAX:  # rutas de Windows: máximo 260 caracteres
        text = text[:SLUG_MAX].rsplit("-", 1)[0]
    return text


def letter(name):
    key = sort_key(name)
    if not key:
        return "#"
    if key[0].isdigit():
        return "0–9"
    if key.startswith("n\x7f"):
        return "Ñ"
    return key[0].upper()


def split_values(value):
    """'A [src]; B [src]' -> ['A', 'B']"""
    if value.strip() in NONE:
        return []
    return [v for v in (CITATION.sub("", part).strip() for part in value.split(";")) if v]


def yaml_str(text):
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def parse_front(front):
    """Claves de primer nivel y de un nivel anidado ('generated.by'); ignora listas."""
    meta, parent = {}, None
    for line in front.split("\n"):
        top = re.match(r"^(\w+):[ \t]*(.*)$", line)
        sub = re.match(r"^[ \t]+(\w+):[ \t]*(.*)$", line)
        if top:
            parent = top.group(1)
            meta[parent] = top.group(2).strip().strip('"')
        elif sub and parent:
            meta[f"{parent}.{sub.group(1)}"] = sub.group(2).strip().strip('"')
    return meta


class Term:
    def __init__(self, path):
        self.path, self.file = path, os.path.basename(path)
        m = FILE_RE.match(self.file)
        self.id = m.group(1) if m else None
        self.text = read(path)
        parts = self.text.split("---", 2)
        has_front = self.text.startswith("---") and len(parts) == 3
        self.front, self.body = (parts[1], parts[2]) if has_front else ("", self.text)
        self.meta = parse_front(self.front)
        self.title = self.meta.get("title", "")
        self.fields, self.sources = {}, []
        current = None
        for line in self.body.split("\n"):
            m = FIELD.match(line)
            if m:
                current = m.group(1)
                self.fields[current] = m.group(2).strip()
            elif current == "Fuentes" and SOURCE.match(line):
                level, rest = SOURCE.match(line).groups()
                pieces = rest.rsplit(" — ", 2)
                locator = pieces[1].strip() if len(pieces) == 3 else ""
                self.sources.append((level, locator))

    def aliases(self):
        names = split_values(self.fields.get("Sinónimos", ""))
        full = CITATION.sub("", self.fields.get("Forma completa", "")).strip()
        if full and full.lower() != "desconocida" and full not in NONE:
            names.append(full)
        return names

    def source_block(self):
        """Bloque 'sources:' del frontmatter derivado de las Fuentes del cuerpo."""
        lines, used = ["sources:"], {}
        for _, locator in self.sources:
            resource = re.sub(r":L\d+(?:-L?\d+)?$", "", locator)
            if not resource or resource in used.values():
                continue
            if resource.startswith("http"):
                base = slugify(re.sub(r"^https?://(www\.)?", "", resource).split("/")[0])
            else:
                stem = os.path.splitext(os.path.basename(resource))[0]
                m = re.match(r"^[A-Za-z]+-\d+", stem)
                base = (m.group(0) if m else stem).lower()
            sid, n = base, 2
            while sid in used:
                sid, n = f"{base}-{n}", n + 1
            used[sid] = resource
            lines += [f"  - id: {sid}", f"    resource: {resource}"]
        return "\n".join(lines)

    def synced_text(self):
        front = re.sub(r"^description:.*$", lambda _: "description: " + yaml_str(self.fields.get("Definición", "")),
                       self.front, count=1, flags=re.M)
        front = re.sub(r"^sources:[ \t]*(?:\n[ \t]+.*)*", lambda _: self.source_block(), front,
                       count=1, flags=re.M)
        return "---" + front + "---" + self.body


def load_terms(folder):
    return [Term(p) for p in sorted(glob.glob(os.path.join(folder, "terms", "*.md")))]


def render_index(terms):
    rows = []
    for t in terms:
        link = f"[{t.title}](terms/{t.file})"
        rows.append((t.title, f"| {link} | {t.fields.get('Tipo', '')} | {t.fields.get('Definición', '')} | {t.meta.get('status', '')} |"))
        for alias in t.aliases():
            rows.append((alias, f"| *{alias}* → {link} | | | |"))
    out, group = [], None
    for name, row in sorted(rows, key=lambda r: sort_key(r[0])):
        if letter(name) != group:
            group = letter(name)
            out += ["", f"### {group}", "", "| Término | Tipo | Definición | Estado |", "|---|---|---|---|"]
        out.append(row)
    return "\n".join(out).strip()


def cmd_new(folder, name):
    terms = load_terms(folder)
    used = [int(t.id[4:]) for t in terms if t.id]
    tid = f"TRM-{(max(used) if used else 0) + 1:04d}"
    path = os.path.join(folder, "terms", f"{tid}-{slugify(name)}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    write(path, read(TEMPLATE).replace("<Nombre del término>", name).replace("TRM-NNNN", tid))
    print(path)


def cmd_build(folder):
    for t in load_terms(folder):
        new = t.synced_text()
        if new != t.text:
            write(t.path, new)
    terms = load_terms(folder)
    catalog = os.path.join(folder, CATALOG)
    text = read(catalog)
    text = re.sub(re.escape(IDX_START) + r".*?" + re.escape(IDX_END),
                  lambda _: f"{IDX_START}\n{render_index(terms)}\n{IDX_END}", text, flags=re.S)
    write(catalog, text)
    print(f"{len(terms)} términos sincronizados; índice regenerado.")


def check_term(t, files):
    errors = []
    if not t.id:
        errors.append("el nombre debe ser TRM-NNNN-<slug>.md")
    if t.fields.get("ID") != t.id:
        errors.append(f"el campo ID '{t.fields.get('ID')}' no coincide con el archivo")
    if t.meta.get("type") != "Business Term":
        errors.append("el frontmatter debe tener type: Business Term")
    for key in ("title", "description", "status", "generated.by", "generated.at"):
        if not t.meta.get(key) or t.meta[key].startswith("<"):
            errors.append(f"frontmatter sin '{key}'")
    verified = t.meta.get("verified.by") and t.meta.get("verified.at")
    if t.meta.get("status") == "approved" and not verified:
        errors.append("status approved requiere verified.by y verified.at (asignados por un flujo humano)")
    if "verified" in t.meta and t.meta.get("status") != "approved":
        errors.append("tiene 'verified' pero su status no es approved")
    if t.meta.get("status") and t.meta["status"] not in STATUS:
        errors.append(f"status '{t.meta['status']}' no es uno de {sorted(STATUS)}")
    if not re.search(r"^# " + re.escape(t.title) + r"\s*$", t.body, flags=re.M):
        errors.append(f"falta el encabezado '# {t.title}' igual al title")
    for field in REQUIRED:
        value = t.fields.get(field)
        if value is None or (value in NONE and field not in ("Sinónimos", "Fuentes")) or value.startswith("<"):
            errors.append(f"campo obligatorio vacío o sin completar: {field}")
    for field, value in t.fields.items():
        if field not in REQUIRED and value.startswith("<"):
            errors.append(f"campo opcional con texto de plantilla: {field} (complétalo o borra la línea)")
    for field, allowed in ALLOWED.items():
        value = t.fields.get(field)
        if value and value not in allowed:
            errors.append(f"{field} = '{value}' no es uno de {sorted(allowed)}")
    if t.fields.get("Tipo") in ("sigla", "abreviatura") and t.fields.get("Forma completa", "") in NONE:
        errors.append("una sigla o abreviatura necesita 'Forma completa' (o 'Desconocida')")
    if not t.sources:
        errors.append("sin fuentes con formato '  - [N1|N2|N3] título — localizador — consultada AAAA-MM-DD'")
    elif not {"N1", "N2"} & {lvl for lvl, _ in t.sources} and t.fields.get("Clasificación") != "gap":
        errors.append("sin fuente N1/N2; la clasificación debe ser 'gap'")
    for lvl, locator in t.sources:
        if not locator or locator.startswith("<"):
            errors.append(f"fuente [{lvl}] sin localizador")
    for target in LINK.findall(t.fields.get("Relacionados", "")):
        if os.path.basename(target) not in files:
            errors.append(f"Relacionados apunta a un término que no existe: {target}")
    if t.synced_text() != t.text:
        errors.append("description o sources no coinciden con el cuerpo: ejecuta 'build'")
    return errors


def cmd_check(folder):
    terms, errors, ids, names = load_terms(folder), [], {}, {}
    files = {t.file for t in terms}
    for t in terms:
        errors += [f"{t.file}: {e}" for e in check_term(t, files)]
        if t.id in ids:
            errors.append(f"{t.file}: ID duplicado (también en {ids[t.id]})")
        ids[t.id] = t.file
        for name in [t.title] + t.aliases():
            key = sort_key(name)
            if key in names and names[key] != t.file:
                errors.append(f"{t.file}: '{name}' ya existe como término o alias en {names[key]}")
            names.setdefault(key, t.file)
    catalog = os.path.join(folder, CATALOG)
    if not os.path.exists(catalog):
        errors.append(f"No existe el catálogo {CATALOG}")
    else:
        text = read(catalog)
        current = text.split(IDX_START, 1)[1].split(IDX_END, 1)[0].strip() if IDX_START in text else None
        if current != render_index(terms):
            errors.append(f"{CATALOG}: el índice no coincide con los términos: ejecuta 'build'")
        for target in LINK.findall(text):
            if target.startswith("terms/") and os.path.basename(target) not in files:
                errors.append(f"{CATALOG}: enlace a un término que no existe: {target}")
    for err in errors:
        print("ERROR", err)
    print(f"{len(terms)} términos revisados, {len(errors)} errores.")
    return 1 if errors else 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    if args[:1] == ["new"] and len(args) == 3:
        cmd_new(args[1], args[2])
    elif args[:1] == ["build"] and len(args) == 2:
        cmd_build(args[1])
    elif args[:1] == ["check"] and len(args) == 2:
        sys.exit(cmd_check(args[1]))
    else:
        sys.exit(__doc__)
