from urllib.parse import urlparse


def _validate_sources(document: dict, label: str) -> None:
    sources = document.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError(f"{label} must contain at least one source URL")
    for source in sources:
        parsed = urlparse(str(source))
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(f"{label} source must be a complete HTTP(S) URL: {source}")


def validate_scope_inputs(rcps: list[dict], stories: list[dict], product: str) -> None:
    if not rcps:
        raise ValueError("at least one RCP is required")
    if not stories:
        raise ValueError("at least one User Story is required")
    for rcp in rcps:
        if rcp.get("artifact") != "requirement-context-pack":
            raise ValueError(f"{rcp.get('id', 'RCP')} must be a requirement-context-pack")
        _validate_sources(rcp, f"RCP {rcp.get('id', 'unknown')}")
        if rcp.get("product") and rcp["product"] != product:
            raise ValueError(f"RCP {rcp.get('id')} product does not match scope product")
    for story in stories:
        if story.get("artifact") != "user-story" or story.get("type") not in (None, "user-story"):
            raise ValueError(f"{story.get('id', 'story')} must be a user-story")
        _validate_sources(story, f"User Story {story.get('id', 'unknown')}")
        if story.get("product") != product:
            raise ValueError(f"User Story {story.get('id')} product does not match scope product")
