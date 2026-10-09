import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from scope_renderer import render_scope_pack


def test_candidate_pack_has_null_sprint_and_traceability():
    rcp = {"artifact": "requirement-context-pack", "okf": "google-okf-v0.2", "id": "RCP-001", "title": "Context", "product": "CLocator",
           "sources": ["https://gitlab.example.com/kb/-/blob/main/rcp/RCP-001.md"], "provenance": {}}
    story = {"artifact": "user-story", "okf": "google-okf-v0.2", "id": "US-001", "title": "Search", "product": "CLocator",
             "sources": ["https://gitlab.example.com/kb/-/blob/main/stories/US-001.md"], "provenance": {}}
    output = render_scope_pack([rcp], [story], {"scope_id": "DSP-001", "title": "Search scope", "product": "CLocator"})
    assert "artifact: development-scope-pack" in output
    assert "okf: google-okf-v0.2" in output
    assert "scope_state: DRAFT" in output
    assert "id: null" in output
    assert "RCP-001" in output and "US-001" in output
    assert "https://gitlab.example.com/kb/-/blob/main/stories/US-001.md" in output
    assert "## Included User Stories" in output
    assert "## Excluded Work" in output
