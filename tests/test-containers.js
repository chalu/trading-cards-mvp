// @ts-nocheck
import { GenericContainer } from 'testcontainers';

let dbContainer = undefined;

export async function startTestContainers() {
    dbContainer = await new GenericContainer('postgres')
        .withEnvironment({
            'POSTGRES_USER': 'test',
            'POSTGRES_PASSWORD': 'test',
            'POSTGRES_DB': 'test'
        })
        .withExposedPorts(5432)
        .start();
    
    console.log('DB test container started');
    const dbURL = `postgresql://test:test@localhost:${dbContainer.getMappedPort(5432)}/test`;

    return { dbURL };
}

export async function stopTestContainers() {
    if (dbContainer) {
        await dbContainer.stop();
    }
}

// module.exports = {
//     startTestContainers,
//     stopTestContainers
// };
