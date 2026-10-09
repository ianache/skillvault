from pathlib import Path
import re, sys

REQUIRED = ['artifact:', 'okf:', 'generated:', 'verified:', 'status:', 'sources:', 'provenance:', 'visual_design:', '## Visual design', '## Identity', '## Behavior and visual contract', '## Accessibility and security', '## Verification', '## Traceability']
ALLOWED = {'READY_FOR_DEV', 'REQUIRES_REVIEW', 'BLOCKED'}

TOOLS = {'stitch', 'claude-design'}
VSTATUS = {'linked', 'pending', 'waived'}

def field(block, name):
    m = re.search(rf'^\s+{name}:\s*(.*)$', block, re.M)
    return m.group(1).split('#')[0].strip().strip('"\'') if m else ''

def check_visual(text):
    m = re.search(r'^visual_design:[ \t]*\n((?:[ \t]+.*\n?)+)', text, re.M)
    if not m:
        return []
    b, errs = m.group(1), []
    st = field(b, 'status')
    tool = field(b, 'tool')
    if tool not in TOOLS and not (st == 'pending' and not tool):
        errs.append('visual_design.tool must be stitch or claude-design (empty only while pending)')
    if st not in VSTATUS:
        errs.append('visual_design.status must be linked, pending or waived')
    if st == 'linked':
        for k in ('project_id', 'screen_id', 'design_system'):
            if not field(b, k):
                errs.append(f'visual_design.{k} required when linked')
        if re.search(r'^\s+covers:\s*\[\s*\]', b, re.M):
            errs.append('visual_design.covers must list variants/states when linked')
    if st == 'waived' and not field(b, 'waiver_reason'):
        errs.append('visual_design.waiver_reason required when waived')
    if st != 'linked' and re.search(r'^status:\s*READY_FOR_DEV', text, re.M):
        errs.append('READY_FOR_DEV requires visual_design.status linked')
    return errs

def validate(path: Path):
    text = path.read_text(encoding='utf-8')
    errors = [f'missing: {x}' for x in REQUIRED if x not in text]
    m = re.search(r'^status:\s*(\S+)', text, re.M)
    if not m or m.group(1) not in ALLOWED:
        errors.append('status must be READY_FOR_DEV, REQUIRES_REVIEW or BLOCKED')
    if '## Component contract' not in text and '## Angular contract' not in text:
        errors.append('missing: ## Component contract')
    errors += check_visual(text)
    if re.search(r'(?i)human-reviewed\s*:\s*true|human_reviewed\s*:\s*true', text):
        errors.append('agents cannot set human-reviewed true')
    return errors

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('usage: python validate_component_spec.py COMPONENT.md')
        raise SystemExit(2)
    errs = validate(Path(sys.argv[1]))
    if errs:
        print('\n'.join(errs)); raise SystemExit(1)
    print('valid component specification envelope')
