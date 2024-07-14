import { GenericContainer } from 'testcontainers';
import type { StartedTestContainer } from 'testcontainers';

let containers: StartedTestContainer[] = [];

export async function startTestContainers(applicationName: string) {
    const appName = (applicationName || 'my-test-app').toLowerCase().replaceAll(/\s+/g, '-');

    const dbContainer = await new GenericContainer('postgres')
        .withName(`${appName}-db`)
        .withEnvironment({
            'POSTGRES_USER': 'test',
            'POSTGRES_PASSWORD': 'test',  
            'POSTGRES_DB': 'test'
        })
        .withExposedPorts(5432);

    const cacheContainer = await new GenericContainer('redis')
        .withName(`${appName}-cache`)
        .withExposedPorts(6379);

    containers = await Promise.all(
        [dbContainer, cacheContainer].map(container => container.start())
    );

    let dbURL = 'postgresql://test:test@localhost:PORT/test';
    const startedDbContainer = containers.find(container => container?.getName().endsWith('db'));
    if (startedDbContainer) {
        const [host, mappedPort] = [startedDbContainer.getHost(), startedDbContainer.getMappedPort(5432)];
        dbURL = `postgresql://test:test@${host}:${mappedPort}/test`;
        console.log('DB test container started');
    }
    
    let cacheURL = 'redis://localhost:PORT';
    const startedCacheContainer = containers.find(container => container?.getName().endsWith('cache'));
    if (startedCacheContainer) {
        const [host, mappedPort] = [startedCacheContainer.getHost(), startedCacheContainer.getMappedPort(6379)];
        cacheURL = `redis://${host}:${mappedPort}`;
        console.log('Cache test container started');
    }

    return { dbURL, cacheURL };
}

export async function stopTestContainers() {
    await Promise.all(containers.map(container => container.stop()));
}


