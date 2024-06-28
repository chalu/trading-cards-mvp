import process from 'node:process';
import 'dotenv/config';

export { geMorganMiddleware } from './morgan.js';

export const Config =  {
    env: process.env['NODE_ENV'] ?? 'development',
    port: process.env['PORT'] ?? 8889,
    rateLimit: {
        hours: process.env['RATE_LIMIT_HOURS'] ?? '1',
        maxRequestsPerHour: process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '5000'
    },
    databaseUrl: process.env['DATABASE_URL'] as string,
    appName: (process.env['APP_NAME'] || 'App').toLowerCase().replaceAll(/\s+/g, '-'),
    cardsRepo: {
        api: process.env['CardsRepoAPI'],
        scryfallApiBase: process.env['ScryfallAPIBase'],
        maxRetries: process.env['MaxCardsRepoAPIRetries'] || '3'
    }
};