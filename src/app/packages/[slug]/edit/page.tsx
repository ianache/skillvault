import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getLatestPackageVersion, getPackage } from "@/lib/packages/service";
import { PackageEditorClient } from "@/components/packages/PackageEditorClient";
import { actorFromSession, capabilityError } from "../../../api/review-requests/route-utils";

export const dynamic = "force-dynamic";

export default async function PackageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor || capabilityError(actor, "content:manage")) return <main style={{ padding: 32 }}><h1>Sin permisos</h1><p>No tienes permisos para editar paquetes.</p></main>;
  try {
    const slug = (await params).slug;
    const [packageInfo, latestVersion] = await Promise.all([getPackage(slug, client), getLatestPackageVersion(slug, client)]);
    return <PackageEditorClient packageInfo={packageInfo} initialDraft={latestVersion} />;
  } catch { notFound(); }
}
