import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialSkillEditState,
  shouldUseHistoricalVersion,
  skillEditStateReducer,
} from "../../components/dashboard/skill-edit-state";

test("clean editors can use a historical version without prompting", () => {
  let prompted = false;

  const allowed = shouldUseHistoricalVersion(false, () => {
    prompted = true;
    return false;
  });

  assert.equal(allowed, true);
  assert.equal(prompted, false);
});

test("dirty editors keep their content when rollback confirmation is canceled", () => {
  assert.equal(shouldUseHistoricalVersion(true, () => false), false);
});

test("accepted historical versions remount the editor with dirty state", () => {
  const state = skillEditStateReducer(
    { ...initialSkillEditState, dirty: true },
    { type: "use-version", content: "# historical", key: 7 }
  );

  assert.deepEqual(state, {
    override: { content: "# historical", key: 7 },
    dirty: true,
  });
});
