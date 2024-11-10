import { createFederation } from "@fedify/fedify";
import { DenoKvMessageQueue, DenoKvStore } from "@fedify/fedify/x/denokv";
import { PostgresMessageQueue } from "@fedify/postgres";
import { kv } from "../kv.ts";
import { postgres } from "../db.ts";

export const federation = createFederation({
  kv: new DenoKvStore(kv),
  queue: Deno.env.get("DENO_DEPLOYMENT_ID")
    ? new DenoKvMessageQueue(kv)
    : new PostgresMessageQueue(postgres),
});
