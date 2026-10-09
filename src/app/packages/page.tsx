import { auth } from "@/auth";
import { client } from "@/lib/db";
import { listPackages } from "@/lib/packages/service";
import { PackageCatalogClient } from "@/components/packages/PackageCatalogClient";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { actorFromSession, capabilityError } from "../api/review-requests/route-utils";

export const dynamic = "force-dynamic";

export default async function PackagesAdminPage() {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor || capabilityError(actor, "content:manage")) return <main style={{ padding: 32 }}><h1>Paquetes</h1><p>No tienes permisos para mantener paquetes.</p></main>;
  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><PageHeader title="Paquetes de Skills" description="Mantén paquetes por rol: crea, edita, duplica, publica y retira versiones." actions={<Link href="/packages/new" style={primaryButton}>+ Nuevo paquete</Link>} /><main style={{ padding: "32px 24px", maxWidth: 1280, margin: "0 auto" }}><PackageCatalogClient initialPackages={await listPackages(client)} /></main></div>;
}

const primaryButton = { fontFamily: "var(--font-geist), sans-serif", fontSize: "13px", fontWeight: 600, padding: "9px 20px", borderRadius: "8px", background: "var(--accent)", color: "#fff", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" } as const;
