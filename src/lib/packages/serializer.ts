import JSZip from "jszip";
import { validatePublishedManifest } from "./validation";
import type { PackageManifest } from "./types";

export function serializePackageJson(manifest: PackageManifest): string {
  return JSON.stringify(validatePublishedManifest(manifest), null, 2);
}

export async function serializePackageZip(manifest: PackageManifest): Promise<Buffer> {
  const valid = validatePublishedManifest(manifest);
  const outer = new JSZip();
  outer.file("manifest.json", serializePackageJson(valid));
  for (const item of valid.items) {
    const inner = new JSZip();
    inner.file("SKILL.md", item.rawContent ?? "");
    for (const file of item.files ?? []) inner.file(file.path, file.content);
    outer.file(`skills/${item.slug}.zip`, await inner.generateAsync({ type: "nodebuffer" }));
  }
  return outer.generateAsync({ type: "nodebuffer" });
}
