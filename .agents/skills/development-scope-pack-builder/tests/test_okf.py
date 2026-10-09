import sys
import uuid
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from okf_reader import read_okf


def _write(path: Path, frontmatter: str) -> Path:
    path.write_text(f"---\n{frontmatter}\n---\n# Example\n", encoding="utf-8")
    return path


def test_reads_google_okf_rcp_and_preserves_nested_provenance():
    tmp_dir = Path(__file__).parent / f"_tmp_{uuid.uuid4().hex}"
    tmp_dir.mkdir()
    path = _write(tmp_dir / "RCP-001.md", """artifact: requirement-context-pack
okf: google-okf-v0.2
id: RCP-001
title: Candidate context
generated: 2026-09-30
verified: false
status: REQUIRES_REVIEW
sources:
  - https://gitlab.example.com/kb/-/blob/main/rcp/RCP-001.md
provenance:
  created_by: af-requirement-context-builder
human-reviewed: false
""")
    try:
        result = read_okf(path)
        assert result["artifact"] == "requirement-context-pack"
        assert result["provenance"]["created_by"] == "af-requirement-context-builder"
    finally:
        path.unlink()
        tmp_dir.rmdir()


def test_rejects_non_google_okf_envelope():
    tmp_dir = Path(__file__).parent / f"_tmp_{uuid.uuid4().hex}"
    tmp_dir.mkdir()
    path = _write(tmp_dir / "bad.md", "artifact: requirement-context-pack\nokf: legacy-0.2\nid: RCP-001")
    try:
        with pytest.raises(ValueError, match="google-okf-v0.2"):
            read_okf(path)
    finally:
        path.unlink()
        tmp_dir.rmdir()


REPO_DOC = """type: Refined User Story
title: "US-001 — Definir el catálogo"
status: draft
generated:
  by: "af-user-story-refiner/1.0"
  at: "2026-09-27T18:00:00-05:00"
sources:
  - id: rcp-001
    resource: /knowledge-base/requirement/context-packs/RCP-001.md"""


def test_reads_repository_format_and_derives_envelope():
    tmp_dir = Path(__file__).parent / f"_tmp_{uuid.uuid4().hex}"
    tmp_dir.mkdir()
    path = _write(tmp_dir / "US-001-x.md", REPO_DOC)
    try:
        r = read_okf(path, source_base="https://github.com/o/r/blob/main", repo_path="knowledge-base/US-001-x.md", product="P")
        assert (r["artifact"], r["id"], r["product"]) == ("user-story", "US-001", "P")
        assert r["sources"] == ["https://github.com/o/r/blob/main/knowledge-base/US-001-x.md"]
        assert r["human-reviewed"] is False and r["verified"] is False
    finally:
        path.unlink()
        tmp_dir.rmdir()


def test_repository_format_requires_source_base():
    tmp_dir = Path(__file__).parent / f"_tmp_{uuid.uuid4().hex}"
    tmp_dir.mkdir()
    path = _write(tmp_dir / "US-001-x.md", REPO_DOC)
    try:
        with pytest.raises(ValueError, match="source_base"):
            read_okf(path)
    finally:
        path.unlink()
        tmp_dir.rmdir()
