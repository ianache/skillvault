import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";

const url = process.env.DATABASE_URL
  ? `file:${process.env.DATABASE_URL}`
  : `file:${path.join(process.cwd(), "skills-vault.db")}`;

const client = createClient({ url });

export const db = drizzle(client, { schema });
export { client };
