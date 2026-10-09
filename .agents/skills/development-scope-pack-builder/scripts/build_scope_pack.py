import argparse
from pathlib import Path

from okf_reader import read_okf
from scope_renderer import render_scope_pack
from validators import validate_scope_inputs


def _repo_path(path: Path, root) -> str:
    return path.resolve().relative_to(Path(root).resolve()).as_posix() if root else path.name


def build_scope_pack(rcp_paths: list[Path], story_paths: list[Path], metadata: dict) -> str:
    kw = {"source_base": metadata.get("source_base"), "product": metadata["product"]}
    root = metadata.get("repo_root")
    rcps = [read_okf(p, repo_path=_repo_path(p, root), **kw) for p in rcp_paths]
    stories = [read_okf(p, repo_path=_repo_path(p, root), **kw) for p in story_paths]
    validate_scope_inputs(rcps, stories, metadata["product"])
    return render_scope_pack(rcps, stories, metadata)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a candidate Google OKF v0.2 Development Scope Pack")
    parser.add_argument("--rcp", action="append", type=Path, required=True)
    parser.add_argument("--story", action="append", type=Path, required=True)
    parser.add_argument("--product", required=True)
    parser.add_argument("--scope-id", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--objective", default="")
    parser.add_argument("--source-base", help="https URL of repo+ref, e.g. https://github.com/o/r/blob/main (repository-format inputs)")
    parser.add_argument("--repo-root", type=Path, help="repository root, to derive each document's path in the URL")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = build_scope_pack(args.rcp, args.story, {
        "scope_id": args.scope_id,
        "title": args.title,
        "product": args.product,
        "objective": args.objective,
        "source_base": args.source_base,
        "repo_root": args.repo_root,
    })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print(f"Wrote candidate scope pack: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
