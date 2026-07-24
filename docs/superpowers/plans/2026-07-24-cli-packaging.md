# CLI Packaging & Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package and distribute the skillvault CLI as both native executables (Windows, macOS, Linux) and Python wheels (universal and platform-specific), automating releases via GitHub Actions.

**Architecture:** A unified JavaScript build script (`cli/build-dist.js`) bundles the ES modules into a single CommonJS file, compiles native executables via `pkg`, structure directories for python wheels, executes `python -m build`, and outputs the final `.whl` files. A Python wrapper invokes either the native binary or the JS bundle using Node.js.

**Tech Stack:** Node.js, `@yao-pkg/pkg`, Python 3, `build` (Python wheel building library), GitHub Actions.

## Global Constraints
- Target Python Version: `>=3.8`
- Target Node Version: `>=18`
- Executable Packaging Tool: `@yao-pkg/pkg`
- Output directories: `cli/dist/bin` for binaries and `cli/dist/wheels` for `.whl` files.

---

### Task 1: Python Project Scaffolding
Create the Python package structure and metadata files.

**Files:**
- Create: `cli/python/pyproject.toml`
- Create: `cli/python/skillvault/__init__.py`
- Create: `cli/python/skillvault/__main__.py`

**Interfaces:**
- Consumes: None
- Produces: Base directory for Python packaging that can be built by Python's `build` module.

- [ ] **Step 1: Create python directory and pyproject.toml**

Write the following content to `cli/python/pyproject.toml`:
```toml
[build-system]
requires = ["setuptools>=61.0.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "skillvault"
version = "0.2.2"
description = "CLI to install and manage SKILL.md skills from SkillVault"
readme = "README.md"
requires-python = ">=3.8"
license = {text = "MIT"}
classifiers = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
]

[project.scripts]
skillvault = "skillvault.cli:main"
```

- [ ] **Step 2: Create python package files**

Write to `cli/python/skillvault/__init__.py`:
```python
__version__ = "0.2.2"
```

Write to `cli/python/skillvault/__main__.py`:
```python
from skillvault.cli import main
if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit files**
Run:
```bash
git add cli/python/pyproject.toml cli/python/skillvault/__init__.py cli/python/skillvault/__main__.py
git commit -m "feat: scaffold Python CLI package metadata and entrypoint"
```

---

### Task 2: Implement CLI Detection and Invocator
Implement the Python code to run the Node.js bundle or native executable.

**Files:**
- Create: `cli/python/skillvault/cli.py`
- Create: `cli/python/test_cli_wrapper.py`

**Interfaces:**
- Consumes: `cli/dist/skillvault.bundle.cjs` (light/universal wheel) or `skillvault-bin` (platform-specific wheel).
- Produces: `skillvault.cli:main` function executing the CLI.

- [ ] **Step 1: Write CLI detection logic**
Write to `cli/python/skillvault/cli.py`:
```python
import sys
import subprocess
import os
import shutil

def main():
    pkg_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Check for platform-specific binary
    binary_name = "skillvault-bin"
    if os.name == "nt":
        binary_name += ".exe"
    
    binary_path = os.path.join(pkg_dir, binary_name)
    
    if os.path.exists(binary_path):
        try:
            res = subprocess.run([binary_path] + sys.argv[1:])
            sys.exit(res.returncode)
        except Exception as e:
            print(f"Error executing embedded binary: {e}", file=sys.stderr)
            sys.exit(1)
            
    # Check for JS bundle fallback
    bundle_path = os.path.join(pkg_dir, "skillvault.bundle.cjs")
    if os.path.exists(bundle_path):
        node_path = shutil.which("node")
        if not node_path:
            print(
                "Error: Node.js is required to run the light version of skillvault.\n"
                "Please install Node.js (v18+) or install the platform-specific native package.",
                file=sys.stderr
            )
            sys.exit(1)
        try:
            res = subprocess.run([node_path, bundle_path] + sys.argv[1:])
            sys.exit(res.returncode)
        except Exception as e:
            print(f"Error executing JS bundle with Node.js: {e}", file=sys.stderr)
            sys.exit(1)

    print("Error: skillvault installation is corrupted. No executable or JS bundle found.", file=sys.stderr)
    sys.exit(1)
```

- [ ] **Step 2: Create unit tests for Python CLI wrapper**
Write to `cli/python/test_cli_wrapper.py`:
```python
import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from skillvault.cli import main

class TestCLIWrapper(unittest.TestCase):
    @patch('os.path.exists')
    @patch('subprocess.run')
    def test_calls_native_binary_if_present(self, mock_run, mock_exists):
        # Setup: binary exists
        mock_exists.side_effect = lambda path: "skillvault-bin" in path
        mock_run.return_value = MagicMock(returncode=0)
        
        with patch('sys.argv', ['skillvault', '--version']):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 0)
            mock_run.assert_called_once()
            self.assertIn("skillvault-bin", mock_run.call_args[0][0][0])

    @patch('os.path.exists')
    @patch('shutil.which')
    @patch('subprocess.run')
    def test_calls_node_with_bundle_if_no_binary(self, mock_run, mock_which, mock_exists):
        # Setup: only bundle exists, node exists
        mock_exists.side_effect = lambda path: "skillvault.bundle.cjs" in path
        mock_which.return_value = "/usr/bin/node"
        mock_run.return_value = MagicMock(returncode=0)
        
        with patch('sys.argv', ['skillvault', '--version']):
            with self.assertRaises(SystemExit) as cm:
                main()
            self.assertEqual(cm.exception.code, 0)
            mock_run.assert_called_once()
            self.assertEqual(mock_run.call_args[0][0][0], "/usr/bin/node")

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 3: Run the unit test to verify implementation**
Run:
```bash
python cli/python/test_cli_wrapper.py
```
Expected output:
`Ran 2 tests in ...s`
`OK`

- [ ] **Step 4: Commit wrapper code**
Run:
```bash
git add cli/python/skillvault/cli.py cli/python/test_cli_wrapper.py
git commit -m "feat: implement CLI detection and subprocess runner with tests"
```

---

### Task 3: Build Scripts Configuration
Update Node.js dependency settings and script commands in the package configurations.

**Files:**
- Modify: `cli/package.json`

**Interfaces:**
- Consumes: None
- Produces: CLI commands `npm run build:wheels` and standard configs for target platform packaging.

- [ ] **Step 1: Update package.json scripts and pkg targets**
Modify `cli/package.json` so that the `"scripts"` object includes:
```json
    "build:all": "node build-dist.js"
```
And verify targets for pkg are correct in `"pkg"`:
```json
  "pkg": {
    "targets": [
      "node18-win-x64",
      "node18-macos-x64",
      "node18-linux-x64"
    ],
    "outputPath": "dist/bin"
  }
```

- [ ] **Step 2: Commit build script addition**
Run:
```bash
git add cli/package.json
git commit -m "config: configure pkg output target and add build:all script"
```

---

### Task 4: Implement unified packaging script
Write the JavaScript orquestator that builds JS, compiles via `pkg`, creates staging directories, and calls Python build.

**Files:**
- Create: `cli/build-dist.js`

**Interfaces:**
- Consumes: `pkg`, Python installation with `build` module.
- Produces: Built native binaries in `cli/dist/bin/` and wheel packages in `cli/dist/wheels/`.

- [ ] **Step 1: Write packaging automation script**
Write to `cli/build-dist.js`:
```javascript
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST = path.resolve(ROOT, "dist");
const WHEELS_DIR = path.resolve(DIST, "wheels");
const BIN_DIR = path.resolve(DIST, "bin");
const TMP_DIR = path.resolve(DIST, "tmp");

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function runCmd(cmd, cwd = ROOT) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

async function build() {
  console.log("=== Starting Build and Packaging Pipeline ===");
  
  // Clean output dirs
  cleanDir(DIST);
  cleanDir(WHEELS_DIR);
  cleanDir(BIN_DIR);
  cleanDir(TMP_DIR);

  // 1. Build the JS Bundle
  console.log("\n--- Building JS Bundle ---");
  runCmd("node build.js");

  // 2. Compile Native Binaries via pkg
  console.log("\n--- Compiling Native Binaries with pkg ---");
  runCmd("npx pkg . --out-path dist/bin");

  // 3. Build Python Wheels
  const packageVersion = "0.2.2";
  const pythonSource = path.resolve(ROOT, "python");

  // 3a. Universal Wheel (any)
  console.log("\n--- Packaging Universal Wheel (any) ---");
  const pureTmp = path.resolve(TMP_DIR, "pure");
  cleanDir(pureTmp);
  fs.cpSync(pythonSource, pureTmp, { recursive: true });
  fs.cpSync(
    path.resolve(DIST, "skillvault.bundle.cjs"),
    path.resolve(pureTmp, "skillvault", "skillvault.bundle.cjs")
  );
  // Copy README
  fs.copyFileSync(path.resolve(ROOT, "../README.md"), path.resolve(pureTmp, "README.md"));
  runCmd("python -m build --wheel --outdir " + WHEELS_DIR, pureTmp);

  // 3b. Platform Wheels
  const platforms = [
    { name: "win-x64", binName: "skillvault-win-x64.exe", outBinName: "skillvault-bin.exe", tag: "win_amd64" },
    { name: "linux-x64", binName: "skillvault-linux-x64", outBinName: "skillvault-bin", tag: "manylinux2014_x86_64" },
    { name: "macos-x64", binName: "skillvault-macos-x64", outBinName: "skillvault-bin", tag: "macosx_10_9_x86_64" }
  ];

  for (const plat of platforms) {
    console.log(`\n--- Packaging Platform Wheel: ${plat.name} ---`);
    const platTmp = path.resolve(TMP_DIR, plat.name);
    cleanDir(platTmp);
    fs.cpSync(pythonSource, platTmp, { recursive: true });
    
    // Copy the specific binary
    const srcBin = path.resolve(BIN_DIR, plat.binName);
    const destBin = path.resolve(platTmp, "skillvault", plat.outBinName);
    if (fs.existsSync(srcBin)) {
      fs.copyFileSync(srcBin, destBin);
    } else {
      console.warn(`Warning: Binary for ${plat.name} not found at ${srcBin}`);
      continue;
    }
    
    // Copy README
    fs.copyFileSync(path.resolve(ROOT, "../README.md"), path.resolve(platTmp, "README.md"));

    // Build standard wheel (generates any wheel, then we rename it to force the platform tag)
    runCmd("python -m build --wheel --outdir " + WHEELS_DIR, platTmp);
    
    // Rename to inject platform tag
    const genericWheel = path.resolve(WHEELS_DIR, `skillvault-${packageVersion}-py3-none-any.whl`);
    const platformWheel = path.resolve(WHEELS_DIR, `skillvault-${packageVersion}-py3-none-${plat.tag}.whl`);
    if (fs.existsSync(genericWheel)) {
      fs.renameSync(genericWheel, platformWheel);
      console.log(`Successfully generated platform wheel: ${platformWheel}`);
    }
  }

  // Cleanup tmp folder
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log("\n=== Packaging Completed ===");
  console.log(`Files generated in: ${DIST}`);
}

build().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit packaging script**
Run:
```bash
git add cli/build-dist.js
git commit -m "feat: add build-dist.js script to automate pkg compilation and python wheel packaging"
```

---

### Task 5: Setup GitHub Actions Automation
Create the workflows to run the packaging and attach build artifacts to releases.

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: GitHub release creation webhook.
- Produces: Uploaded release assets.

- [ ] **Step 1: Create workflow file**
Write to `.github/workflows/release.yml`:
```yaml
name: Release Artifacts

on:
  release:
    types: [created]

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install Node Dependencies
        run: |
          cd cli
          npm install

      - name: Install Python Packaging Tools
        run: pip install build

      - name: Run Build and Packaging Script
        run: |
          cd cli
          node build-dist.js

      - name: Upload Artifacts to Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            cli/dist/bin/*
            cli/dist/wheels/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit workflow**
Run:
```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions workflow to build and upload wheels/binaries on release"
```
