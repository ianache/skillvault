"""CLI: python validators/cli.py {preflight|gate|dev-context|register-exploration|register-governed|register-governed-stitch} ...

Exit code: 0 = PASSED/READY, 1 = FAILED, 2 = BLOCKED. JSON on stdout.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from validators import dev_context, registry  # noqa: E402
from validators.design_ready_for_dev import evaluate  # noqa: E402
from validators.stitch_preflight import preflight  # noqa: E402

EXIT = {"PASSED": 0, "READY": 0, "FAILED": 1, "BLOCKED": 2}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(p):
        p.add_argument("--kb", required=True, help="path to knowledge-base/")
        p.add_argument("--profile", choices=["production", "example"], default="production")

    p = sub.add_parser("preflight"); common(p)
    p.add_argument("--initiative", required=True)
    p.add_argument("--screens", nargs="*", default=[])
    p.add_argument("--create-project", action="store_true")
    p.add_argument("--authorized-by", help="human:<id> authorizing project creation")
    p = sub.add_parser("gate"); common(p)
    p.add_argument("--hof", required=True)
    p = sub.add_parser("dev-context"); common(p)
    p.add_argument("--screen", required=True)
    p = sub.add_parser("register-exploration")
    p.add_argument("--kb", required=True)
    for a in ("dtm", "screen", "project-ref", "artifact-ref", "version"):
        p.add_argument(f"--{a}", required=True)
    p.add_argument("--evidence", help="archivo con la salida guardada de Stitch (list_screens/get_screen/generate) donde aparece "
                                      "screens/<id>; obligatorio salvo para refs PLACEHOLDER:")
    p = sub.add_parser("register-governed")
    p.add_argument("--kb", required=True)
    for a in ("dtm", "screen", "file-ref", "node-ref", "version", "divergence"):
        p.add_argument(f"--{a}", required=True)
    p.add_argument("--approved-by"); p.add_argument("--decision-ref")
    p.add_argument("--states", nargs="*", default=[]); p.add_argument("--breakpoints", nargs="*", default=[])

    p = sub.add_parser("register-governed-stitch")
    p.add_argument("--kb", required=True)
    for a in ("dtm", "screen", "artifact-ref", "version"):
        p.add_argument(f"--{a}", required=True)
    p.add_argument("--approved-by", help="human:<id>; without it the design stays a candidate")
    p.add_argument("--states", nargs="*", default=[]); p.add_argument("--breakpoints", nargs="*", default=[])

    a = ap.parse_args(argv)
    try:
        if a.cmd == "preflight":
            out = preflight(a.kb, a.initiative, a.screens, a.create_project, a.authorized_by, a.profile).as_dict()
            key = out["status"]
        elif a.cmd == "gate":
            out = evaluate(a.kb, a.hof, a.profile).as_dict(); key = out["result"]
        elif a.cmd == "dev-context":
            out = dev_context.build(a.kb, a.screen, a.profile); key = out["status"]
        elif a.cmd == "register-exploration":
            registry.register_exploration(a.kb, a.dtm, a.screen, a.project_ref, a.artifact_ref, a.version, evidence=a.evidence)
            out, key = {"status": "READY", "registered": a.screen}, "READY"
        elif a.cmd == "register-governed-stitch":
            registry.register_governed_stitch(a.kb, a.dtm, a.screen, a.artifact_ref, a.version, a.approved_by,
                                              a.states, a.breakpoints)
            out, key = {"status": "READY", "registered": a.screen}, "READY"
        else:
            registry.register_governed(a.kb, a.dtm, a.screen, a.file_ref, a.node_ref, a.version, a.approved_by,
                                       a.decision_ref, a.states, a.breakpoints, a.divergence)
            out, key = {"status": "READY", "registered": a.screen}, "READY"
    except registry.RegistryError as exc:
        out, key = {"status": "BLOCKED", "error": str(exc)}, "BLOCKED"
    # the console code page (cp1252 on Windows) must not decide the encoding of the JSON contract
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return EXIT[key]


if __name__ == "__main__":
    sys.exit(main())
