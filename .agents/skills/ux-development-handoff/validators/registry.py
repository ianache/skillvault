"""Writes lineage into the Design Traceability Map. The DTM is the single source of SCR<->design links."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from . import codes as C
from .okf import KB, dump_concept, load_kb

LIMA = timezone(timedelta(hours=-5))


class RegistryError(ValueError):
    pass


def _now() -> str:
    return datetime.now(LIMA).replace(microsecond=0).isoformat()


def _dtm_entry(kb: KB, dtm_id: str, screen: str):
    dtm = kb.get(dtm_id)
    if dtm is None or dtm.type != "Design Traceability Map":
        raise RegistryError(f"{C.DANGLING_REFERENCE}: DTM {dtm_id} not found")
    scr = kb.screen(screen)
    if scr is None:
        raise RegistryError(f"{C.ORPHAN_STITCH_ARTIFACT}: {screen} is not a known screen; no orphan designs")
    if not scr.get("flow"):
        raise RegistryError(f"{C.MISSING_FLOW_REFERENCE}: {screen} has no flow")
    entries = dtm.fm.setdefault("traceability", [])
    entry = next((e for e in entries if e.get("screen") == screen), None)
    if entry is None:
        reqs = scr.get("requirements") or []
        entry = {"screen": screen, "flow": scr["flow"], "requirements": {
            "us": [r for r in reqs if r.startswith("US-")], "ac": [r for r in reqs if r.startswith("AC-")],
            "uxr": [r for r in reqs if r.startswith("UXR-")]},
            "components": list(scr.get("components") or []), "tokens": list(scr.get("tokens") or [])}
        entries.append(entry)
    return dtm, entry


_ARTIFACT_RE = re.compile(r"^projects/(\d+)/screens/([0-9a-f]{32})$")


def _verify_artifact_ref(artifact_ref: str, project, evidence: str | None) -> str | None:
    """Un artifact_ref real se copia de la salida de Stitch, no se compone: forma exacta, mismo proyecto que el STP y
    aparición literal en un archivo de evidencia (la salida guardada de list_screens/get_screen/generate)."""
    if artifact_ref.startswith("PLACEHOLDER:"):
        return None
    m = _ARTIFACT_RE.match(artifact_ref)
    if not m:
        raise RegistryError(f"{C.INVALID_ARTIFACT_REF}: {artifact_ref!r} no tiene la forma projects/<n>/screens/<32 hex en minúscula>; "
                            "cópialo literal de la salida de Stitch")
    external = project.fm.get("external_ref") or ""
    if external and not external.startswith("PLACEHOLDER:") and not artifact_ref.startswith(external + "/screens/"):
        raise RegistryError(f"{C.INVALID_ARTIFACT_REF}: {artifact_ref} no pertenece al proyecto {external} de {project.id}")
    if not evidence:
        raise RegistryError(f"{C.UNVERIFIED_ARTIFACT_REF}: falta --evidence con la salida guardada de Stitch donde aparece "
                            f"screens/{m.group(2)}")
    path = Path(evidence)
    if not path.is_file():
        raise RegistryError(f"{C.UNVERIFIED_ARTIFACT_REF}: el archivo de evidencia {evidence} no existe")
    if f"screens/{m.group(2)}" not in path.read_text(encoding="utf-8", errors="ignore"):
        raise RegistryError(f"{C.UNVERIFIED_ARTIFACT_REF}: screens/{m.group(2)} no aparece en {path.name}; "
                            "no se registra un id que Stitch no devolvió")
    return path.name


def register_exploration(kb_root, dtm_id: str, screen: str, project_ref: str, artifact_ref: str,
                         version: str, captured_at: str | None = None, evidence: str | None = None) -> None:
    kb = load_kb(kb_root)
    dtm, entry = _dtm_entry(kb, dtm_id, screen)
    initiative = dtm.fm.get("initiative") or ""
    projects = {c.id: c for c in kb.active_projects(initiative)}
    if project_ref not in projects:
        raise RegistryError(f"{C.WRONG_STITCH_PROJECT}: {project_ref} is not the active project of {initiative}")
    if not artifact_ref:
        raise RegistryError(f"{C.ORPHAN_STITCH_ARTIFACT}: artifact_ref is empty")
    evidence_name = _verify_artifact_ref(artifact_ref, projects[project_ref], evidence)
    old = entry.get("exploration_design")
    if old:
        entry.setdefault("exploration_history", []).append({**old, "status": "superseded"})
    entry["exploration_design"] = {
        "tool": "google-stitch", "project_ref": project_ref, "artifact_ref": artifact_ref, "version": version,
        "status": "current", "captured_at": captured_at or _now(), "latest_known_version": version}
    if evidence_name:
        entry["exploration_design"]["evidence"] = evidence_name
    dump_concept(dtm.path, dtm.fm, dtm.body)


def register_governed(kb_root, dtm_id: str, screen: str, file_ref: str, node_ref: str, version: str,
                      approved_by: str | None, decision_ref: str | None, states_covered: list,
                      responsive_covered: list, divergence: str) -> None:
    if approved_by is not None and not str(approved_by).startswith("human:"):
        raise RegistryError("approval must come from a human (human:<id>); agents cannot approve a design")
    if divergence not in ("none", "resolved", "open"):
        raise RegistryError("divergence must be none, resolved or open")
    if divergence == "resolved" and not decision_ref:
        raise RegistryError("a resolved divergence needs a recorded decision (DD-*)")
    kb = load_kb(kb_root)
    dtm, entry = _dtm_entry(kb, dtm_id, screen)
    approved = approved_by is not None and divergence != "open"
    entry["governed_design"] = {
        "tool": "figma", "file_ref": file_ref, "node_ref": node_ref, "version": version,
        "status": "approved" if approved else "candidate", "approved_by": approved_by, "decision_ref": decision_ref,
        "states_covered": list(states_covered), "responsive_covered": list(responsive_covered),
        "latest_known_version": version}
    sf = {"divergence": divergence}
    if decision_ref:
        sf["decision_ref"] = decision_ref
    entry["stitch_figma"] = sf
    exp = entry.get("exploration_design")
    if approved and exp and exp.get("status") == "current":
        exp["status"] = "superseded"  # stays as exploration lineage, no longer the design to build
    dump_concept(dtm.path, dtm.fm, dtm.body)


def register_governed_stitch(kb_root, dtm_id: str, screen: str, artifact_ref: str, version: str,
                             approved_by: str | None, states_covered: list, responsive_covered: list) -> None:
    """Records an approved Stitch artifact as the governed design of a screen (Figma not used).

    The artifact must be the one already registered as exploration_design for that screen, and the approval
    must come from a human. Without approval the design stays a candidate and the gate does not pass.
    """
    if approved_by is not None and not str(approved_by).startswith("human:"):
        raise RegistryError("approval must come from a human (human:<id>); agents cannot approve a design")
    kb = load_kb(kb_root)
    dtm, entry = _dtm_entry(kb, dtm_id, screen)
    exp = entry.get("exploration_design") or {}
    if not exp or exp.get("artifact_ref") != artifact_ref:
        raise RegistryError(f"{C.DANGLING_REFERENCE}: {artifact_ref} is not the exploration_design registered for {screen}; "
                            "register it first with register-exploration")
    approved = approved_by is not None
    entry["governed_design"] = {
        "tool": "stitch", "project_ref": exp.get("project_ref"), "artifact_ref": artifact_ref, "version": version,
        "status": "approved" if approved else "candidate", "approved_by": approved_by,
        "states_covered": list(states_covered), "responsive_covered": list(responsive_covered),
        "latest_known_version": version}
    entry["stitch_figma"] = {"divergence": "none"}
    dump_concept(dtm.path, dtm.fm, dtm.body)
