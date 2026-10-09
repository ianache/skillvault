"""Stitch as the governed design (Figma not used): approval by a human, same artifact as the exploration."""
import pytest

from validators import codes, dev_context, registry
from validators import design_ready_for_dev as _gate
from validators.okf import load_kb

DTM = "DTM-CL2-TENANT-001"
STATES = ["default", "loading", "empty", "error", "disabled"]
BREAKPOINTS = ["mobile", "desktop"]


def entry(m, scr):
    return next(e for e in m["dtm"]["traceability"] if e["screen"] == scr)


def stitch_governed(m, scr="SCR-021", **over):
    e = entry(m, scr)
    exp = e["exploration_design"]
    e["governed_design"] = {
        "tool": "stitch", "project_ref": exp["project_ref"], "artifact_ref": exp["artifact_ref"],
        "version": "PLACEHOLDER:sv1", "status": "approved", "approved_by": "human:ianache",
        "states_covered": STATES, "responsive_covered": BREAKPOINTS, "latest_known_version": "PLACEHOLDER:sv1", **over}
    e["stitch_figma"] = {"divergence": "none"}
    return e


def test_register_governed_stitch_keeps_the_exploration_artifact_current(model, make_kb):
    entry(model, "SCR-021")["exploration_design"]["status"] = "current"
    kb = make_kb(model)
    artifact = entry(model, "SCR-021")["exploration_design"]["artifact_ref"]
    registry.register_governed_stitch(kb, DTM, "SCR-021", artifact, "PLACEHOLDER:sv1", "human:ianache", STATES, BREAKPOINTS)
    got = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == "SCR-021")
    assert got["governed_design"]["tool"] == "stitch"
    assert got["governed_design"]["status"] == "approved"
    assert got["governed_design"]["artifact_ref"] == artifact
    assert got["exploration_design"]["status"] != "superseded"


def test_governed_stitch_without_approver_stays_candidate(model, make_kb):
    kb = make_kb(model)
    artifact = entry(model, "SCR-021")["exploration_design"]["artifact_ref"]
    registry.register_governed_stitch(kb, DTM, "SCR-021", artifact, "PLACEHOLDER:sv1", None, STATES, BREAKPOINTS)
    got = next(x for x in load_kb(kb).dtm_entries() if x["screen"] == "SCR-021")
    assert got["governed_design"]["status"] == "candidate"


def test_governed_stitch_approval_requires_a_human(model, make_kb):
    kb = make_kb(model)
    artifact = entry(model, "SCR-021")["exploration_design"]["artifact_ref"]
    with pytest.raises(registry.RegistryError, match="human"):
        registry.register_governed_stitch(kb, DTM, "SCR-021", artifact, "v", "agent:claude", STATES, BREAKPOINTS)


def test_governed_stitch_must_be_the_registered_exploration_artifact(model, make_kb):
    kb = make_kb(model)
    with pytest.raises(registry.RegistryError, match=codes.DANGLING_REFERENCE):
        registry.register_governed_stitch(kb, DTM, "SCR-021", "PLACEHOLDER:another-artifact", "v", "human:x", STATES, BREAKPOINTS)


def test_dev_context_is_ready_with_a_governed_stitch_and_says_so(model, make_kb):
    stitch_governed(model)
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "READY"
    assert ctx["governed_design"]["tool"] == "stitch"
    assert ctx["governed_design"]["artifact_ref"].startswith("PLACEHOLDER:")
    assert any("approved Stitch artifact" in r for r in ctx["rules"])


def test_governed_stitch_with_a_different_artifact_blocks(model, make_kb):
    stitch_governed(model, artifact_ref="PLACEHOLDER:not-the-explored-one")
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "BLOCKED" and codes.DANGLING_REFERENCE in ctx["codes"]


def test_governed_stitch_without_human_approver_blocks(model, make_kb):
    stitch_governed(model, approved_by="agent:claude")
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "BLOCKED" and codes.MISSING_GOVERNED_DESIGN in ctx["codes"]


def test_governed_stitch_missing_states_fail_the_gate(model, make_kb):
    stitch_governed(model, states_covered=["default"])
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "BLOCKED" and codes.MISSING_SCREEN_STATE in ctx["codes"]


def test_a_candidate_stitch_design_is_not_governed(model, make_kb):
    stitch_governed(model, status="candidate")
    ctx = dev_context.build(make_kb(model), "SCR-021", profile="example")
    assert ctx["status"] == "BLOCKED" and codes.MISSING_GOVERNED_DESIGN in ctx["codes"]
