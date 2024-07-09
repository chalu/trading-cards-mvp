import process from "node:process";
import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// This import caused "drizzle-kit studio" to halt bcos of .js extension
// export { geMorganMiddleware } from './morgan.js';

// Note: if getting trypescript error TS4111", 
// try adding "noPropertyAccessFromIndexSignature": false to 
// the compilerOptions in the tsconfig.json file

export const Config = createEnv({
	server: {
		env: z.string(),
		port: z.string(),
		appName: z.string(),
		authSecret: z.string(),
		cardsRepoAPI: z.string(),
		scryfallApiBase: z.string(),
		databaseUrl: z.string().url(),
		rateLimitHourWindow: z.coerce.number(),
		cardsRepoMaxRetries: z.coerce.number(),
		rateLimitRequestsPerWindow: z.coerce.number(),
	},
	runtimeEnvStrict: {
		port: process.env.PORT ?? 8889,
		authSecret: process.env.JWT_SECRET,
		databaseUrl: process.env.DATABASE_URL,
		cardsRepoAPI: process.env.CardsRepoAPI,
		env: process.env.NODE_ENV ?? "development",
		scryfallApiBase: process.env.ScryfallAPIBase,
		rateLimitHourWindow: process.env.RATE_LIMIT_HOURS ?? "1",
		cardsRepoMaxRetries: process.env.MaxCardsRepoAPIRetries || "3",
		rateLimitRequestsPerWindow: process.env.RATE_LIMIT_MAX_REQUESTS ?? "5000",
		appName: (process.env.APP_NAME || "App")
			.toLowerCase()
			.replaceAll(/\s+/g, "-"),
	},
});
