"use client";

import { useState } from "react";
import { SkillEditor } from "./SkillEditor";
import { VersionHistory } from "./VersionHistory";

interface Props {
  slug: string;
  initialContent: string;
}

export function SkillEditPanel({ slug, initialContent }: Props) {
  const [override, setOverride] = useState<{ key: number; content: string } | null>(null);

  return (
    <>
      <SkillEditor
        key={override?.key ?? "current"}
        slug={slug}
        initialContent={override?.content ?? initialContent}
      />
      <VersionHistory
        slug={slug}
        onUseAsBase={(content) => setOverride({ key: Date.now(), content })}
      />
    </>
  );
}
