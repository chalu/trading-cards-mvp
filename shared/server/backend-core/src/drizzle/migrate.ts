import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { Config } from "../config/index.js";

const client = postgres(Config.databaseUrl, { max: 1 });

const main = async () => {
	await migrate(drizzle(client), {
		migrationsFolder: "./src/drizzle/migrations",
	});

	await client.end();
};

main();
