import type * as oas from '../../../shared/api/sdk/types.js';
import { searchTradingGameCardsController } from './searchcards.controller.js';
import type { BackendService } from 'backend-core';
import type { Router } from 'express-serve-static-core';

export * as errors from './searchcards.errors.js';
export { searchForGameCards } from './searchcards.service.js';

const useRouter = (router: Router): void => {
    const endpoint: oas.Endpoints['/search'] = '/search';
    router.get(endpoint, searchTradingGameCardsController);
}

export const service: BackendService = {useRouter};