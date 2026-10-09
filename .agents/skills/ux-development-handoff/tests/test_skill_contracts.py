"""Contract tests over the eight UX/UI SKILL.md packages (baseline RED before the change)."""
import re
from pathlib import Path

import pytest
import yaml

ALL = ["ux-requirements-analyzer", "user-flow-designer", "ui-spec-writer", "accessibility-reviewer",
       "claude-design-orchestrator", "stitch-ui-generator", "figma-design-validator", "ux-development-handoff"]
CHANGED = {
    "user-flow-designer": "1.1.0", "ui-spec-writer": "1.1.0", "accessibility-reviewer": "1.1.0",
    "claude-design-orchestrator": "1.1.0", "stitch-ui-generator": "2.0.0",
    "figma-design-validator": "2.0.0", "ux-development-handoff": "2.0.0",
}
# "## Course" is optional: the course mapping also lives in the AGENTS.md table
SECTIONS = ["## Purpose", "## Input contract", "## Output contract", "## Preconditions",
            "## Invariants", "## Workflow", "## Quality gates", "## Failure / blocking behavior",
            "## Downstream consumers", "## Must NOT", "## Definition of Done"]
MARKERS = {
    "stitch-ui-generator": ["MUST NOT create a new Stitch project", "exploration_design", "Design Traceability Map",
                            "BLOCKED", "stitch_preflight", "FLW-", "SCR-", "DO NOT CREATE ORPHAN DESIGN ARTIFACTS",
                            "DO NOT CREATE A NEW STITCH PROJECT WHEN AN ACTIVE GOVERNED PROJECT EXISTS"],
    "figma-design-validator": ["governed_design", "STITCH_FIGMA_DIVERGENCE", "Design Traceability Map",
                               "HUMAN DECISIONS MUST REMAIN EXPLICIT", "DO NOT TREAT EXPLORATION DESIGN AS GOVERNED DESIGN"],
    "ux-development-handoff": ["DESIGN_READY_FOR_DEV", "governed_design", "Design-to-Code", "Superpowers",
                               "DO NOT PASS DESIGN_READY_FOR_DEV WITH BLOCKING OPEN QUESTIONS",
                               "DO NOT ALLOW THE CODING AGENT TO SILENTLY RESOLVE DESIGN AMBIGUITIES"],
    "ui-spec-writer": ["required_states", "responsive", "a11y_requirements", "flow:", "design_map"],
    "user-flow-designer": ["screens:", "SCR-", "requirements"],
    "accessibility-reviewer": ["a11y_review", "SCR-", "DESIGN_READY_FOR_DEV"],
    "claude-design-orchestrator": ["FLW-", "SCR-", "BLOCKED", "STITCH_FIGMA_DIVERGENCE"],
}


def skill_dir(skills_dir, name):
    return skills_dir / name


def frontmatter(path: Path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
    return (yaml.safe_load(m.group(1)) if m else None), text


@pytest.mark.parametrize("name", ALL)
def test_frontmatter_is_valid(skills_dir, name):
    fm, _ = frontmatter(skill_dir(skills_dir, name) / "SKILL.md")
    assert fm, f"{name}: SKILL.md has no frontmatter"
    assert fm["name"] == name
    assert len(fm["description"]) > 30 and len(fm["description"]) <= 1024


@pytest.mark.parametrize("name", sorted(CHANGED))
def test_skill_has_required_sections_and_rules(skills_dir, name):
    _, text = frontmatter(skill_dir(skills_dir, name) / "SKILL.md")
    missing = [s for s in SECTIONS if s not in text]
    assert not missing, f"{name}: missing sections {missing}"
    assert "DO NOT INVENT MISSING INFORMATION" in text
    assert "PRESERVE IDS AND PROVENANCE" in text
    assert len(text.splitlines()) <= 130, f"{name}: SKILL.md must stay concise"


@pytest.mark.parametrize("name", sorted(MARKERS))
def test_skill_declares_new_behaviour(skills_dir, name):
    _, text = frontmatter(skill_dir(skills_dir, name) / "SKILL.md")
    absent = [m for m in MARKERS[name] if m not in text]
    assert not absent, f"{name}: missing {absent}"


@pytest.mark.parametrize("name,version", sorted(CHANGED.items()))
def test_manifest_and_template_versions_agree(skills_dir, name, version):
    d = skill_dir(skills_dir, name)
    manifest = yaml.safe_load((d / "manifest.yaml").read_text(encoding="utf-8"))
    assert manifest["name"] == name and manifest["version"] == version
    assert manifest["standard"] == "google-okf-v0.2"
    tpl = (d / "templates" / "concept-template.md").read_text(encoding="utf-8")
    major_minor = ".".join(version.split(".")[:2])
    assert f'by: "{name}/{major_minor}"' in tpl


def test_unchanged_skill_body_is_preserved(skills_dir):
    _, text = frontmatter(skill_dir(skills_dir, "ux-requirements-analyzer") / "SKILL.md")
    assert "## Purpose\nAnalizar requisitos UX sin inventar respuestas a vacíos." in text.replace("\r\n", "\n")


def test_existing_implementation_requirements_are_not_lost(skills_dir):
    for name, marker in (("stitch-ui-generator", "Component Specification for Developers"),
                         ("ui-spec-writer", "Component Inventory"),
                         ("ux-development-handoff", "Component Inventory & Implementation Checklist")):
        ref = skills_dir / name / "references" / "implementation-requirements.md"
        assert ref.exists() and marker in ref.read_text(encoding="utf-8"), name
