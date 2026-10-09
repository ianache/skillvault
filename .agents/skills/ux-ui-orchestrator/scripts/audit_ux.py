#!/usr/bin/env python3
"""Audita la consistencia y trazabilidad de los artefactos de diseño UX/UI de una knowledge-base.

Uso:
    python audit_ux.py <knowledge-base-dir> [--json]

Comprueba, de forma determinista, lo que no requiere juicio:
  - UXR: frontmatter, historias US-* referenciadas que existen, UXR sin flujo.
  - FLW: pantallas SCR-* declaradas y coincidencia FLW <-> SCR en ambos sentidos.
  - SCR: campos obligatorios (flow, requirements, required_states, a11y_requirements),
    FLW existente, sin referencias externas (project_ref/artifact_ref) en el SCR.
  - DTM: una entrada por SCR; exploration_design/governed_design y divergencia sin resolver.
  - ARP: SCR sin informe de accesibilidad.
  - Enlaces markdown rotos y 'verified' fabricado.
Lo que requiere juicio (ver references/quality-criteria.md) lo evalúa el orquestador.
El preflight y el gate de ux-development-handoff/validators/cli.py son complementarios.

Código de salida: 0 sin errores, 1 con errores, 2 uso incorrecto.
"""
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    print("Requiere PyYAML: pip install pyyaml")
    sys.exit(2)

LINK = re.compile(r"\]\(([^)#\s]+\.md)(?:#[^)]*)?\)")
SCR_ID = re.compile(r"\bSCR-\d+(?:-\d+)?\b")
EXTERNAL_REFS = ("project_ref", "artifact_ref", "node_ref", "file_ref")


def read(path):
    return path.read_text(encoding="utf-8")


def frontmatter(path):
    text = read(path)
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
    if not m:
        return None
    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None
    return data if isinstance(data, dict) else None


def listify(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def broken_links(path):
    out = []
    text = re.sub(r"```.*?```", "", read(path), flags=re.S)
    for target in LINK.findall(text):
        if target.startswith(("http", "/")):
            continue
        if not (path.parent / target).resolve().exists():
            out.append(target)
    return out


def md_files(d, pattern="*.md"):
    return sorted(d.glob(pattern)) if d.exists() else []


def load_screens(design):
    """Devuelve {scr_id: (archivo, dict)} de todos los SCR declarados, un archivo puede declarar varios."""
    screens, errors = {}, []
    for p in md_files(design / "screens"):
        fm = frontmatter(p)
        if fm is None:
            errors.append(f"{p.name}: sin frontmatter OKF legible")
            continue
        if re.search(r"^verified:", read(p), re.M):
            errors.append(f"{p.name}: tiene 'verified' (solo un flujo humano debe asignarlo)")
        for s in listify(fm.get("screens")):
            if isinstance(s, dict) and s.get("id"):
                screens[s["id"]] = (p.name, s)
    return screens, errors


def audit(kb):
    design = kb / "design"
    errors, warnings = [], []

    def err(msg):
        errors.append(msg)

    def warn(msg):
        warnings.append(msg)

    stories = {p.name.split("-")[0] + "-" + p.name.split("-")[1] for p in md_files(kb / "requirement" / "user-stories", "US-*.md")}
    screens, screen_errors = load_screens(design)
    errors.extend(screen_errors)

    # --- FLW
    flows = {}
    for p in md_files(design / "user-flows", "FLW-*.md"):
        fm = frontmatter(p)
        if fm is None:
            err(f"{p.name}: sin frontmatter OKF legible")
            continue
        fid = fm.get("id") or p.name.split("-")[0] + "-" + p.name.split("-")[1]
        flows[fid] = {"file": p.name, "screens": listify(fm.get("screens")), "reqs": listify(fm.get("requirements"))}
        if not flows[fid]["screens"]:
            warn(f"{p.name}: screens vacío (¿hay pregunta abierta que lo justifique?)")
        for bl in broken_links(p):
            err(f"{p.name}: enlace roto: {bl}")

    # --- UXR
    uxr_ids, flow_reqs = set(), set()
    for f in flows.values():
        flow_reqs |= {str(r) for r in f["reqs"]}
    for p in md_files(design / "ux-requirements", "UXR-*.md"):
        uid = "-".join(p.name.split("-")[:2])
        uxr_ids.add(uid)
        fm = frontmatter(p)
        if fm is None:
            err(f"{p.name}: sin frontmatter OKF legible")
            continue
        for bl in broken_links(p):
            err(f"{p.name}: enlace roto: {bl}")
        text = read(p)
        for us in sorted(set(re.findall(r"\bUS-\d+\b", text))):
            if stories and us not in stories:
                err(f"{p.name}: referencia {us} que no existe en requirement/user-stories")
        if uid != "UXR-000" and uid not in flow_reqs:
            warn(f"{p.name}: ningún FLW lo lista en requirements (¿falta flujo?)")

    # --- FLW <-> SCR
    for fid, f in flows.items():
        for sid in f["screens"]:
            if sid not in screens:
                err(f"{f['file']}: lista {sid} pero no existe en design/screens")
            elif screens[sid][1].get("flow") != fid:
                err(f"{f['file']}: lista {sid} pero su flow es {screens[sid][1].get('flow')}")
    for sid, (fname, s) in screens.items():
        flow = s.get("flow")
        if not flow:
            err(f"{fname}: {sid} sin flow")
        elif flow not in flows:
            err(f"{fname}: {sid} apunta a {flow}, que no existe")
        elif sid not in [str(x) for x in flows[flow]["screens"]]:
            err(f"{fname}: {sid} declara flow {flow}, pero el FLW no lo lista en screens")
        for field in ("requirements", "required_states", "a11y_requirements"):
            if not s.get(field):
                err(f"{fname}: {sid} sin {field}")
        if not s.get("responsive"):
            warn(f"{fname}: {sid} sin responsive")
        leaked = [k for k in EXTERNAL_REFS if k in s]
        if leaked:
            err(f"{fname}: {sid} guarda referencias externas {leaked} (viven solo en el DTM)")

    # --- DTM
    dtm_screens, divergences = {}, []
    for p in md_files(design / "traceability", "DTM-*.md"):
        fm = frontmatter(p)
        if fm is None:
            err(f"{p.name}: sin frontmatter OKF legible")
            continue
        for e in listify(fm.get("traceability")):
            if isinstance(e, dict) and e.get("screen"):
                dtm_screens[e["screen"]] = e
                sf = e.get("stitch_figma") or {}
                if isinstance(sf, dict) and sf.get("divergence") == "open":
                    divergences.append(e["screen"])
                gd = e.get("governed_design") or {}
                if isinstance(gd, dict) and gd.get("status") == "approved" and not gd.get("approved_by"):
                    err(f"{p.name}: {e['screen']} governed_design approved sin approved_by")
    for sid in screens:
        if sid not in dtm_screens:
            warn(f"{sid}: sin entrada en ningún DTM (aún sin exploración ni diseño gobernado)")
    for sid in dtm_screens:
        if sid not in screens:
            err(f"DTM: {sid} no existe en design/screens")
    for sid in divergences:
        err(f"DTM: {sid} con divergencia Stitch<->Figma abierta (STITCH_FIGMA_DIVERGENCE)")

    # --- ARP (accesibilidad)
    arp_text = " ".join(read(p) for p in md_files(design / "handoff", "ARP-*.md")) + " ".join(
        read(p) for p in md_files(design / "screens", "ARP-*.md")
    )
    arp_screens = set(SCR_ID.findall(arp_text))
    for sid, e in dtm_screens.items():
        if (e.get("governed_design") or e.get("exploration_design")) and sid not in arp_screens:
            warn(f"{sid}: tiene diseño pero no se halla Accessibility Report (ARP)")

    return {
        "inventory": {
            "ux_requirements": len(uxr_ids),
            "user_flows": len(flows),
            "screens": len(screens),
            "components": len(md_files(design / "components", "CMP-*.md")),
            "tokens": len(md_files(design / "tokens")),
            "explorations": len(md_files(design / "explorations")) + len(md_files(design / "generations")),
            "design_projects": len(md_files(design / "projects")),
            "traceability_maps": len(md_files(design / "traceability")),
            "handoffs": len(md_files(design / "handoff", "HOF-*.md")),
            "specs": len(md_files(design / "specs")),
        },
        "errors": errors,
        "warnings": warnings,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    kb = Path(args[0])
    if not (kb / "design").is_dir():
        print(f"No existe {kb / 'design'}")
        return 2
    report = audit(kb)
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("Inventario:", ", ".join(f"{k}={v}" for k, v in report["inventory"].items()))
        for e in report["errors"]:
            print(f"[ERR] {e}")
        for w in report["warnings"]:
            print(f"[aviso] {w}")
        print(f"Resumen: {len(report['errors'])} errores, {len(report['warnings'])} avisos")
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
