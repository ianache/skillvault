"use client";

import { useCallback, useMemo, useReducer } from "react";
import { SkillEditor, SkillEditorDirtyContext } from "./SkillEditor";
import {
  initialSkillEditState,
  shouldUseHistoricalVersion,
  skillEditStateReducer,
} from "./skill-edit-state";
import { VersionHistory } from "./VersionHistory";

interface Props {
  slug: string;
  initialContent: string;
}

export function SkillEditPanel({ slug, initialContent }: Props) {
  const [state, dispatch] = useReducer(skillEditStateReducer, initialSkillEditState);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dispatch({ type: "dirty-changed", dirty });
  }, []);
  const dirtyContext = useMemo(() => ({
    initiallyDirty: state.override !== null,
    onDirtyChange: handleDirtyChange,
  }), [handleDirtyChange, state.override]);

  function handleUseAsBase(content: string) {
    const allowed = shouldUseHistoricalVersion(
      state.dirty,
      () => window.confirm("Hay cambios sin guardar. Reemplazarlos con esta version historica?")
    );
    if (!allowed) return;
    dispatch({ type: "use-version", key: Date.now(), content });
  }

  return (
    <>
      <SkillEditorDirtyContext.Provider value={dirtyContext}>
        <SkillEditor
          key={state.override?.key ?? "current"}
          slug={slug}
          initialContent={state.override?.content ?? initialContent}
        />
      </SkillEditorDirtyContext.Provider>
      <VersionHistory
        slug={slug}
        onUseAsBase={handleUseAsBase}
      />
    </>
  );
}
