import {type Router} from 'express';
import {type BackendService} from 'backend-core';
import type * as oas from '../../../shared/api/sdk/types.js';
import { usersAuthController } from './users.controller.js';

// export * as errors from './searchcards.errors.js';
// export { example } from './users.service.js'

const useRouter = (router: Router): void => {
    const endpoint: oas.Endpoints['/users/auth'] = '/users/auth';
    router.post(endpoint, usersAuthController);
}

export const service: BackendService = { useRouter };