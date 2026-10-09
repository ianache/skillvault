"""The ten mandatory scenarios plus one negative test per validator code."""
import copy

import pytest

from validators import codes, dev_context, registry
from validators import design_ready_for_dev as _gate
from validators import stitch_preflight as _pf
from validators.okf import load_kb

def evaluate(kb, hof, profile="example"):
    return _gate.evaluate(kb, hof, profile=profile)


def preflight(kb, ini, screens, profile="example", **kw):
    return _pf.preflight(kb, ini, screens, profile=profile, **kw)


INI = "INI-TENANT"
SCREENS = ["SCR-021", "SCR-022", "SCR-023"]


def entry(m, scr):
    return next(e for e in m["dtm"]["traceability"] if e["screen"] == scr)


def screen(m, scr):
    return next(s for s in m["screens"] if s["id"] == scr)


# ---------------------------------------------------------------- S1..S5 (Stitch)
def test_s1_all_screens_of_flow_use_the_same_stitch_project(model, make_kb):
    kb = make_kb(model)
    res = preflight(kb, INI, SCREENS)
    assert res.status == "READY"
    assert res.action == "REUSE"
    assert res.project == "STP-CL2-TENANT-001"
    assert {p for p in res.per_screen.values()} == {"STP-CL2-TENANT-001"}


def test_s2_never_creates_second_project_when_active_exists(model, make_kb):
    kb = make_kb(model)
    for kwargs in ({"create_project": True}, {"create_project": True, "authorize_create": "human:ianache"}):
        res = preflight(kb, INI, ["SCR-022"], **kwargs)
        assert res.action == "REUSE" and res.project == "STP-CL2-TENANT-001"
    assert res.action != "CREATE_AUTHORIZED"


def test_s2_two_active_projects_block(model, make_kb):
    model["stp"].append({"id": "STP-CL2-TENANT-002", "external_ref": "PLACEHOLDER:other",
                         "initiative": INI, "project_status": "active"})
    res = preflight(make_kb(model), INI, SCREENS)
    assert res.status == "BLOCKED" and codes.MULTIPLE_ACTIVE_STITCH_PROJECTS in res.codes


def test_s2_create_requires_human_authorization_when_none_exists(model, make_kb):
    model["stp"][0]["project_status"] = "archived"
    kb = make_kb(model)
    blocked = preflight(kb, INI, SCREENS, create_project=True)
    assert blocked.status == "BLOCKED" and codes.MISSING_STITCH_PROJECT in blocked.codes
    agent_auth = preflight(kb, INI, SCREENS, create_project=True, authorize_create="agent:claude")
    assert agent_auth.status == "BLOCKED"
    ok = preflight(kb, INI, SCREENS, create_project=True, authorize_create="human:ianache")
    assert ok.status == "READY" and ok.action == "CREATE_AUTHORIZED"
    assert preflight(kb, INI, SCREENS).status == "BLOCKED"  # no request to create → blocked


def test_s3_no_screen_blocks(model, make_kb):
    res = preflight(make_kb(model), INI, [])
    assert res.status == "BLOCKED" and codes.ORPHAN_STITCH_ARTIFACT in res.codes


def test_s3_unknown_screen_blocks(model, make_kb):
    res = preflight(make_kb(model), INI, ["SCR-999"])
    assert res.status == "BLOCKED" and codes.DANGLING_REFERENCE in res.codes


def test_preflight_requires_initiative(model, make_kb):
    res = preflight(make_kb(model), "", SCREENS)
    assert res.status == "BLOCKED" and codes.MISSING_INITIATIVE in res.codes


def test_s4_screen_without_flow_blocks(model, make_kb):
    del screen(model, "SCR-021")["flow"]
    res = preflight(make_kb(model), INI, ["SCR-021"])
    assert res.status == "BLOCKED" and codes.MISSING_FLOW_REFERENCE in res.codes


def test_s4_flow_that_does_not_list_screen_blocks(model, make_kb):
    model["flows"][0]["screens"] = ["SCR-022", "SCR-023"]
    res = preflight(make_kb(model), INI, ["SCR-021"])
    assert res.status == "BLOCKED" and codes.MISSING_FLOW_REFERENCE in res.codes


def test_preflight_requires_requirement_lineage_and_complete_spec(model, make_kb):
    screen(model, "SCR-021")["requirements"] = []
    del screen(model, "SCR-022")["required_states"]
    res = preflight(make_kb(model), INI, ["SCR-021", "SCR-022"])
    assert res.status == "BLOCKED"
    assert {codes.MISSING_REQUIREMENT_LINEAGE, codes.MISSING_SCREEN_STATE} <= res.codes


def test_s5_registers_screen_artifact_lineage(model, make_kb):
    del entry(model, "SCR-022")["exploration_design"]
    kb = make_kb(model)
    registry.register_exploration(kb, "DTM-CL2-TENANT-001", "SCR-022", "STP-CL2-TENANT-001",
                                  "PLACEHOLDER:artifact-b", "PLACEHOLDER:v1")
    e = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == "SCR-022")
    assert e["exploration_design"]["project_ref"] == "STP-CL2-TENANT-001"
    assert e["exploration_design"]["artifact_ref"] == "PLACEHOLDER:artifact-b"
    assert e["exploration_design"]["status"] == "current"
    assert e["flow"] == "FLW-008"


def test_s5_regeneration_keeps_history_and_same_project(model, make_kb):
    kb = make_kb(model)
    registry.register_exploration(kb, "DTM-CL2-TENANT-001", "SCR-021", "STP-CL2-TENANT-001",
                                  "PLACEHOLDER:artifact-new", "PLACEHOLDER:v2")
    e = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == "SCR-021")
    assert e["exploration_design"]["artifact_ref"] == "PLACEHOLDER:artifact-new"
    assert e["exploration_history"][0]["artifact_ref"] == "PLACEHOLDER:stitch-artifact-SCR-021"


def test_s5_wrong_project_or_orphan_is_rejected(model, make_kb):
    kb = make_kb(model)
    with pytest.raises(registry.RegistryError, match=codes.WRONG_STITCH_PROJECT):
        registry.register_exploration(kb, "DTM-CL2-TENANT-001", "SCR-021", "STP-OTHER", "PLACEHOLDER:x", "v")
    with pytest.raises(registry.RegistryError, match=codes.ORPHAN_STITCH_ARTIFACT):
        registry.register_exploration(kb, "DTM-CL2-TENANT-001", "SCR-777", "STP-CL2-TENANT-001", "PLACEHOLDER:x", "v")


# ---------------------------------------------------------------- S6 (Figma governs)
def test_s6_figma_becomes_governed_and_stitch_stays_exploration(model, make_kb):
    e = entry(model, "SCR-021")
    e["governed_design"] = {"status": "candidate"}
    e["stitch_figma"] = {"divergence": "none"}
    e["exploration_design"]["status"] = "current"
    kb = make_kb(model)
    registry.register_governed(
        kb, "DTM-CL2-TENANT-001", "SCR-021", file_ref="PLACEHOLDER:figma-file",
        node_ref="PLACEHOLDER:node-21", version="PLACEHOLDER:fv2", approved_by="human:design-lead",
        decision_ref="DD-001", states_covered=["default", "loading", "empty", "error", "disabled"],
        responsive_covered=["mobile", "desktop"], divergence="resolved")
    got = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == "SCR-021")
    assert got["governed_design"]["status"] == "approved"
    assert got["governed_design"]["tool"] == "figma"
    assert got["exploration_design"]["artifact_ref"] == "PLACEHOLDER:stitch-artifact-SCR-021"
    assert got["exploration_design"]["status"] == "superseded"


def test_s6_governed_approval_requires_a_human(model, make_kb):
    kb = make_kb(model)
    with pytest.raises(registry.RegistryError, match="human"):
        registry.register_governed(
            kb, "DTM-CL2-TENANT-001", "SCR-021", file_ref="f", node_ref="n", version="v",
            approved_by="agent:claude", decision_ref="DD-001", states_covered=[], responsive_covered=[],
            divergence="none")
    with pytest.raises(registry.RegistryError, match="decision"):
        registry.register_governed(
            kb, "DTM-CL2-TENANT-001", "SCR-021", file_ref="f", node_ref="n", version="v",
            approved_by="human:x", decision_ref=None, states_covered=[], responsive_covered=[],
            divergence="resolved")


# ---------------------------------------------------------------- S7 (Dev context)
def test_s7_dev_context_returns_figma_and_not_stitch_as_authority(model, make_kb):
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "READY"
    assert ctx["governed_design"]["tool"] == "figma"
    assert ctx["governed_design"]["node_ref"] == "PLACEHOLDER:figma-node-SCR-021"
    assert ctx["exploration_lineage"]["authoritative"] is False
    assert ctx["required_states"] == ["default", "loading", "empty", "error", "disabled"]
    assert ctx["components"] == ["CMP-011", "CMP-014"]
    assert ctx["handoff"] == "HOF-CL2-TENANT-001"
    assert ctx["human_review"]["status"] == "pending"
    assert "authoritative_design" not in ctx or ctx["authoritative_design"] == "governed_design"


def test_s7_dev_context_blocked_when_only_stitch_exists(model, make_kb):
    entry(model, "SCR-021")["governed_design"] = {"status": "candidate"}
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "BLOCKED"
    assert ctx["governed_design"] is None
    assert codes.MISSING_GOVERNED_DESIGN in ctx["codes"]


def test_s7_dev_context_blocked_without_handoff(model, make_kb):
    model["hof"]["screens"] = ["SCR-022", "SCR-023"]
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "BLOCKED" and codes.MISSING_HANDOFF in ctx["codes"]


def test_s7_production_dev_context_needs_human_approval(model, make_kb):
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="production")
    assert ctx["status"] == "BLOCKED"


# ---------------------------------------------------------------- S8..S10 (gate)
def test_s8_unresolved_divergence_blocks(model, make_kb):
    entry(model, "SCR-022")["stitch_figma"] = {"divergence": "open"}
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert r.result == "BLOCKED" and codes.STITCH_FIGMA_DIVERGENCE in r.codes


def test_s8_resolved_divergence_needs_a_resolvable_decision(model, make_kb):
    entry(model, "SCR-022")["stitch_figma"] = {"divergence": "resolved"}
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert r.result == "BLOCKED" and codes.STITCH_FIGMA_DIVERGENCE in r.codes
    entry(model, "SCR-022")["stitch_figma"] = {"divergence": "resolved", "decision_ref": "DD-404"}
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert codes.DANGLING_REFERENCE in r.codes or codes.STITCH_FIGMA_DIVERGENCE in r.codes
    assert r.result != "PASSED"


def test_s9_missing_error_state_fails(model, make_kb):
    entry(model, "SCR-023")["governed_design"]["states_covered"] = ["default", "loading", "empty", "disabled"]
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert r.result == "FAILED" and codes.MISSING_SCREEN_STATE in r.codes


def test_s10_complete_lineage_passes_pending_human_review(model, make_kb):
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert r.findings == []
    assert r.result == "PASSED"
    assert r.human_review["status"] == "pending"
    chain = r.chain["SCR-021"]
    assert chain["us"] == ["US-027"] and chain["uxr"] == ["UXR-012"] and chain["flow"] == "FLW-008"
    assert chain["stitch"] == "PLACEHOLDER:stitch-artifact-SCR-021"
    assert chain["figma"] == "PLACEHOLDER:figma-node-SCR-021"
    assert chain["components"] == ["CMP-011", "CMP-014"] and chain["tokens"] == ["TKN-color-primary"]
    assert chain["handoff"] == "HOF-CL2-TENANT-001"


def test_gate_never_approves_on_its_own(model, make_kb):
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert r.human_review["status"] != "approved"
    model["hof"]["gate"]["human_review"] = {"status": "approved", "reviewer": "agent:claude"}
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert r.human_review["status"] != "approved"  # approval must come from a human reviewer


def test_production_profile_rejects_placeholders_and_pending_review(model, make_kb):
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001", profile="production")
    assert r.result == "BLOCKED"
    assert {codes.PLACEHOLDER_REFERENCE, codes.HUMAN_REVIEW_PENDING} <= r.codes


# ---------------------------------------------------------------- one negative per code
def _del(m, scr, key):
    del screen(m, scr)[key]


NEGATIVES = {
    codes.ORPHAN_SCREEN: (lambda m: m["dtm"]["traceability"].pop(), "FAILED"),
    codes.ORPHAN_STITCH_ARTIFACT: (lambda m: m["dtm"]["traceability"].append(
        {**copy.deepcopy(entry(m, "SCR-021")), "screen": "SCR-777"}), "FAILED"),
    codes.MISSING_FLOW_REFERENCE: (lambda m: _del(m, "SCR-021", "flow"), "BLOCKED"),
    codes.MISSING_REQUIREMENT_LINEAGE: (lambda m: screen(m, "SCR-021").update(requirements=[]), "BLOCKED"),
    codes.MULTIPLE_ACTIVE_STITCH_PROJECTS: (lambda m: m["stp"].append(
        {"id": "STP-CL2-TENANT-002", "external_ref": "PLACEHOLDER:b", "initiative": INI,
         "project_status": "active"}), "FAILED"),
    codes.WRONG_STITCH_PROJECT: (lambda m: entry(m, "SCR-021")["exploration_design"].update(
        project_ref="STP-CL2-TENANT-009"), "FAILED"),
    codes.STALE_STITCH_REFERENCE: (lambda m: entry(m, "SCR-021")["exploration_design"].update(
        latest_known_version="PLACEHOLDER:v9"), "FAILED"),
    codes.STALE_FIGMA_REFERENCE: (lambda m: entry(m, "SCR-021")["governed_design"].update(
        latest_known_version="PLACEHOLDER:fv9"), "FAILED"),
    codes.STITCH_FIGMA_DIVERGENCE: (lambda m: entry(m, "SCR-021").update(
        stitch_figma={"divergence": "open"}), "BLOCKED"),
    codes.MISSING_GOVERNED_DESIGN: (lambda m: entry(m, "SCR-021").update(governed_design={"status": "candidate"}), "BLOCKED"),
    codes.MISSING_SCREEN_STATE: (lambda m: entry(m, "SCR-021")["governed_design"].update(states_covered=["default"]), "FAILED"),
    codes.MISSING_RESPONSIVE_RULE: (lambda m: entry(m, "SCR-021")["governed_design"].update(responsive_covered=["desktop"]), "FAILED"),
    codes.MISSING_ACCESSIBILITY_REQUIREMENT: (lambda m: screen(m, "SCR-021").update(a11y_requirements=[]), "FAILED"),
    codes.MISSING_COMPONENT_REFERENCE: (lambda m: screen(m, "SCR-021").update(components=["CMP-999"]), "FAILED"),
    codes.MISSING_TOKEN_REFERENCE: (lambda m: screen(m, "SCR-021").update(tokens=["TKN-nope"]), "FAILED"),
    codes.BLOCKING_OPEN_QUESTION: (lambda m: m["hof"]["open_questions"].append(
        {"id": "Q-2", "text": "¿Quién aprueba?", "blocking": True, "status": "open"}), "BLOCKED"),
    codes.DANGLING_REFERENCE: (lambda m: m["hof"].update(design_decisions=["DD-404"]), "FAILED"),
    codes.MISSING_HANDOFF_SECTION: (lambda m: m["hof"].update(sections=m["hof"]["sections"][:-1]), "FAILED"),
}


@pytest.mark.parametrize("code", sorted(NEGATIVES))
def test_negative_each_code_is_detected(code, model, make_kb):
    mutate, expected = NEGATIVES[code]
    mutate(model)
    r = evaluate(make_kb(model), "HOF-CL2-TENANT-001")
    assert code in r.codes, (code, r.codes)
    assert r.result in ("FAILED", "BLOCKED")
    if len(r.codes) == 1:
        assert r.result == expected


def test_duplicate_ids_are_detected(model, make_kb, tmp_path):
    kb = make_kb(model)
    (kb / "design" / "components" / "CMP-011-copy.md").write_text(
        (kb / "design" / "components" / "CMP-011.md").read_text(encoding="utf-8"), encoding="utf-8")
    r = evaluate(kb, "HOF-CL2-TENANT-001")
    assert codes.DUPLICATE_ID in r.codes and r.result == "FAILED"


def test_okf_frontmatter_is_enforced_on_new_concepts(model, make_kb):
    kb = make_kb(model)
    p = kb / "design" / "traceability" / "DTM-CL2-TENANT-001.md"
    text = p.read_text(encoding="utf-8").replace("-05:00", "Z").replace("status: draft", "status: draft\nverified: true")
    p.write_text(text, encoding="utf-8")
    r = evaluate(kb, "HOF-CL2-TENANT-001")
    assert codes.OKF_INVALID in r.codes and r.result == "FAILED"


def test_unresolvable_source_is_reported(model, make_kb):
    kb = make_kb(model)
    (kb / "requirement" / "user-stories" / "US-027.md").unlink()
    r = evaluate(kb, "HOF-CL2-TENANT-001")
    assert r.result == "FAILED" and codes.DANGLING_REFERENCE in r.codes


def test_multi_screen_file_is_loaded(model, make_kb):
    kb = make_kb(model)
    (kb / "design" / "screens" / "SCR-022.md").unlink()
    (kb / "design" / "screens" / "SCR-023.md").unlink()
    two = [s for s in model["screens"] if s["id"] != "SCR-021"]
    import yaml
    fm = {"type": "Screen", "title": "SCR-022/23", "description": "d", "tags": ["ux-ui"], "status": "draft",
          "generated": {"by": "t/1.0", "at": "2026-10-01T10:00:00-05:00"},
          "sources": [{"id": "us", "resource": "/knowledge-base/requirement/user-stories/US-027.md"}],
          "screens": two}
    (kb / "design" / "screens" / "SCR-022-023.md").write_text(
        "---\n" + yaml.safe_dump(fm, sort_keys=False) + "---\n", encoding="utf-8")
    assert evaluate(kb, "HOF-CL2-TENANT-001").result == "PASSED"


def test_unparseable_frontmatter_only_matters_inside_design(model, make_kb):
    kb = make_kb(model)
    bad = "---\ntitle: a: b\n---\n"
    (kb / "architecture").mkdir()
    (kb / "architecture" / "ADR-005.md").write_text(bad, encoding="utf-8")
    assert evaluate(kb, "HOF-CL2-TENANT-001").result == "PASSED"
    (kb / "design" / "screens" / "SCR-099.md").write_text(bad, encoding="utf-8")
    r = evaluate(kb, "HOF-CL2-TENANT-001")
    assert r.result == "FAILED" and codes.OKF_INVALID in r.codes


def test_tokens_defined_in_a_token_set_resolve(model, make_kb):
    model["tokens"] = []
    screen(model, "SCR-021")["tokens"] = ["TKN-color-primary", "TKN-radius-default"]
    for s in ("SCR-022", "SCR-023"):
        screen(model, s)["tokens"] = ["TKN-color-primary"]
    kb = make_kb(model)
    (kb / "design" / "tokens").mkdir(parents=True, exist_ok=True)
    (kb / "design" / "tokens" / "TKN-SET-001.md").write_text(
        "---\nid: TKN-SET-001\ntype: Design Tokens\ntitle: set\ndescription: d\nstatus: draft\n"
        "generated: {by: t/1.0, at: '2026-10-01T10:00:00-05:00'}\n"
        "defines: {TKN-color-primary: '#0F4C81', TKN-radius-default: 8px}\n---\n", encoding="utf-8")
    assert evaluate(kb, "HOF-CL2-TENANT-001").result == "PASSED"
    (kb / "design" / "screens" / "SCR-021.md").write_text(
        (kb / "design" / "screens" / "SCR-021.md").read_text(encoding="utf-8").replace("TKN-radius-default", "TKN-undefined"),
        encoding="utf-8")
    r = evaluate(kb, "HOF-CL2-TENANT-001")
    assert codes.MISSING_TOKEN_REFERENCE in r.codes
