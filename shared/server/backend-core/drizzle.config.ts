import { defineConfig } from 'drizzle-kit';
import { Config } from './src/config/index';

console.log(
    'Drizzle DB Is',
    Config.databaseUrl.substring(Config.databaseUrl.indexOf('@') + 1)
);

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