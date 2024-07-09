import { defineConfig } from 'drizzle-kit';
import { Config } from './src/config/index';

export default defineConfig({
    schema: './src/drizzle/schema.ts',
    out: './src/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: Config.databaseUrl
    },
    strict: true,
    verbose: true
});