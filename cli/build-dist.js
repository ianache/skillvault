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

function runCmd(cmd, cwd = ROOT, options = {}) {
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    });
    return true;
  } catch (err) {
    if (options.allowFailure) {
      console.warn(`Warning: command failed: ${cmd}`);
      return false;
    }
    throw err;
  }
}

async function build() {
  console.log("=== Starting Build and Packaging Pipeline ===");

  cleanDir(DIST);
  cleanDir(WHEELS_DIR);
  cleanDir(BIN_DIR);
  cleanDir(TMP_DIR);

  console.log("\n--- Building JS Bundle ---");
  runCmd("node build.js");

  const packageVersion = "0.2.2";
  const pythonSource = path.resolve(ROOT, "python");
  const platforms = [
    {
      name: "win-x64",
      pkgTarget: "node22-win-x64",
      binName: "skillvault-win-x64.exe",
      outBinName: "skillvault-bin.exe",
      tag: "win_amd64",
    },
    {
      name: "linux-x64",
      pkgTarget: "node22-linux-x64",
      binName: "skillvault-linux-x64",
      outBinName: "skillvault-bin",
      tag: "manylinux2014_x86_64",
    },
    {
      name: "macos-x64",
      pkgTarget: "node22-macos-x64",
      binName: "skillvault-macos-x64",
      outBinName: "skillvault-bin",
      tag: "macosx_10_9_x86_64",
    },
  ];

  console.log("\n--- Compiling Native Binaries with pkg ---");
  for (const plat of platforms) {
    const outputPath = path.resolve(BIN_DIR, plat.binName);
    runCmd(
      `npx --no-install pkg . --targets ${plat.pkgTarget} --output "${outputPath}"`,
      ROOT,
      { allowFailure: true },
    );
  }

  console.log("\n--- Packaging Universal Wheel (any) ---");
  const pureTmp = path.resolve(TMP_DIR, "pure");
  cleanDir(pureTmp);
  fs.cpSync(pythonSource, pureTmp, { recursive: true });
  fs.cpSync(
    path.resolve(DIST, "skillvault.bundle.cjs"),
    path.resolve(pureTmp, "skillvault", "skillvault.bundle.cjs"),
  );
  fs.copyFileSync(path.resolve(ROOT, "../README.md"), path.resolve(pureTmp, "README.md"));
  runCmd(`python -m build --wheel --outdir "${WHEELS_DIR}"`, pureTmp);

  for (const plat of platforms) {
    console.log(`\n--- Packaging Platform Wheel: ${plat.name} ---`);
    const platTmp = path.resolve(TMP_DIR, plat.name);
    cleanDir(platTmp);
    fs.cpSync(pythonSource, platTmp, { recursive: true });

    const srcBin = path.resolve(BIN_DIR, plat.binName);
    const destBin = path.resolve(platTmp, "skillvault", plat.outBinName);
    if (fs.existsSync(srcBin)) {
      fs.copyFileSync(srcBin, destBin);
    } else {
      console.warn(`Warning: Binary for ${plat.name} not found at ${srcBin}`);
      continue;
    }

    fs.copyFileSync(path.resolve(ROOT, "../README.md"), path.resolve(platTmp, "README.md"));

    const platWheelDir = path.resolve(TMP_DIR, `${plat.name}-wheel`);
    cleanDir(platWheelDir);
    runCmd(`python -m build --wheel --outdir "${platWheelDir}"`, platTmp);

    const genericWheel = path.resolve(platWheelDir, `skillvault-${packageVersion}-py3-none-any.whl`);
    if (fs.existsSync(genericWheel)) {
      runCmd(`python -m wheel tags --remove --platform-tag ${plat.tag} "${genericWheel}"`);
      const taggedWheel = path.resolve(
        platWheelDir,
        `skillvault-${packageVersion}-py3-none-${plat.tag}.whl`,
      );
      const platformWheel = path.resolve(WHEELS_DIR, path.basename(taggedWheel));
      fs.renameSync(taggedWheel, platformWheel);
      console.log(`Successfully generated platform wheel: ${platformWheel}`);
    }
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log("\n=== Packaging Completed ===");
  console.log(`Files generated in: ${DIST}`);
}

build().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
