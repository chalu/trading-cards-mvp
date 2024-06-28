import { logAs } from 'backend-core';
import * as service from './users.service.js';
import type * as oas from '../../../shared/api/sdk/types.js';
import { type Controller } from 'backend-core';

const log = logAs('users');

export const usersAuthController: Controller<{
    reqBody: oas.AuthAttempt,
    resBody: oas.AuthToken | oas.APIResponseError
}> = async (request, response): Promise<void> => {
    const loginAttempt = request.body;
    log.info('attempt to login ...');
    try {
        const authToken = await service.example(loginAttempt);

        response.json(authToken);
    } catch (err) {
        const error = err as Error;
        log.error(error);
        response.status(500).json({message: error.message});
    }
};