import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getDraftManifest, getPackage } from "@/lib/packages/service";
import { PackageReviewClient } from "@/components/packages/PackageReviewClient";
import { actorFromSession, capabilityError } from "../../../api/review-requests/route-utils";

export const dynamic = "force-dynamic";

export default async function PackageReviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ version?: string }> }) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor || capabilityError(actor, "publish:create")) return <main style={{ padding: 32 }}><h1>Sin permisos</h1><p>No tienes permisos para enviar paquetes a revisión.</p></main>;
  const slug = (await params).slug;
  const version = (await searchParams).version;
  if (!version) notFound();
  try { return <PackageReviewClient packageInfo={await getPackage(slug, client)} manifest={await getDraftManifest(slug, version, client)} version={version} />; } catch { notFound(); }
}
