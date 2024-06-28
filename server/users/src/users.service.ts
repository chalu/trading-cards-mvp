import { logAs, hashPswd, comparePswd } from 'backend-core';
import * as errors from './users.errors.js';

import type * as oas from '../../../shared/api/sdk/types.js';

const log = logAs('users');

export const example = async (
    attempt: oas.AuthAttempt
): Promise<oas.AuthToken> => {
    log.info(`${attempt.nickname}, ${attempt.password}`);
    return { token: 'dvfsfsvsvsdvsds' };
}