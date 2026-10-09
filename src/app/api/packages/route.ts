import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { createPackage, listPackages } from "@/lib/packages/service";
import type { CreatePackageInput, PackageDatabaseClient } from "@/lib/packages/types";
import { actorFromSession, capabilityError, errorResponse } from "../review-requests/route-utils";

export function createPackageHandlers(dependencies: { getSession?: typeof auth; database?: PackageDatabaseClient } = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;
  return {
    async GET() {
      const session = await getSession();
      const actor = session ? actorFromSession(session) : null;
      if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const forbidden = capabilityError(actor, "content:manage");
      if (forbidden) return forbidden;
      try { return NextResponse.json({ packages: await listPackages(database) }); } catch (error) { return errorResponse(error); }
    },
    async POST(request: NextRequest) {
      const session = await getSession();
      const actor = session ? actorFromSession(session) : null;
      if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const forbidden = capabilityError(actor, "publish:create");
      if (forbidden) return forbidden;
      try {
        const input = await request.json() as CreatePackageInput;
        return NextResponse.json({ package: await createPackage(input, actor, database) }, { status: 201 });
      } catch (error) { return errorResponse(error); }
    },
  };
}

export const { GET, POST } = createPackageHandlers();
