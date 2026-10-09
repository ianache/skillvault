from datetime import date

import yaml


def _source_lines(documents: list[dict]) -> list[str]:
    values = []
    for document in documents:
        values.extend(document.get("sources", []))
    return list(dict.fromkeys(values))


def render_scope_pack(rcps: list[dict], stories: list[dict], metadata: dict) -> str:
    sources = _source_lines(rcps + stories)
    envelope = {
        "artifact": "development-scope-pack",
        "okf": "google-okf-v0.2",
        "id": metadata["scope_id"],
        "title": metadata["title"],
        "generated": metadata.get("generated", date.today().isoformat()),
        "verified": False,
        "status": "REQUIRES_REVIEW",
        "sources": sources,
        "provenance": {
            "created_by": "development-scope-pack-builder",
            "method": "derived-from-rcp-and-user-stories",
            "confidence": "medium",
        },
        "human-reviewed": False,
        "scope_state": "DRAFT",
        "sprint": {"id": None, "name": None},
    }
    lines = ["---", yaml.safe_dump(envelope, sort_keys=False, allow_unicode=True).rstrip(), "---", ""]
    lines.extend([
        f"# {metadata['title']}", "",
        "## Scope and Identity", "",
        f"- Scope ID: `{metadata['scope_id']}`",
        f"- Product: `{metadata['product']}`",
        "- Scope state: `DRAFT`",
        "- Sprint: Not assigned; candidate scope for Scrum planning.", "",
        "## Objective", "",
        metadata.get("objective", "To be confirmed during scope review."), "",
        "## Source RCPs", "",
    ])
    for rcp in rcps:
        lines.append(f"- `{rcp['id']}` — {rcp.get('title', rcp['id'])}")
    lines.extend(["", "## Included User Stories", ""])
    for story in stories:
        lines.append(f"- `{story['id']}` — {story.get('title', story['id'])}")
        if story.get("objective"):
            lines.append(f"  - Value: {story['objective']}")
        for source in story.get("sources", []):
            lines.append(f"  - Source: [{source}]({source})")
    lines.extend([
        "", "## Excluded Work", "",
        "No exclusions supplied; confirm exclusions during scope review.", "",
        "## Dependencies and Constraints", "",
        "Capture only dependencies supported by the source RCPs, User Stories or approved architecture artifacts.", "",
        "## QA and Acceptance Evidence", "",
        "Derive test scenarios from the included User Stories and their acceptance criteria. No additional business rule is introduced by this pack.", "",
        "## Provider Handoff", "",
        "The delivery team or supplier must implement only the included scope, provide test evidence, document deviations and raise any out-of-scope change for review.", "",
        "## Open Questions and Blockers", "",
        "No additional questions supplied; unresolved source questions remain open and must be reviewed before `READY_FOR_SPRINT_SELECTION`.", "",
        "## Definition of Ready", "",
        "- Included stories have stable IDs, source URLs and validated acceptance criteria.",
        "- Scope boundaries, dependencies and blockers are reviewed.",
        "- Dev and QA responsibilities are understood.", "",
        "## Definition of Done", "",
        "- Included stories meet their acceptance criteria.",
        "- Required tests and evidence are available.",
        "- Traceability from RCP to story to delivery evidence is preserved.",
    ])
    return "\n".join(lines) + "\n"
