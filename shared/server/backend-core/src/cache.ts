import { Redis } from 'ioredis';
import { Config } from './config/index.js';

export const redis = new Redis(Config.cacheURL);
