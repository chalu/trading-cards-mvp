// @ts-nocheck
import { GenericContainer } from 'testcontainers';

let dbContainer = undefined;
let cacheContainer = undefined;

export async function startTestContainers() {
    dbContainer = await new GenericContainer('postgres')
        .withEnvironment({
            'POSTGRES_USER': 'test',
            'POSTGRES_PASSWORD': 'test',
            'POSTGRES_DB': 'test'
        })
        .withExposedPorts(5432)
        .start();
    
    const dbURL = `postgresql://test:test@localhost:${dbContainer.getMappedPort(5432)}/test`;
    console.log('DB test container started');

    cacheContainer = await new GenericContainer('redis')
        .withExposedPorts(6379)
        .start();

    const cacheURL = `redis://localhost:${cacheContainer.getMappedPort(6379)}`;
    console.log('Cache test container started');

    return { dbURL, cacheURL };
}

export async function stopTestContainers() {
    if (dbContainer) {
        await dbContainer.stop();
    }
}


