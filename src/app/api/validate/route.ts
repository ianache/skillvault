import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { validateSkillFrontmatter, validateBodySections } from "@/lib/skill-schema";

export async function POST(req: NextRequest) {
  try {
    const { rawContent } = await req.json();
    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json({ error: "rawContent requerido" }, { status: 400 });
    }

    const parsed = matter(rawContent);
    const fmResult = validateSkillFrontmatter(parsed.data);
    const bodyResult = validateBodySections(parsed.content);

    return NextResponse.json({
      valid: fmResult.valid && bodyResult.errors.length === 0,
      errors: [...fmResult.errors, ...bodyResult.errors],
      warnings: [...fmResult.warnings, ...bodyResult.warnings],
      parsed: fmResult.parsed,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
