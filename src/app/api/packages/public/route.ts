import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import { listPackages } from "@/lib/packages/service";

export async function GET() {
  try { return NextResponse.json({ packages: await listPackages(client, true) }); }
  catch { return NextResponse.json({ error: "Unable to load public packages" }, { status: 500 }); }
}
