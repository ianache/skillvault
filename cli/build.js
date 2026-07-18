#!/usr/bin/env node
// Simple ESM → CJS bundler for the skillvault CLI.
// No external dependencies — only Node built-ins.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

// --- Resolution order: visit each file once, depth-first ---
const visited = new Set();
const modules = []; // [{ id, absPath, code }]

function resolveLocal(importPath, fromDir) {
  let abs = resolve(fromDir, importPath);
  if (!abs.endsWith(".js")) abs += ".js";
  return abs;
}

function visit(absPath) {
  if (visited.has(absPath)) return;
  visited.add(absPath);

  let src = readFileSync(absPath, "utf8");
  const fromDir = dirname(absPath);

  // Find all local imports and visit them first (depth-first)
  const importRe = /^import\s+(?:\{[^}]*\}|\w+)\s+from\s+["'](\.[^"']+)["'];?/gm;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const dep = resolveLocal(m[1], fromDir);
    visit(dep);
  }

  modules.push({ id: relative(ROOT, absPath).replace(/\\/g, "/"), absPath, src, fromDir });
}

visit(resolve(ROOT, "bin/skillvault.js"));

// --- Transform each module: ESM → CJS-compatible ---
function transformModule(id, src, fromDir) {
  // Strip shebang
  src = src.replace(/^#!.*\n/, "");

  // Replace: import { a, b } from "./foo.js"  →  const { a, b } = __require("./foo.js")
  src = src.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["'](\.[^"']+)["'];?/gm,
    (_, names, path) => {
      const abs = resolveLocal(path, fromDir);
      const moduleId = relative(ROOT, abs).replace(/\\/g, "/");
      return `const {${names}} = __registry["${moduleId}"];`;
    }
  );

  // Replace: import defaultExport from "./foo.js"
  src = src.replace(
    /^import\s+(\w+)\s+from\s+["'](\.[^"']+)["'];?/gm,
    (_, name, path) => {
      const abs = resolveLocal(path, fromDir);
      const moduleId = relative(ROOT, abs).replace(/\\/g, "/");
      return `const ${name} = __registry["${moduleId}"].default ?? __registry["${moduleId}"];`;
    }
  );

  // Replace: import { x } from "node:fs" or "fs/promises" etc → require(...)
  src = src.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["']((?!\.)[^"']+)["'];?/gm,
    (_, names, pkg) => `const {${names}} = require("${pkg}");`
  );

  // Replace: import x from "pkg"
  src = src.replace(
    /^import\s+(\w+)\s+from\s+["']((?!\.)[^"']+)["'];?/gm,
    (_, name, pkg) => `const ${name} = require("${pkg}");`
  );

  // Replace: export async function foo / export function foo / export const foo
  const namedExports = [];
  src = src.replace(
    /^export\s+(async\s+)?(function|const|let|var)\s+(\w+)/gm,
    (_, async_, kw, name) => {
      namedExports.push(name);
      return `${async_ || ""}${kw} ${name}`;
    }
  );

  // Collect trailing export { a, b } statements
  src = src.replace(/^export\s+\{([^}]+)\};?/gm, (_, names) => {
    names.split(",").forEach(n => namedExports.push(n.trim()));
    return "";
  });

  // Wrap in registry setter
  const exportsObj = namedExports.length
    ? `{ ${namedExports.map(n => `${n}`).join(", ")} }`
    : "{}";

  return `
// ── module: ${id} ──
(function() {
${src}
__registry["${id}"] = ${exportsObj};
})();
`;
}

// --- Assemble ---
const parts = [
  `"use strict";`,
  `const __registry = {};`,
  `// Built-in shim: process.argv[0] is node, argv[1] is the exe`,
];

for (const mod of modules) {
  // Skip the entry point — handle it separately at the bottom
  if (mod.id === "bin/skillvault.js") continue;
  parts.push(transformModule(mod.id, mod.src, mod.fromDir));
}

// Entry point: just transform imports, don't wrap in registry
const entry = modules.find(m => m.id === "bin/skillvault.js");
let entrySrc = entry.src.replace(/^#!.*\n/, "");

entrySrc = entrySrc.replace(
  /^import\s+\{([^}]+)\}\s+from\s+["'](\.[^"']+)["'];?/gm,
  (_, names, path) => {
    const abs = resolveLocal(path, entry.fromDir);
    const moduleId = relative(ROOT, abs).replace(/\\/g, "/");
    return `const {${names}} = __registry["${moduleId}"];`;
  }
);
entrySrc = entrySrc.replace(
  /^import\s+\{([^}]+)\}\s+from\s+["']((?!\.)[^"']+)["'];?/gm,
  (_, names, pkg) => `const {${names}} = require("${pkg}");`
);
entrySrc = entrySrc.replace(
  /^import\s+(\w+)\s+from\s+["']((?!\.)[^"']+)["'];?/gm,
  (_, name, pkg) => `const ${name} = require("${pkg}");`
);

parts.push(`\n// ── ENTRY: bin/skillvault.js ──\n${entrySrc}`);

const bundle = parts.join("\n");
mkdirSync(resolve(ROOT, "dist"), { recursive: true });
const outPath = resolve(ROOT, "dist/skillvault.bundle.cjs");
writeFileSync(outPath, bundle, "utf8");
console.log(`✓ Bundle → ${outPath} (${(bundle.length / 1024).toFixed(1)} KB)`);
