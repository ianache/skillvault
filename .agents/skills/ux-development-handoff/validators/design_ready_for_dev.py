"""DESIGN_READY_FOR_DEV gate. Automatic checks only; human approval is never produced here."""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from . import codes as C
from . import lineage
from .codes import Finding
from .okf import KB, is_placeholder, load_kb

SECTION_LETTERS = "ABCDEFGHIJKLMN"


@dataclass
class GateResult:
    hof: str
    profile: str
    findings: list[Finding] = field(default_factory=list)
    human_review: dict = field(default_factory=lambda: {"status": "pending"})
    chain: dict = field(default_factory=dict)

    @property
    def result(self) -> str:
        return C.overall(self.findings)

    @property
    def codes(self) -> set:
        return {f.code for f in self.findings}

    def as_dict(self) -> dict:
        return {"gate": "DESIGN_READY_FOR_DEV", "hof": self.hof, "profile": self.profile, "result": self.result,
                "human_review": self.human_review, "findings": [f.as_dict() for f in self.findings],
                "chain": self.chain}


def _human_review(hof_fm: dict) -> dict:
    """Only a human reviewer can make the status `approved`; anything else reads as pending/rejected."""
    hr = ((hof_fm.get("gate") or {}).get("human_review")) or {}
    status = hr.get("status")
    if status == "approved" and str(hr.get("reviewer", "")).startswith("human:"):
        return {"status": "approved", "reviewer": hr["reviewer"], "at": hr.get("at")}
    return {"status": "rejected" if status == "rejected" else "pending"}


def evaluate(kb_root, hof_id: str, profile: str = "production", only_screens: list[str] | None = None) -> GateResult:
    kb: KB = kb_root if isinstance(kb_root, KB) else load_kb(kb_root)
    res = GateResult(hof=hof_id, profile=profile)
    res.findings += lineage.check_integrity(kb)
    hof = kb.get(hof_id)
    if hof is None or hof.type != "UX Development Handoff":
        res.findings.append(Finding(C.MISSING_HANDOFF, hof_id, "handoff concept not found"))
        return res
    fm = hof.fm
    res.human_review = _human_review(fm)
    initiative = fm.get("initiative") or ""
    if not initiative:
        res.findings.append(Finding(C.MISSING_INITIATIVE, hof_id, "handoff has no initiative"))
    res.findings += lineage.check_projects(kb, initiative)

    present = set(re.findall(r"(?m)^##\s+([A-N])\.", hof.body))
    res.findings += [Finding(C.MISSING_HANDOFF_SECTION, hof_id, f"section {s} is missing")
                     for s in SECTION_LETTERS if s not in present]
    for dd in fm.get("design_decisions") or []:
        if not kb.exists(dd):
            res.findings.append(Finding(C.DANGLING_REFERENCE, hof_id, f"decision {dd} does not resolve"))
    for q in fm.get("open_questions") or []:
        if q.get("blocking") and q.get("status", "open") == "open":
            res.findings.append(Finding(C.BLOCKING_OPEN_QUESTION, q.get("id", "?"), q.get("text", "")))

    dtm = kb.get(fm.get("dtm_ref") or "")
    if dtm is None:
        res.findings.append(Finding(C.DANGLING_REFERENCE, hof_id, f"dtm_ref {fm.get('dtm_ref')} does not resolve"))
        entries = []
    else:
        entries = dtm.fm.get("traceability") or []
    known = {s.get("id") for s in kb.screen_entries()}
    for e in entries:
        if e.get("screen") not in known:
            res.findings.append(Finding(C.ORPHAN_STITCH_ARTIFACT, str(e.get("screen")),
                                        "design map entry points to a screen that does not exist"))

    reports = set(fm.get("a11y_reports") or [])
    screens = [s for s in (fm.get("screens") or []) if only_screens is None or s in only_screens]
    if not screens:
        res.findings.append(Finding(C.ORPHAN_SCREEN, hof_id, "handoff covers no screens"))
    for scr in screens:
        res.findings += lineage.screen_spec(kb, scr, for_gate=True)
        mine = [e for e in entries if e.get("screen") == scr]
        if not mine:
            res.findings.append(Finding(C.ORPHAN_SCREEN, scr, "screen has no design traceability entry"))
            continue
        if len(mine) > 1:
            res.findings.append(Finding(C.DUPLICATE_ID, scr, "screen has more than one design map entry"))
        e = mine[0]
        res.findings += lineage.check_design_entry(kb, scr, e, initiative)
        ok_report = any(
            c.type == "Accessibility Report" and c.id in reports
            and (c.fm.get("a11y_review") or {}).get("screen") == scr
            and (c.fm.get("a11y_review") or {}).get("result") == "pass"
            for c in kb.concepts)
        if not ok_report:
            res.findings.append(Finding(C.MISSING_ACCESSIBILITY_REQUIREMENT, scr,
                                        "no passing accessibility report referenced by the handoff"))
        if profile == "production":
            res.findings += lineage.placeholder_findings(e, scr)
        s = kb.screen(scr) or {}
        req = e.get("requirements") or {}
        res.chain[scr] = {
            "us": req.get("us", []), "ac": req.get("ac", []), "uxr": req.get("uxr", []),
            "flow": e.get("flow"),
            "stitch": (e.get("exploration_design") or {}).get("artifact_ref"),
            "figma": (e.get("governed_design") or {}).get("node_ref"),
            "components": e.get("components") or s.get("components") or [],
            "tokens": e.get("tokens") or s.get("tokens") or [],
            "handoff": hof_id,
        }
    if profile == "production":
        for c in kb.active_projects(initiative):
            if is_placeholder(c.fm.get("external_ref")):
                res.findings.append(Finding(C.PLACEHOLDER_REFERENCE, c.id, "Stitch project external_ref is a placeholder"))
        if res.human_review["status"] != "approved":
            res.findings.append(Finding(C.HUMAN_REVIEW_PENDING, hof_id, "no human approval recorded for the gate"))
    return res
