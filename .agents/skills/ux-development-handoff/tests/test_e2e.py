"""End-to-end: the shipped CLocator2 example must pass exactly as documented."""
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

from validators import codes, dev_context
from validators.design_ready_for_dev import evaluate
from validators.okf import load_kb

SKILL = Path(__file__).resolve().parent.parent
KB = SKILL / "examples" / "e2e-clocator2" / "knowledge-base"
CLI = SKILL / "validators" / "cli.py"
HOF = "HOF-CL2-TENANT-001"


def run_cli(*args):
    p = subprocess.run([sys.executable, str(CLI), *args], capture_output=True, text=True, encoding="utf-8")
    return p.returncode, json.loads(p.stdout)


def test_example_gate_passes_with_pending_human_review():
    r = evaluate(KB, HOF, profile="example")
    assert r.findings == [] and r.result == "PASSED"
    assert r.human_review["status"] == "pending"
    for scr in ("SCR-021", "SCR-022", "SCR-023"):
        c = r.chain[scr]
        assert c["us"] == ["US-027"] and c["uxr"] == ["UXR-012"] and c["flow"] == "FLW-008"
        assert c["stitch"].startswith("PLACEHOLDER:") and c["figma"].startswith("PLACEHOLDER:")
        assert c["components"] and c["tokens"] and c["handoff"] == HOF


def test_validators_distinguish_placeholder_from_production_reference():
    r = evaluate(KB, HOF, profile="production")
    assert r.result == "BLOCKED"
    assert {codes.PLACEHOLDER_REFERENCE, codes.HUMAN_REVIEW_PENDING} <= r.codes


def test_cli_exit_codes_and_json():
    rc, out = run_cli("gate", "--kb", str(KB), "--hof", HOF, "--profile", "example")
    assert rc == 0 and out["result"] == "PASSED"
    rc, out = run_cli("gate", "--kb", str(KB), "--hof", HOF)  # default profile = production
    assert rc == 2 and out["result"] == "BLOCKED"
    rc, out = run_cli("preflight", "--kb", str(KB), "--initiative", "INI-TENANT", "--screens", "SCR-021",
                      "SCR-022", "SCR-023", "--profile", "example")
    assert rc == 0 and out["action"] == "REUSE"
    rc, out = run_cli("preflight", "--kb", str(KB), "--initiative", "INI-TENANT", "--profile", "example")
    assert rc == 2 and out["findings"][0]["code"] == codes.ORPHAN_STITCH_ARTIFACT


def test_superpowers_gets_figma_not_stitch_for_every_screen():
    for scr in ("SCR-021", "SCR-022", "SCR-023"):
        ctx = dev_context.build(KB, scr, profile="example")
        assert ctx["status"] == "READY" and ctx["authoritative_design"] == "governed_design"
        assert ctx["governed_design"]["tool"] == "figma"
        assert ctx["exploration_lineage"]["authoritative"] is False
    assert dev_context.build(KB, "SCR-021", profile="production")["status"] == "BLOCKED"


def test_development_context_pack_points_to_governed_design_only():
    dcp = (KB / "implementation" / "DCP-CL2-TENANT-001.md").read_text(encoding="utf-8")
    assert "human-reviewed: false" in dcp and "verified: false" in dcp
    assert "Stitch (superseded) **no** es el diseño a construir" in dcp
    assert "SCR-021" in dcp and "figma-node-SCR-021" in dcp


def test_example_invents_no_external_identifiers():
    """Every Stitch/Figma reference must be a PLACEHOLDER; no real-looking IDs."""
    kb = load_kb(KB)
    for e in kb.dtm_entries():
        for block in ("exploration_design", "governed_design"):
            for key in ("artifact_ref", "file_ref", "node_ref", "version"):
                v = (e.get(block) or {}).get(key)
                if v:
                    assert str(v).startswith("PLACEHOLDER:"), (e["screen"], block, key, v)
    assert kb.get("STP-CL2-TENANT-001").fm["external_ref"].startswith("PLACEHOLDER:")
    text = "\n".join(p.read_text(encoding="utf-8") for p in KB.rglob("*.md"))
    assert not re.search(r"projects/\d{6,}|screens/[0-9a-f]{20,}", text)


def test_index_every_chain_concept_exists():
    kb = load_kb(KB)
    for i in ("RCP-CL2-TENANT-001", "UXCP-CL2-TENANT-001", "FLW-008", "SCR-021", "SCR-022", "SCR-023",
              "STP-CL2-TENANT-001", "DTM-CL2-TENANT-001", HOF, "DCP-CL2-TENANT-001", "CMP-011", "TKN-color-primary"):
        assert kb.get(i) is not None, i


def test_cli_output_is_utf8_even_with_non_ascii_findings(tmp_path):
    import shutil
    kb = tmp_path / "knowledge-base"
    shutil.copytree(KB, kb)
    hof = kb / "design" / "handoff" / "HOF-CL2-TENANT-001.md"
    text = hof.read_text(encoding="utf-8").replace(
        "open_questions:", "open_questions:\n- {id: Q-9, text: '¿Quién aprueba «esto»?', blocking: true, status: open}", 1)
    hof.write_text(text, encoding="utf-8")
    p = subprocess.run([sys.executable, str(CLI), "gate", "--kb", str(kb), "--hof", HOF, "--profile", "example"],
                       capture_output=True)
    out = json.loads(p.stdout.decode("utf-8"))  # must be valid UTF-8 whatever the console code page is
    assert out["result"] == "BLOCKED"
    assert any("«esto»" in f["message"] for f in out["findings"])
