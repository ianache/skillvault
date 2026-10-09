"""Preflight for Stitch generation: one governed project per initiative, FLW/SCR/lineage as preconditions."""
from __future__ import annotations

from dataclasses import dataclass, field

from . import codes as C
from . import lineage
from .codes import Finding
from .okf import KB, is_placeholder, load_kb


@dataclass
class PreflightResult:
    initiative: str
    findings: list[Finding] = field(default_factory=list)
    action: str | None = None          # REUSE | CREATE_AUTHORIZED | None
    project: str | None = None         # STP id to use (None when a human-authorized creation is pending)
    per_screen: dict = field(default_factory=dict)

    @property
    def status(self) -> str:
        return "BLOCKED" if self.findings else "READY"

    @property
    def codes(self) -> set:
        return {f.code for f in self.findings}

    def as_dict(self) -> dict:
        return {"status": self.status, "initiative": self.initiative, "action": self.action,
                "project": self.project, "per_screen": self.per_screen,
                "findings": [f.as_dict() for f in self.findings]}


def resolve_stitch_project(kb: KB, initiative: str, create_project: bool = False,
                           authorize_create: str | None = None):
    """Return (action, project_id, findings). MUST NOT create when an active governed project exists."""
    if not initiative:
        return None, None, [Finding(C.MISSING_INITIATIVE, "-", "initiative is required to find the Stitch project")]
    actives = kb.active_projects(initiative)
    if len(actives) > 1:
        return None, None, lineage.check_projects(kb, initiative)
    if len(actives) == 1:
        return "REUSE", actives[0].id, []
    if create_project and str(authorize_create or "").startswith("human:"):
        return "CREATE_AUTHORIZED", None, []
    why = "creation requested without human authorization" if create_project else "no active governed Stitch project"
    return None, None, [Finding(C.MISSING_STITCH_PROJECT, initiative, f"{why}; agents cannot create projects on their own")]


def preflight(kb_root, initiative: str, screens: list[str], create_project: bool = False,
              authorize_create: str | None = None, profile: str = "production") -> PreflightResult:
    kb: KB = kb_root if isinstance(kb_root, KB) else load_kb(kb_root)
    res = PreflightResult(initiative=initiative)
    res.action, res.project, f = resolve_stitch_project(kb, initiative, create_project, authorize_create)
    res.findings += f
    if not screens:
        res.findings.append(Finding(C.ORPHAN_STITCH_ARTIFACT, "-", "no SCR given: generation would create an orphan design"))
    for scr in screens:
        res.findings += lineage.screen_spec(kb, scr, for_gate=False)
        res.per_screen[scr] = res.project
    if profile == "production" and res.project:
        ext = kb.get(res.project).fm.get("external_ref")
        if is_placeholder(ext) or not ext:
            res.findings.append(Finding(C.PLACEHOLDER_REFERENCE, res.project, "external_ref is missing or a placeholder"))
    return res
