import fs from 'node:fs';
import path from 'node:path';
import Dotenv from 'dotenv';
import { startTestContainers } from './test-containers';

export async function init() {
    try {
        console.log('Initializing test containers ...');
        const { dbURL } = await startTestContainers();

        // @ts-ignore
        process.env.NODE_ENV = "test";
        // @ts-ignore
        process.env.DATABASE_URL = dbURL;

        const envVariables = Object.keys(process.env)
        .map(key => `${key}=${process.env[key]}`).join('\n');

        // Write and load .env.test file
        const pathToEnvFile = path.resolve(__dirname, '../', '.env.test');
        fs.writeFileSync(pathToEnvFile, envVariables, { encoding: 'utf-8', flag: 'w' });
        Dotenv.config({ path: pathToEnvFile });
        console.log('Test containers initialized\n\n');
    } catch (err) {
        console.error('Failed to initialize test environment', err);
        process.exit(1);
    }
}

// module.exports = init;