export function validateReviewFilePath(path: string): string {
  const normalized = path.replace(/\\/g, "/").trim();
  if (!normalized) throw new Error("File path is required");
  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized)) {
    throw new Error("File path must be relative");
  }
  if (normalized.split("/").includes("..")) {
    throw new Error("File path must not contain traversal");
  }
  return normalized;
}
