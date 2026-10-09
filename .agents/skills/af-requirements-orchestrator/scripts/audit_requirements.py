#!/usr/bin/env python3
"""Audita el estado de calidad de los artefactos de requerimientos de una knowledge-base.

Uso:
    python audit_requirements.py <knowledge-base-dir> [--json]

Comprueba, de forma determinista, lo que no requiere juicio:
  - User Stories: frontmatter, 17 secciones, placeholders sin llenar, preparación,
    preguntas que bloquean, reglas BR-* inexistentes, enlaces rotos al glosario.
  - Inventario de Context Packs, glosario, reglas y modelos conceptuales.
Lo que requiere juicio (ambigüedad, completitud real) lo evalúa el orquestador.

Código de salida: 0 sin errores, 1 con errores.
"""
import json
import re
import sys
from pathlib import Path

RULE_ID = re.compile(r"\bBR-[A-Z]+-\d+\b")
LINK = re.compile(r"\]\(([^)#\s]+\.md)(?:#[^)]*)?\)")
PLACEHOLDER = re.compile(r"<[^<>\n]{2,80}>")
READINESS = re.compile(r"^\|\s*Preparación\s*\|\s*(READY|CONDITIONAL|NOT READY)\b", re.M)
H2 = re.compile(r"^## (\d+)\.", re.M)


def read(path):
    return path.read_text(encoding="utf-8")


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    return m.group(1) if m else None


def strip_code(text):
    """Quita bloques de código y comentarios HTML para no marcar <...> legítimos."""
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def section(text, num):
    m = re.search(rf"^## {num}\..*?$(.*?)(?=^## \d+\.|\Z)", text, re.S | re.M)
    return m.group(1) if m else ""


def blocking_questions(text):
    out = []
    for line in section(text, 12).splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 6 and not set(cells[0]) <= set("-: ") and cells[0] != "ID":
            if cells[4].startswith("Sí") and cells[5].startswith("Abierta"):
                out.append(cells[0])
    return out


def known_rules(kb):
    ids = set()
    for p in (kb / "business" / "rules").glob("*.md"):
        ids |= set(RULE_ID.findall(read(p)))
    return ids


def audit_story(path, rules):
    text = read(path)
    errors, warnings = [], []
    if frontmatter(text) is None:
        errors.append("sin frontmatter OKF")
    else:
        fm = frontmatter(text)
        if "status:" not in fm:
            errors.append("frontmatter sin status")
        if re.search(r"^verified:", fm, re.M):
            warnings.append("tiene 'verified' (solo un flujo humano debe asignarlo)")
    sections = {int(n) for n in H2.findall(text)}
    missing = sorted(set(range(1, 18)) - sections)
    legacy = not sections
    if legacy:
        errors.append("formato legado: no sigue output-template de af-user-story-refiner (re-refinar)")
    elif missing:
        errors.append(f"faltan secciones {missing}")
    left = PLACEHOLDER.findall(strip_code(text))
    if left:
        errors.append(f"placeholders sin llenar: {left[:3]}")
    m = READINESS.search(text)
    readiness = m.group(1) if m else None
    if readiness is None and not legacy:
        errors.append("sin preparación (READY/CONDITIONAL/NOT READY)")
    blocking = blocking_questions(text)
    if readiness == "READY" and blocking:
        errors.append(f"READY con preguntas que bloquean: {blocking}")
    unknown = sorted(set(RULE_ID.findall(text)) - rules) if rules else []
    if unknown:
        errors.append(f"reglas que no existen en el catálogo: {unknown}")
    for target in LINK.findall(text):
        if target.startswith(("http", "/")):
            continue
        if not (path.parent / target).resolve().exists():
            errors.append(f"enlace roto: {target}")
    if "Sin regla" in text and not blocking_questions(text) and "US-" not in section(text, 12):
        warnings.append("hay 'Sin regla' pero no hay pregunta abierta asociada")
    return {
        "file": path.name,
        "readiness": readiness,
        "blocking": blocking,
        "errors": errors,
        "warnings": warnings,
    }


def inventory(kb):
    def count(rel, pattern="*.md"):
        d = kb / rel
        return len(list(d.glob(pattern))) if d.exists() else 0

    return {
        "context_packs": count("requirement/context-packs"),
        "rule_catalogs": count("business/rules"),
        "glossary_terms": count("business/glossary/terms"),
        "conceptual_models": count("business/information-model"),
        "user_stories": count("requirement/user-stories", "US-*.md"),
        "specs": count("requirement/specs"),
        "open_question_registers": count("business/open-questions"),
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    kb = Path(args[0])
    if not kb.is_dir():
        print(f"No existe el directorio: {kb}")
        return 2
    rules = known_rules(kb)
    stories_dir = kb / "requirement" / "user-stories"
    stories = [
        audit_story(p, rules)
        for p in sorted(stories_dir.glob("US-*.md"))
        # los consolidados .okf.md y *-consolidated.md no siguen el formato de una historia
        if not p.name.endswith((".okf.md", "-consolidated.md"))
    ] if stories_dir.exists() else []
    report = {"inventory": inventory(kb), "stories": stories}
    n_err = sum(len(s["errors"]) for s in stories)
    report["totals"] = {
        "stories_audited": len(stories),
        "errors": n_err,
        "ready": sum(s["readiness"] == "READY" for s in stories),
        "conditional": sum(s["readiness"] == "CONDITIONAL" for s in stories),
        "not_ready": sum(s["readiness"] == "NOT READY" for s in stories),
    }
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("Inventario:", ", ".join(f"{k}={v}" for k, v in report["inventory"].items()))
        for s in stories:
            flag = "ERR" if s["errors"] else "ok "
            print(f"[{flag}] {s['file']} · {s['readiness']}")
            for e in s["errors"]:
                print(f"       error: {e}")
            for w in s["warnings"]:
                print(f"       aviso: {w}")
        t = report["totals"]
        print(f"Resumen: {t['stories_audited']} historias, {t['errors']} errores, "
              f"READY={t['ready']} CONDITIONAL={t['conditional']} NOT READY={t['not_ready']}")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main())
