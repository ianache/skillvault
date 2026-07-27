import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { join } from "node:path";

const dashboardPath = join(process.cwd(), "src", "components", "dashboard");

test("rollback wrapper marks a remounted editor as initially dirty", () => {
  const panel = readFileSync(join(dashboardPath, "SkillEditPanel.tsx"), "utf8");
  const editor = readFileSync(join(dashboardPath, "SkillEditor.tsx"), "utf8");

  assert.match(panel, /<SkillEditorInitialDirtyContext\.Provider value=\{override !== null\}>/);
  assert.match(editor, /const initiallyDirty = useContext\(SkillEditorInitialDirtyContext\);/);
  assert.match(editor, /const \[dirty, setDirty\] = useState\(initiallyDirty\);/);
});
