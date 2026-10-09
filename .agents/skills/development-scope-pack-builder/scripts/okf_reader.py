from pathlib import Path
import re

import yaml


REQUIRED_ENVELOPE = (
    "artifact", "okf", "id", "title", "generated", "verified", "status",
    "sources", "provenance", "human-reviewed",
)


REPO_TYPES = {"Requirement Context Pack": "requirement-context-pack", "Refined User Story": "user-story", "User Story": "user-story"}


def _from_repository_format(data: dict, path: Path, source_base, repo_path, product) -> dict:
    """Formato actual del repositorio (type/title/status/generated) -> sobre que usa el constructor."""
    if not source_base:
        raise ValueError(f"{path}: repository-format documents need source_base (https URL of repo + ref)")
    doc_id = re.match(r"^([A-Z]+-\d+)", str(data.get("title", ""))) or re.match(r"^([A-Z]+-\d+)", path.name)
    if not doc_id:
        raise ValueError(f"{path}: cannot derive the document id from title or file name")
    generated = data.get("generated") or {}
    rel = (repo_path or path.name).replace("\\", "/").lstrip("/")
    data.update({
        "artifact": REPO_TYPES[data["type"]], "okf": "google-okf-v0.2", "id": doc_id.group(1),
        "generated": str(generated.get("at", "")) if isinstance(generated, dict) else str(generated),
        "verified": False, "provenance": {"created_by": generated.get("by", "unknown") if isinstance(generated, dict) else "unknown"},
        "human-reviewed": False, "sources": [f"{source_base.rstrip('/')}/{rel}"],
    })
    data["repository_type"] = data.pop("type")  # el validador reserva `type` para el sobre antiguo
    if product:
        data["product"] = product
    return data


def read_okf(path: Path, source_base=None, repo_path=None, product=None) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: missing YAML frontmatter")
    parts = text.split("---", 2)
    if len(parts) != 3:
        raise ValueError(f"{path}: unclosed YAML frontmatter")
    data = yaml.safe_load(parts[1]) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: frontmatter must be a mapping")
    if "okf" not in data and data.get("type") in REPO_TYPES:
        data = _from_repository_format(data, path, source_base, repo_path, product)
    if data.get("okf") != "google-okf-v0.2":
        raise ValueError(f"{path}: only google-okf-v0.2 is supported")
    missing = [key for key in REQUIRED_ENVELOPE if key not in data or data[key] is None]
    if missing:
        raise ValueError(f"{path}: missing OKF fields: {', '.join(missing)}")
    body = parts[2].strip()
    heading = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
    objective = re.search(r"^##\s+(?:Objective|Objetivo)\s*$\n(.+)$", body, re.MULTILINE)
    data["heading"] = heading.group(1).strip() if heading else data["title"]
    data["objective"] = objective.group(1).strip() if objective else ""
    data["body"] = body
    data["source_path"] = str(path)
    return data
