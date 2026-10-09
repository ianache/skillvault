import Link from "next/link";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getPackage } from "@/lib/packages/service";

export default async function PackageAdminDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return <main><h1>No autorizado</h1></main>;
  const item = await getPackage((await params).slug, client);
  return <main style={{ padding: 32 }}>
    <Link href="/packages">← Mantenimiento</Link>
    <h1>{item.name}</h1>
    <p>{item.description}</p>
    <p>Rol: {item.role} · Estado: {item.status} · Versión actual: {item.currentVersion ?? "—"}</p>
    <p>La composición y envío a revisión se gestionan mediante las APIs protegidas del paquete.</p>
  </main>;
}
