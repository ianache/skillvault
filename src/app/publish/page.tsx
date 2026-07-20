"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Step1Metadata, MetadataFields } from "@/components/wizard/Step1Metadata";
import { Step2Editor } from "@/components/wizard/Step2Editor";
import { StepRequirements } from "@/components/wizard/StepRequirements";
import { Step3Review } from "@/components/wizard/Step3Review";
import { LocalSkillLoader, LoadedFile } from "@/components/wizard/LocalSkillLoader";
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
  // step 0 = loader, 1-4 = wizard steps (3 = requirements, 4 = review)
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [meta, setMeta] = useState<MetadataFields>(DEFAULT_META);
  const [content, setContent] = useState(getSkillTemplate());
  const [attachedFiles, setAttachedFiles] = useState<LoadedFile[]>([]);

  function handleLoaded(skill: import("@/components/wizard/LocalSkillLoader").LoadedSkill) {
    setContent(skill.skillMd);
    setAttachedFiles(skill.files);
    setStep(2); // Go straight to editor since SKILL.md is already loaded
  }

  function handleMetaNext() {
    setContent(buildContent(meta));
    setStep(2);
  }

  async function handlePublish() {
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent: content, files: attachedFiles }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Error del servidor" };

      router.push(`/publish/success?slug=${data.slug}&reviewRequestId=${data.reviewRequestId}`);
      return { ok: true, slug: data.slug };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  // Step 0: loader screen (outside WizardLayout)
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        {/* Minimal header */}
        <div
          style={{
            height: "56px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: "12px",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "24px", height: "24px", background: "var(--accent)", borderRadius: "4px",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", color: "#fff", fontWeight: 700,
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              SV
            </span>
            <span style={{ fontFamily: "var(--font-geist), sans-serif", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
              SkillVault
            </span>
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Publicar Skill</span>
        </div>

        <div style={{ maxWidth: "640px", margin: "48px auto", padding: "0 24px" }}>
          <LocalSkillLoader
            onLoaded={handleLoaded}
            onSkip={() => setStep(1)}
          />
        </div>
      </div>
    );
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
        <>
          <Step2Editor
            content={content}
            onChange={setContent}
            onNext={() => setStep(3)}
            onBack={() => setStep(attachedFiles.length > 0 ? 0 : 1)}
          />
          {attachedFiles.length > 0 && (
            <AttachedFilesBadge files={attachedFiles} />
          )}
        </>
      )}
      {step === 3 && (
        <StepRequirements
          content={content}
          onChange={setContent}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <Step3Review
          content={content}
          attachedFiles={attachedFiles}
          onBack={() => setStep(3)}
          onPublish={handlePublish}
        />
      )}
    </WizardLayout>
  );
}

function AttachedFilesBadge({ files }: { files: LoadedFile[] }) {
  const resources = files.filter((f) => f.fileType === "resource");
  const scripts = files.filter((f) => f.fileType === "script");
  return (
    <div
      style={{
        marginTop: "16px",
        padding: "10px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)" }}>
        Archivos adjuntos
      </span>
      {resources.length > 0 && (
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>📄 {resources.length} resource{resources.length > 1 ? "s" : ""}</span>
      )}
      {scripts.length > 0 && (
        <span style={{ fontSize: "12px", color: "var(--amber)" }}>⚡ {scripts.length} script{scripts.length > 1 ? "s" : ""}</span>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginLeft: "auto" }}>
        {files.map((f) => (
          <span
            key={f.path}
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              padding: "1px 6px",
              borderRadius: "3px",
              border: `1px solid ${f.fileType === "script" ? "var(--amber)" : "var(--border)"}`,
              color: f.fileType === "script" ? "var(--amber)" : "var(--faint)",
            }}
          >
            {f.path}
          </span>
        ))}
      </div>
    </div>
  );
}
