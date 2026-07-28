import sys
import os
import subprocess

def run_git(args):
    try:
        res = subprocess.run(["git"] + args, capture_output=True, text=True, check=True, encoding="utf-8")
        return res.stdout.strip()
    except Exception as e:
        print(f"Error running git {' '.join(args)}: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print("Usage: python review_package.py BASE HEAD [OUTFILE]", file=sys.stderr)
        sys.exit(1)
        
    base = sys.argv[1]
    head = sys.argv[2]
    
    # Verify git commits
    run_git(["rev-parse", "--verify", "--quiet", base])
    run_git(["rev-parse", "--verify", "--quiet", head])
    
    base_short = run_git(["rev-parse", "--short", base])
    head_short = run_git(["rev-parse", "--short", head])
    
    if len(sys.argv) == 4:
        out_file = sys.argv[3]
    else:
        root = os.getcwd()
        sdd_dir = os.path.join(root, ".superpowers", "sdd")
        os.makedirs(sdd_dir, exist_ok=True)
        out_file = os.path.join(sdd_dir, f"review-{base_short}..{head_short}.diff")
        
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(f"# Review package: {base}..{head}\n\n")
        f.write("## Commits\n")
        f.write(run_git(["log", "--oneline", f"{base}..{head}"]) + "\n\n")
        f.write("## Files changed\n")
        f.write(run_git(["diff", "--stat", f"{base}..{head}"]) + "\n\n")
        f.write("## Diff\n")
        f.write(run_git(["diff", "-U10", f"{base}..{head}"]) + "\n")
        
    commits_count = run_git(["rev-list", "--count", f"{base}..{head}"])
    bytes_count = os.path.getsize(out_file)
    print(f"Wrote {out_file}: {commits_count} commit(s), {bytes_count} bytes")

if __name__ == "__main__":
    main()
