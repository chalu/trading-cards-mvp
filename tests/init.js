// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import Dotenv from 'dotenv';
import { startTestContainers } from './test-containers';

export async function init() {
    try {
        const pathToEnvFile = path.resolve(__dirname, '../', '.env.test');
        Dotenv.config({ path: pathToEnvFile });

        console.log('Initializing test containers ...');
        const { dbURL, cacheURL } = await startTestContainers(process.env.APP_NAME);

        process.env.NODE_ENV = "test";
        process.env.DATABASE_URL = dbURL;
        process.env.CACHE_URL = cacheURL;

        const envVariables = Object.keys(process.env)
        .map(key => `${key}=${process.env[key]}`).join('\n');

        // Write and reload .env.test file
        fs.writeFileSync(pathToEnvFile, envVariables, { encoding: 'utf-8', flag: 'w' });
        Dotenv.config({ path: pathToEnvFile });
        console.log('Test containers are now ready!\n\n');
    } catch (err) {
        console.error('Failed to initialize test environment', err);
        process.exit(1);
    }
}
