import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Config } from "../config/index.js";
import * as schema from "./schema.js";

const client = postgres(Config.databaseUrl);

export const db = drizzle(client, { schema, logger: true });
export * as schema from "./schema.js";
