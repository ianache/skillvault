#!/usr/bin/env node
import { copyFileSync, mkdirSync, renameSync, rmSync } from "fs";
import { dirname, resolve } from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(ROOT, "dist", "skillvault-win-x64.exe");
const TMP_OUT = resolve(ROOT, "dist", "skillvault-win-x64.exe.tmp");
const BLOB = resolve(ROOT, "dist", "sea-prep.blob");
const POSTJECT = resolve(ROOT, "node_modules", ".bin", process.platform === "win32" ? "postject.cmd" : "postject");
const FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";

mkdirSync(dirname(OUT), { recursive: true });
rmSync(TMP_OUT, { force: true });
copyFileSync(process.execPath, TMP_OUT);

const result = spawnSync(
  POSTJECT,
  [TMP_OUT, "NODE_SEA_BLOB", BLOB, "--sentinel-fuse", FUSE],
  { stdio: "inherit", shell: process.platform === "win32" }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

rmSync(OUT, { force: true });
renameSync(TMP_OUT, OUT);
console.log(`✓ Executable → ${OUT}`);
