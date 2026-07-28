import sys
import os
import re

def extract_task(plan_file, task_num, out_file=None):
    if not os.path.exists(plan_file):
        print(f"Plan file not found: {plan_file}", file=sys.stderr)
        sys.exit(1)
        
    with open(plan_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Split content by lines
    lines = content.split('\n')
    
    task_header_pattern = re.compile(rf"^###\s+Task\s+{task_num}\b", re.IGNORECASE)
    any_task_header_pattern = re.compile(r"^###\s+Task\s+\d+", re.IGNORECASE)
    
    extracted_lines = []
    in_task = False
    
    for line in lines:
        if any_task_header_pattern.match(line):
            if task_header_pattern.match(line):
                in_task = True
            elif in_task:
                # We hit the next task, so stop
                break
        
        if in_task:
            extracted_lines.append(line)
            
    if not extracted_lines:
        print(f"Task {task_num} not found in {plan_file}", file=sys.stderr)
        sys.exit(1)
        
    if out_file is None:
        # Default destination: repo-root/.superpowers/sdd/task-N-brief.md
        root = os.getcwd()
        sdd_dir = os.path.join(root, ".superpowers", "sdd")
        os.makedirs(sdd_dir, exist_ok=True)
        # Create .gitignore in .superpowers/sdd if it doesn't exist
        gitignore = os.path.join(sdd_dir, ".gitignore")
        if not os.path.exists(gitignore):
            with open(gitignore, "w", encoding="utf-8") as gf:
                gf.write("*\n")
        out_file = os.path.join(sdd_dir, f"task-{task_num}-brief.md")
        
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(extracted_lines) + "\n")
        
    print(f"Wrote {out_file}: {len(extracted_lines)} lines")

if __name__ == "__main__":
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print("Usage: python task_brief.py PLAN_FILE TASK_NUMBER [OUTFILE]", file=sys.stderr)
        sys.exit(1)
        
    plan = sys.argv[1]
    task_n = sys.argv[2]
    out = sys.argv[3] if len(sys.argv) == 4 else None
    
    extract_task(plan, task_n, out)
