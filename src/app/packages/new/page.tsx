import { auth } from "@/auth";
import { PackageEditorClient } from "@/components/packages/PackageEditorClient";
import { actorFromSession, capabilityError } from "../../api/review-requests/route-utils";

export const dynamic = "force-dynamic";

const emptyPackage = { id: 0, slug: "", name: "", description: "", role: "QA", status: "draft", currentVersion: null };

export default async function NewPackagePage() {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor || capabilityError(actor, "content:manage")) return <main style={{ padding: 32 }}><h1>Sin permisos</h1><p>No tienes permisos para crear paquetes.</p></main>;
  return <PackageEditorClient packageInfo={emptyPackage} isNew />;
}
