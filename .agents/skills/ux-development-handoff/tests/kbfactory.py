"""Builds throwaway knowledge bases for the design-lineage tests.

A KB is described by a plain dict (`base_model`) that tests mutate, then
`write_kb` renders it to OKF Markdown files. Refs are PLACEHOLDER: values so
tests also exercise the production-profile rejection.
"""
from __future__ import annotations

import copy
from pathlib import Path

import yaml

SECTIONS = [
    "A. Requirement Context", "B. User Flow", "C. Screens", "D. Governed Design Reference",
    "E. Components", "F. Design Tokens", "G. Screen States", "H. Responsive Behavior",
    "I. Interaction Rules", "J. Accessibility Requirements", "K. Acceptance Criteria",
    "L. Design Decisions", "M. Open Questions / Assumptions", "N. Provenance / Lineage",
]
STATES = ["default", "loading", "empty", "error", "disabled"]
SCREENS = ["SCR-021", "SCR-022", "SCR-023"]
TS = "2026-10-01T10:00:00-05:00"


def _entry(scr: str, n: int) -> dict:
    return {
        "screen": scr,
        "flow": "FLW-008",
        "requirements": {"us": ["US-027"], "ac": ["AC-041", "AC-042"], "uxr": ["UXR-012"]},
        "exploration_design": {
            "tool": "google-stitch",
            "project_ref": "STP-CL2-TENANT-001",
            "artifact_ref": f"PLACEHOLDER:stitch-artifact-{scr}",
            "version": "PLACEHOLDER:v1",
            "status": "superseded",
            "latest_known_version": "PLACEHOLDER:v1",
        },
        "governed_design": {
            "tool": "figma",
            "file_ref": "PLACEHOLDER:figma-file",
            "node_ref": f"PLACEHOLDER:figma-node-{scr}",
            "version": "PLACEHOLDER:fv1",
            "status": "approved",
            "approved_by": "human:design-lead",
            "decision_ref": "DD-001",
            "states_covered": list(STATES),
            "responsive_covered": ["mobile", "desktop"],
            "latest_known_version": "PLACEHOLDER:fv1",
        },
        "stitch_figma": {"divergence": "resolved", "decision_ref": "DD-001"},
        "components": ["CMP-011", "CMP-014"],
        "tokens": ["TKN-color-primary"],
    }


def base_model() -> dict:
    screens = [
        {
            "id": s, "flow": "FLW-008",
            "requirements": ["US-027", "AC-041", "AC-042", "UXR-012"],
            "required_states": list(STATES),
            "responsive": ["mobile", "desktop"],
            "a11y_requirements": ["WCAG-2.2-AA", "keyboard-nav"],
            "components": ["CMP-011", "CMP-014"],
            "tokens": ["TKN-color-primary"],
        }
        for s in SCREENS
    ]
    return {
        "initiative": "INI-TENANT",
        "stp": [{
            "id": "STP-CL2-TENANT-001", "external_ref": "PLACEHOLDER:stitch-project",
            "initiative": "INI-TENANT", "project_status": "active",
        }],
        "flows": [{"id": "FLW-008", "requirements": ["US-027", "UXR-012"], "screens": list(SCREENS)}],
        "screens": screens,
        "components": ["CMP-011", "CMP-014"],
        "tokens": ["TKN-color-primary"],
        "decisions": ["DD-001"],
        "dtm": {"id": "DTM-CL2-TENANT-001", "initiative": "INI-TENANT",
                "traceability": [_entry(s, i) for i, s in enumerate(SCREENS)]},
        "a11y": [{"id": f"ARP-{s}", "screen": s, "result": "pass"} for s in SCREENS],
        "hof": {
            "id": "HOF-CL2-TENANT-001", "initiative": "INI-TENANT", "dtm_ref": "DTM-CL2-TENANT-001",
            "screens": list(SCREENS),
            "a11y_reports": [f"ARP-{s}" for s in SCREENS],
            "design_decisions": ["DD-001"],
            "open_questions": [{"id": "Q-1", "text": "Copy final del botón", "blocking": False, "status": "open"}],
            "assumptions": ["Solo escritorio y móvil"],
            "gate": {"name": "DESIGN_READY_FOR_DEV", "human_review": {"status": "pending"}},
            "sections": list(SECTIONS),
        },
    }


def _fm(typ: str, id_: str, title: str, extra: dict | None = None, sources=True) -> str:
    fm = {
        "id": id_, "type": typ, "title": f"{id_} — {title}", "description": title,
        "tags": ["ux-ui"], "status": "draft",
        "generated": {"by": "test-fixture/1.0", "at": TS},
    }
    if sources:
        fm["sources"] = [{"id": "us-027", "resource": "/knowledge-base/requirement/user-stories/US-027.md"}]
    fm.update(extra or {})
    return "---\n" + yaml.safe_dump(fm, sort_keys=False, allow_unicode=True) + "---\n\n"


def _put(root: Path, rel: str, text: str) -> None:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def write_kb(tmp: Path, model: dict) -> Path:
    model = copy.deepcopy(model)
    kb = tmp / "knowledge-base"
    for rid in ("US-027", "AC-041", "AC-042", "UXR-012"):
        sub = {"US": "requirement/user-stories", "AC": "design/acceptance-criteria", "UXR": "design/ux-requirements"}[rid.split("-")[0]]
        _put(kb, f"{sub}/{rid}.md", _fm("Requirement", rid, rid, sources=False))
    for s in model["stp"]:
        extra = {k: v for k, v in s.items() if k != "id"}
        extra.update({"tool": "google-stitch", "name": s["id"], "product": "CLocator2",
                      "creation": {"authorized_by": "human:design-lead", "at": TS, "reason": "fixture"}})
        _put(kb, f"design/projects/{s['id']}.md", _fm("Design Project", s["id"], "Stitch project", extra))
    for f in model["flows"]:
        _put(kb, f"design/user-flows/{f['id']}.md",
             _fm("User Flow", f["id"], "Flow", {k: v for k, v in f.items() if k != "id"}))
    for s in model["screens"]:
        _put(kb, f"design/screens/{s['id']}.md",
             _fm("Screen", s["id"], "Screen", {k: v for k, v in s.items() if k != "id"}))
    for c in model["components"]:
        _put(kb, f"design/components/{c}.md", _fm("Component Specification", c, "Component"))
    for t in model["tokens"]:
        _put(kb, f"design/tokens/{t}.md", _fm("Design Token", t, "Token"))
    for d in model["decisions"]:
        _put(kb, f"design/decisions/{d}.md", _fm("Design Decision", d, "Stitch vs Figma", {"decides": "figma-governed"}))
    for a in model["a11y"]:
        _put(kb, f"design/accessibility/{a['id']}.md", _fm(
            "Accessibility Report", a["id"], "A11y",
            {"a11y_review": {"screen": a["screen"], "result": a["result"],
                             "requirements_checked": ["WCAG-2.2-AA"]}}))
    d = model["dtm"]
    _put(kb, f"design/traceability/{d['id']}.md",
         _fm("Design Traceability Map", d["id"], "Design Traceability Map",
             {k: v for k, v in d.items() if k != "id"}))
    h = model["hof"]
    body = "\n".join(f"## {s}\n\nVer referencias.\n" for s in h["sections"])
    fm_h = {k: v for k, v in h.items() if k not in ("id", "sections")}
    _put(kb, f"design/handoff/{h['id']}.md", _fm("UX Development Handoff", h["id"], "Handoff", fm_h) + body)
    return kb
