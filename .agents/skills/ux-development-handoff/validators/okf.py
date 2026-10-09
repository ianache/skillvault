"""Minimal OKF v0.2 reader/writer and KB index for design concepts."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml

_FM = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?(.*)$", re.S)
_ID_FROM_NAME = re.compile(r"^([A-Z]{2,5}-\d{3}(?:-\d{2})?)(?=[-.]|$)")
PLACEHOLDER_PREFIX = "PLACEHOLDER:"
OKF_REQUIRED = ("type", "title", "description", "status", "generated", "sources")
OKF_CHECKED_TYPES = {"Design Project", "Design Traceability Map", "UX Development Handoff", "Screen", "User Flow"}


def is_placeholder(value) -> bool:
    return isinstance(value, str) and value.strip().upper().startswith(PLACEHOLDER_PREFIX)


def split_frontmatter(text: str):
    m = _FM.match(text)
    if not m:
        return None, text
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def dump_concept(path: Path, fm: dict, body: str) -> None:
    head = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True)
    path.write_text(f"---\n{head}---\n{body}", encoding="utf-8")


@dataclass
class Concept:
    id: str | None
    path: Path
    fm: dict
    body: str
    parse_error: str | None = None

    @property
    def type(self):
        return self.fm.get("type")


@dataclass
class KB:
    root: Path
    concepts: list[Concept] = field(default_factory=list)

    @property
    def repo_root(self) -> Path:
        return self.root.parent

    def by_id(self, id_: str) -> list[Concept]:
        return [c for c in self.concepts if c.id == id_]

    def get(self, id_: str) -> Concept | None:
        hits = self.by_id(id_)
        return hits[0] if hits else None

    def of_type(self, typ: str) -> list[Concept]:
        return [c for c in self.concepts if c.type == typ]

    def exists(self, id_: str) -> bool:
        if self.by_id(id_):
            return True
        if any(id_ == e.get("id") for e in self.screen_entries() + self.flow_entries()):
            return True
        # a concept (e.g. a Design Tokens set) may define several IDs under `defines:`
        for c in self.concepts:
            d = c.fm.get("defines")
            if isinstance(d, (dict, list)) and id_ in d:
                return True
        return False

    def screen_entries(self) -> list[dict]:
        """Screen definitions; a Screen concept may declare several under `screens:`."""
        out = []
        for c in self.of_type("Screen"):
            if isinstance(c.fm.get("screens"), list):
                out += [dict(s, _concept=c) for s in c.fm["screens"] if isinstance(s, dict)]
            else:
                out.append(dict(c.fm, id=c.id, _concept=c))
        return out

    def screen(self, id_: str) -> dict | None:
        return next((s for s in self.screen_entries() if s.get("id") == id_), None)

    def flow_entries(self) -> list[dict]:
        out = []
        for c in self.of_type("User Flow"):
            if isinstance(c.fm.get("flows"), list):
                out += [dict(f, _concept=c) for f in c.fm["flows"] if isinstance(f, dict)]
            else:
                out.append(dict(c.fm, id=c.id, _concept=c))
        return out

    def flow(self, id_: str) -> dict | None:
        return next((f for f in self.flow_entries() if f.get("id") == id_), None)

    def dtm_concepts(self) -> list[Concept]:
        return self.of_type("Design Traceability Map")

    def dtm_entries(self) -> list[dict]:
        return [e for c in self.dtm_concepts() for e in (c.fm.get("traceability") or [])]

    def stp(self) -> list[Concept]:
        return self.of_type("Design Project")

    def active_projects(self, initiative: str) -> list[Concept]:
        return [c for c in self.stp()
                if c.fm.get("initiative") == initiative and c.fm.get("project_status") == "active"]

    def resolve_source(self, resource: str) -> bool:
        rel = resource.lstrip("/")
        return (self.repo_root / rel).exists() or (self.root / rel).exists()


def load_kb(root) -> KB:
    root = Path(root)
    kb = KB(root=root)
    for p in sorted(root.rglob("*.md")):
        try:
            fm, body = split_frontmatter(p.read_text(encoding="utf-8"))
            err = None
        except yaml.YAMLError as exc:  # keep going; reported as OKF_INVALID by lineage
            fm, body, err = None, "", str(exc)
        if fm is None and err is None:
            continue  # plain Markdown, not an OKF concept
        fm = fm or {}
        m = _ID_FROM_NAME.match(p.stem)
        kb.concepts.append(Concept(fm.get("id") or (m.group(1) if m else None), p, fm, body, err))
    return kb
