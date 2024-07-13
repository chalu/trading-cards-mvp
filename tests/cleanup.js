import { stopTestContainers } from './test-containers';

export async function cleanup() {
    await stopTestContainers();
    console.log('Test containers stopped');
}

// Listen for the `end` event on the Mocha runner
// process.on('exit', () => {
//     cleanup().catch(err => {
//         console.error('Failed to clean up test environment', err);
//     });
// });
