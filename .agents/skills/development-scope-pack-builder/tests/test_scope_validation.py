import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from validators import validate_scope_inputs


def _rcp(product="CLocator"):
    return {"artifact": "requirement-context-pack", "okf": "google-okf-v0.2", "id": "RCP-001", "product": product,
            "sources": ["https://gitlab.example.com/kb/-/blob/main/rcp/RCP-001.md"], "provenance": {}}


def _story(product="CLocator"):
    return {"artifact": "user-story", "okf": "google-okf-v0.2", "id": "US-001", "title": "Search", "product": product,
            "sources": ["https://gitlab.example.com/kb/-/blob/main/stories/US-001.md"], "provenance": {}}


def test_accepts_matching_rcp_and_story_with_complete_sources():
    validate_scope_inputs([_rcp()], [_story()], "CLocator")


def test_rejects_story_from_another_product():
    with pytest.raises(ValueError, match="product"):
        validate_scope_inputs([_rcp()], [_story("SmartSuite")], "CLocator")


def test_rejects_symbolic_or_missing_source_url():
    story = _story()
    story["sources"] = ["kb://US-001"]
    with pytest.raises(ValueError, match="complete HTTP"):
        validate_scope_inputs([_rcp()], [story], "CLocator")
