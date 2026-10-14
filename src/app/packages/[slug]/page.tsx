import Link from "next/link";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getPackage } from "@/lib/packages/service";
import { actorFromSession, capabilityError } from "../../api/review-requests/route-utils";

export default async function PackageAdminDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor || capabilityError(actor, "content:manage")) return <main><h1>Sin permisos</h1><p role="alert">No tienes permisos para consultar el mantenimiento del paquete.</p></main>;
  const item = await getPackage((await params).slug, client);
  return <main style={{ padding: 32 }}><Link href="/packages">← Mantenimiento</Link><h1>{item.name}</h1><p>{item.description}</p><p>Rol: {item.role} · Estado: {item.status} · Versión actual: {item.currentVersion ?? "—"}</p><p>La composición y envío a revisión se gestionan mediante las APIs protegidas del paquete.</p></main>;
}
