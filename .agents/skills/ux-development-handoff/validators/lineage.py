"""Reusable checks over the design lineage (SCR/FLW/STP/DTM). Pure functions returning Findings."""
from __future__ import annotations

from . import codes as C
from .codes import Finding
from .okf import KB, OKF_CHECKED_TYPES, OKF_REQUIRED, is_placeholder

TRACKED_PREFIXES = ("STP-", "DTM-", "HOF-", "SCR-", "FLW-", "CMP-", "TKN-", "DD-", "ARP-", "UXR-", "US-", "AC-")


def _list(v) -> list:
    return list(v) if isinstance(v, (list, tuple)) else []


def check_integrity(kb: KB) -> list[Finding]:
    out: list[Finding] = []
    seen: dict[str, int] = {}
    for c in kb.concepts:
        if c.parse_error:
            if "design" not in c.path.relative_to(kb.root).parts:
                continue  # unrelated areas (architecture, business…) are not this gate's concern
            out.append(Finding(C.OKF_INVALID, str(c.path.name), f"frontmatter is not valid YAML: {c.parse_error}"))
            continue
        if c.id and c.id.startswith(TRACKED_PREFIXES):
            seen[c.id] = seen.get(c.id, 0) + 1
        if c.type in OKF_CHECKED_TYPES:
            out += _check_okf(kb, c)
    out += [Finding(C.DUPLICATE_ID, i, f"{n} concepts declare id {i}") for i, n in sorted(seen.items()) if n > 1]
    return out


def _check_okf(kb: KB, c) -> list[Finding]:
    fm, subj, out = c.fm, c.id or c.path.name, []
    for key in OKF_REQUIRED:
        if not fm.get(key):
            out.append(Finding(C.OKF_INVALID, subj, f"missing OKF field `{key}`"))
    gen = fm.get("generated") if isinstance(fm.get("generated"), dict) else {}
    if fm.get("generated") and not (gen.get("by") and str(gen.get("at", "")).endswith("-05:00")):
        out.append(Finding(C.OKF_INVALID, subj, "generated.by required and generated.at must be ISO-8601 with -05:00"))
    if "verified" in fm and not str(gen.get("by", "")).startswith("human:"):
        out.append(Finding(C.OKF_INVALID, subj, "`verified` may only be set by a human workflow"))
    for s in _list(fm.get("sources")):
        res = s.get("resource") if isinstance(s, dict) else None
        if not res or not kb.resolve_source(res):
            out.append(Finding(C.DANGLING_REFERENCE, subj, f"source does not resolve: {res}"))
    return out


def check_projects(kb: KB, initiative: str) -> list[Finding]:
    actives = kb.active_projects(initiative)
    if len(actives) > 1:
        ids = ", ".join(sorted(c.id for c in actives))
        return [Finding(C.MULTIPLE_ACTIVE_STITCH_PROJECTS, initiative, f"more than one active Stitch project: {ids}")]
    return []


def screen_spec(kb: KB, scr_id: str, for_gate: bool) -> list[Finding]:
    """Completeness of a Screen specification. Tokens are only demanded by the gate."""
    s = kb.screen(scr_id)
    if s is None:
        return [Finding(C.DANGLING_REFERENCE, scr_id, "screen does not exist in the knowledge base")]
    out: list[Finding] = []
    flow_id = s.get("flow")
    if not flow_id:
        out.append(Finding(C.MISSING_FLOW_REFERENCE, scr_id, "screen has no `flow`"))
    else:
        flow = kb.flow(flow_id)
        if flow is None:
            out.append(Finding(C.DANGLING_REFERENCE, scr_id, f"flow {flow_id} does not exist"))
        elif scr_id not in _list(flow.get("screens")):
            out.append(Finding(C.MISSING_FLOW_REFERENCE, scr_id, f"{flow_id} does not list {scr_id} in `screens`"))
    reqs = _list(s.get("requirements"))
    if not reqs:
        out.append(Finding(C.MISSING_REQUIREMENT_LINEAGE, scr_id, "screen has no requirements (US/AC/UXR)"))
    out += [Finding(C.DANGLING_REFERENCE, scr_id, f"requirement {r} does not resolve") for r in reqs if not kb.exists(r)]
    if not _list(s.get("required_states")):
        out.append(Finding(C.MISSING_SCREEN_STATE, scr_id, "screen declares no `required_states`"))
    if not _list(s.get("responsive")):
        out.append(Finding(C.MISSING_RESPONSIVE_RULE, scr_id, "screen declares no `responsive` rules"))
    if not _list(s.get("a11y_requirements")):
        out.append(Finding(C.MISSING_ACCESSIBILITY_REQUIREMENT, scr_id, "screen declares no `a11y_requirements`"))
    comps = _list(s.get("components"))
    if not comps:
        out.append(Finding(C.MISSING_COMPONENT_REFERENCE, scr_id, "screen declares no components"))
    out += [Finding(C.MISSING_COMPONENT_REFERENCE, scr_id, f"{c} does not resolve") for c in comps if not kb.exists(c)]
    if for_gate:
        toks = _list(s.get("tokens"))
        if not toks:
            out.append(Finding(C.MISSING_TOKEN_REFERENCE, scr_id, "screen declares no tokens"))
        out += [Finding(C.MISSING_TOKEN_REFERENCE, scr_id, f"{t} does not resolve") for t in toks if not kb.exists(t)]
    return out


def _stale(block: dict) -> bool:
    latest = block.get("latest_known_version")
    return block.get("status") == "stale" or (latest is not None and latest != block.get("version"))


def check_design_entry(kb: KB, scr_id: str, entry: dict, initiative: str) -> list[Finding]:
    out: list[Finding] = []
    s = kb.screen(scr_id) or {}
    req = entry.get("requirements") or {}
    if not any(_list(req.get(k)) for k in ("us", "ac", "uxr")):
        out.append(Finding(C.MISSING_REQUIREMENT_LINEAGE, scr_id, "design map entry has no requirement lineage"))
    if s.get("flow") and entry.get("flow") != s.get("flow"):
        out.append(Finding(C.MISSING_FLOW_REFERENCE, scr_id, f"entry flow {entry.get('flow')} != screen flow {s.get('flow')}"))

    exp = entry.get("exploration_design") or {}
    if exp:
        active_ids = {c.id for c in kb.active_projects(initiative)}
        if exp.get("project_ref") not in active_ids:
            out.append(Finding(C.WRONG_STITCH_PROJECT, scr_id,
                               f"{exp.get('project_ref')} is not the active Stitch project of {initiative}"))
        if not exp.get("artifact_ref"):
            out.append(Finding(C.DANGLING_REFERENCE, scr_id, "exploration_design has no artifact_ref"))
        if _stale(exp):
            out.append(Finding(C.STALE_STITCH_REFERENCE, scr_id, "Stitch reference is stale"))

    gov = entry.get("governed_design") or {}
    from_stitch = gov.get("tool") == "stitch"
    if gov.get("status") != "approved":
        out.append(Finding(C.MISSING_GOVERNED_DESIGN, scr_id, "no approved governed_design (Figma or Stitch) for this screen"))
        return out
    if from_stitch:
        # The governed design is an approved Stitch artifact: it must be the registered exploration artifact itself.
        if not all(gov.get(k) for k in ("project_ref", "artifact_ref", "version")) or                 not str(gov.get("approved_by", "")).startswith("human:"):
            out.append(Finding(C.MISSING_GOVERNED_DESIGN, scr_id,
                               "governed_design (Stitch) needs project_ref, artifact_ref, version and a human approver"))
        elif not exp or gov.get("artifact_ref") != exp.get("artifact_ref"):
            out.append(Finding(C.DANGLING_REFERENCE, scr_id,
                               "governed Stitch artifact is not the registered exploration artifact of this screen"))
        if _stale(gov) or (exp and _stale(exp)):
            out.append(Finding(C.STALE_STITCH_REFERENCE, scr_id, "governed Stitch reference is stale"))
    else:
        if not all(gov.get(k) for k in ("file_ref", "node_ref", "version")) or                 not str(gov.get("approved_by", "")).startswith("human:"):
            out.append(Finding(C.MISSING_GOVERNED_DESIGN, scr_id,
                               "governed_design needs file_ref, node_ref, version and a human approver"))
        if _stale(gov):
            out.append(Finding(C.STALE_FIGMA_REFERENCE, scr_id, "Figma reference is stale"))
    miss = sorted(set(_list(s.get("required_states"))) - set(_list(gov.get("states_covered"))))
    if miss:
        out.append(Finding(C.MISSING_SCREEN_STATE, scr_id, f"governed design lacks states: {', '.join(miss)}"))
    miss = sorted(set(_list(s.get("responsive"))) - set(_list(gov.get("responsive_covered"))))
    if miss:
        out.append(Finding(C.MISSING_RESPONSIVE_RULE, scr_id, f"governed design lacks breakpoints: {', '.join(miss)}"))
    if exp and not from_stitch:
        sf = entry.get("stitch_figma") or {}
        div = sf.get("divergence")
        if div not in ("none", "resolved"):
            out.append(Finding(C.STITCH_FIGMA_DIVERGENCE, scr_id,
                               "Stitch and Figma divergence is open or was never declared"))
        elif div == "resolved":
            dec = sf.get("decision_ref")
            if not dec:
                out.append(Finding(C.STITCH_FIGMA_DIVERGENCE, scr_id, "divergence marked resolved without decision_ref"))
            elif not kb.exists(dec):
                out.append(Finding(C.DANGLING_REFERENCE, scr_id, f"decision {dec} does not resolve"))
    return out


def placeholder_findings(entry: dict, scr_id: str) -> list[Finding]:
    out = []
    for block in ("exploration_design", "governed_design"):
        for key in ("project_ref", "artifact_ref", "file_ref", "node_ref", "version"):
            if is_placeholder((entry.get(block) or {}).get(key)):
                out.append(Finding(C.PLACEHOLDER_REFERENCE, scr_id, f"{block}.{key} is a placeholder"))
    return out
