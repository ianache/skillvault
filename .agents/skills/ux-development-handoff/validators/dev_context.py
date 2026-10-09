"""Implementation context for ONE screen, as requested by a Developer + coding agent (Superpowers).

Only the governed design is ever handed over as the thing to build. Stitch is returned as
non-authoritative exploration lineage.
"""
from __future__ import annotations

from . import codes as C
from .design_ready_for_dev import evaluate
from .okf import KB, load_kb


def _blocked(screen: str, findings, hof: str | None = None, human: dict | None = None) -> dict:
    return {"status": "BLOCKED", "screen": screen, "handoff": hof, "governed_design": None,
            "codes": sorted({f.code for f in findings}), "findings": [f.as_dict() for f in findings],
            "human_review": human or {"status": "pending"}}


def build(kb_root, screen: str, profile: str = "production") -> dict:
    kb: KB = kb_root if isinstance(kb_root, KB) else load_kb(kb_root)
    hof = next((c for c in kb.of_type("UX Development Handoff") if screen in (c.fm.get("screens") or [])), None)
    if hof is None:
        return _blocked(screen, [C.Finding(C.MISSING_HANDOFF, screen, "no UX Development Handoff covers this screen")])
    gate = evaluate(kb, hof.id, profile=profile, only_screens=[screen])
    if gate.result != C.PASSED:
        return _blocked(screen, gate.findings, hof.id, gate.human_review)

    entry = next(e for e in kb.get(hof.fm["dtm_ref"]).fm["traceability"] if e["screen"] == screen)
    spec = kb.screen(screen)
    gov, exp = entry["governed_design"], entry.get("exploration_design") or {}
    return {
        "status": "READY", "screen": screen, "handoff": hof.id, "authoritative_design": "governed_design",
        "flow": entry["flow"], "requirements": entry["requirements"],
        "governed_design": {k: gov.get(k) for k in ("tool", "file_ref", "node_ref", "project_ref", "artifact_ref", "version", "approved_by",
                                                     "states_covered", "responsive_covered")},
        "exploration_lineage": {"authoritative": gov.get("tool") == "stitch", "tool": exp.get("tool"),
                                "project_ref": exp.get("project_ref"), "artifact_ref": exp.get("artifact_ref"),
                                "status": exp.get("status")} if exp else None,
        "required_states": spec.get("required_states"), "responsive": spec.get("responsive"),
        "a11y_requirements": spec.get("a11y_requirements"),
        "components": entry.get("components") or spec.get("components"),
        "tokens": entry.get("tokens") or spec.get("tokens"),
        "design_decisions": hof.fm.get("design_decisions") or [],
        "open_questions": hof.fm.get("open_questions") or [], "assumptions": hof.fm.get("assumptions") or [],
        "human_review": gate.human_review, "gate_result": gate.result, "codes": [], "findings": [],
        "rules": (["Implement the approved governed_design (an approved Stitch artifact); there is no Figma file for this screen."]
                  if gov.get("tool") == "stitch" else
                  ["Implement governed_design only; do not use Stitch as the source of truth."]) + [
                  "Do not invent missing states or substitute components; ask (BLOCKED) instead."],
    }
