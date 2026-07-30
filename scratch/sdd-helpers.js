const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];

const root = execSync('git rev-parse --show-toplevel').toString().trim();
const sddDir = path.join(root, '.superpowers', 'sdd');

if (!fs.existsSync(sddDir)) {
  fs.mkdirSync(sddDir, { recursive: true });
}
fs.writeFileSync(path.join(sddDir, '.gitignore'), '*\n');

if (command === 'task-brief') {
  const planFile = args[1];
  const taskNum = args[2];
  if (!planFile || !taskNum) {
    console.error('Usage: node sdd-helpers.js task-brief PLAN_FILE TASK_NUMBER');
    process.exit(1);
  }

  const planContent = fs.readFileSync(planFile, 'utf8');
  const lines = planContent.split('\n');
  let intask = false;
  let infence = false;
  const outLines = [];

  const taskHeaderRegex = new RegExp(`^#+[ \\t]+Task[ \\t]+${taskNum}([^0-9]|$)`, 'i');

  for (const line of lines) {
    if (line.startsWith('```')) {
      infence = !infence;
    }
    if (!infence && /^#+[ \t]+Task[ \t]+[0-9]+/i.test(line)) {
      intask = taskHeaderRegex.test(line);
    }
    if (intask) {
      outLines.push(line);
    }
  }

  const outPath = path.join(sddDir, `task-${taskNum}-brief.md`);
  fs.writeFileSync(outPath, outLines.join('\n'), 'utf8');
  console.log(`wrote ${outPath}: ${outLines.length} lines`);

} else if (command === 'review-package') {
  const base = args[1];
  const head = args[2];
  if (!base || !head) {
    console.error('Usage: node sdd-helpers.js review-package BASE HEAD');
    process.exit(1);
  }

  const shortBase = execSync(`git rev-parse --short ${base}`).toString().trim();
  const shortHead = execSync(`git rev-parse --short ${head}`).toString().trim();
  const outPath = path.join(sddDir, `review-${shortBase}..${shortHead}.diff`);

  const commits = execSync(`git log --oneline ${base}..${head}`).toString().trim();
  const stat = execSync(`git diff --stat ${base}..${head}`).toString().trim();
  const diff = execSync(`git diff -U10 ${base}..${head}`).toString().trim();

  const content = `# Review package: ${base}..${head}

## Commits
${commits}

## Files changed
${stat}

## Diff
${diff}
`;

  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`wrote ${outPath}: ${execSync(`git rev-list --count ${base}..${head}`).toString().trim()} commit(s)`);
} else {
  console.error('Unknown command. Use task-brief or review-package');
  process.exit(1);
}
