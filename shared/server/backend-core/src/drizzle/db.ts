import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Config } from "../config/index.js";
import * as schema from "./schema.js";

let client: postgres.Sql | undefined = undefined;

export const db = () => {
    if (!client) {
        client = postgres(Config.databaseUrl);
        return drizzle(client, { schema, logger: true });
    }
    return drizzle(client, { schema, logger: false });
};
export * as schema from "./schema.js";
