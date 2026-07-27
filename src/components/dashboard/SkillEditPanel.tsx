"use client";

import { useState } from "react";
import { SkillEditor, SkillEditorInitialDirtyContext } from "./SkillEditor";
import { VersionHistory } from "./VersionHistory";

interface Props {
  slug: string;
  initialContent: string;
}

export function SkillEditPanel({ slug, initialContent }: Props) {
  const [override, setOverride] = useState<{ key: number; content: string } | null>(null);

  return (
    <>
      <SkillEditorInitialDirtyContext.Provider value={override !== null}>
        <SkillEditor
          key={override?.key ?? "current"}
          slug={slug}
          initialContent={override?.content ?? initialContent}
        />
      </SkillEditorInitialDirtyContext.Provider>
      <VersionHistory
        slug={slug}
        onUseAsBase={(content) => setOverride({ key: Date.now(), content })}
      />
    </>
  );
}
