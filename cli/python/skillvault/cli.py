import os
import shutil
import subprocess
import sys


def main():
    pkg_dir = os.path.dirname(os.path.abspath(__file__))

    binary_name = "skillvault-bin"
    if os.name == "nt":
        binary_name += ".exe"

    binary_path = os.path.join(pkg_dir, binary_name)

    if os.path.exists(binary_path):
        try:
            res = subprocess.run([binary_path] + sys.argv[1:])
            sys.exit(res.returncode)
        except Exception as exc:
            print(f"Error executing embedded binary: {exc}", file=sys.stderr)
            sys.exit(1)

    bundle_path = os.path.join(pkg_dir, "skillvault.bundle.cjs")
    if os.path.exists(bundle_path):
        node_path = shutil.which("node")
        if not node_path:
            print(
                "Error: Node.js is required to run the light version of skillvault.\n"
                "Please install Node.js (v18+) or install the platform-specific native package.",
                file=sys.stderr,
            )
            sys.exit(1)
        try:
            res = subprocess.run([node_path, bundle_path] + sys.argv[1:])
            sys.exit(res.returncode)
        except Exception as exc:
            print(f"Error executing JS bundle with Node.js: {exc}", file=sys.stderr)
            sys.exit(1)

    print(
        "Error: skillvault installation is corrupted. No executable or JS bundle found.",
        file=sys.stderr,
    )
    sys.exit(1)
