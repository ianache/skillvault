import { client } from "@/lib/db";
import { listPackages } from "@/lib/packages/service";
import { PublicPackageCatalogClient } from "@/components/packages/PublicPackageCatalogClient";

export const dynamic = "force-dynamic";

export default async function PublicPackagesPage() {
  return <PublicPackageCatalogClient initialPackages={await listPackages(client, true)} />;
}
