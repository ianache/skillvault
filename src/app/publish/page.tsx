"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Step1Metadata, MetadataFields } from "@/components/wizard/Step1Metadata";
import { Step2Editor } from "@/components/wizard/Step2Editor";
import { Step3Review } from "@/components/wizard/Step3Review";
import { getSkillTemplate } from "@/lib/skill-schema";

const DEFAULT_META: MetadataFields = {
  name: "",
  description: "",
  type: "",
  version: "1.0.0",
  author: "",
  compatibility: ["claude"],
  primaryTrigger: "",
  extraTriggers: "",
};

function buildContent(meta: MetadataFields): string {
  const triggers = [
    meta.primaryTrigger,
    ...meta.extraTriggers.split("\n").map((t) => t.trim()).filter(Boolean),
  ].filter(Boolean);

  return getSkillTemplate(meta.name || "mi-skill", meta.type || "code")
    .replace(/^name: .+$/m, `name: ${meta.name || "mi-skill"}`)
    .replace(/^description: .+$/m, `description: ${meta.description || "Describe aquí qué hace este skill."}`)
    .replace(/^version: .+$/m, `version: ${meta.version || "1.0.0"}`)
    .replace(/^author: .+$/m, `author: "${meta.author || "@tu-handle"}"`)
    .replace(/  type: .+/m, `  type: ${meta.type || "code"}`)
    .replace(
      /  triggers:\n(    - .+\n)+/m,
      `  triggers:\n${triggers.map((t) => `    - ${t}`).join("\n")}\n`
    )
    .replace(
      /compatibility:\n(  - .+\n)+/m,
      `compatibility:\n${meta.compatibility.map((h) => `  - ${h}`).join("\n")}\n`
    );
}

export default function PublishPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState<MetadataFields>(DEFAULT_META);
  const [content, setContent] = useState(getSkillTemplate());

  function handleMetaNext() {
    // Sync meta fields into the SKILL.md content
    setContent(buildContent(meta));
    setStep(2);
  }

  async function handlePublish() {
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent: content }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Error del servidor" };
      router.push(`/publish/success?slug=${data.slug}`);
      return { ok: true, slug: data.slug };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  return (
    <WizardLayout currentStep={step}>
      {step === 1 && (
        <Step1Metadata
          data={meta}
          onChange={setMeta}
          onNext={handleMetaNext}
        />
      )}
      {step === 2 && (
        <Step2Editor
          content={content}
          onChange={setContent}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Review
          content={content}
          onBack={() => setStep(2)}
          onPublish={handlePublish}
        />
      )}
    </WizardLayout>
  );
}
