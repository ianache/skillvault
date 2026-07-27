export type SkillEditState = {
  override: { key: number; content: string } | null;
  dirty: boolean;
};

export type SkillEditAction =
  | { type: "dirty-changed"; dirty: boolean }
  | { type: "use-version"; key: number; content: string };

export const initialSkillEditState: SkillEditState = {
  override: null,
  dirty: false,
};

export function skillEditStateReducer(state: SkillEditState, action: SkillEditAction): SkillEditState {
  if (action.type === "dirty-changed") {
    return state.dirty === action.dirty ? state : { ...state, dirty: action.dirty };
  }

  return {
    override: { key: action.key, content: action.content },
    dirty: true,
  };
}

export function shouldUseHistoricalVersion(
  dirty: boolean,
  confirmDiscard: () => boolean
): boolean {
  return !dirty || confirmDiscard();
}
