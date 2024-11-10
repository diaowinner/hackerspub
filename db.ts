import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  drizzle,
  type PostgresJsQueryResultHKT,
} from "drizzle-orm/postgres-js";
import postgresJs from "postgres";
import * as schema from "./models/schema.ts";

export type Database = PgDatabase<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (DATABASE_URL == null) {
  throw new Error("Missing DATABASE_URL environment variable.");
}

export const postgres = postgresJs(DATABASE_URL);
export const db = drizzle({
  schema,
  client: postgres,
});
