import { BackendApplicationError } from "backend-core";

export class UserServiceError extends BackendApplicationError {}

export const INVALID_LOGIN_MSG = "Cannot proceed with missing, invalid, incomplete details";
export const CANNOT_CREATE_USER_MSG = "Cannot create user with invalid or incomplete details";
export const CANNOT_RETRIEVE_USER_MSG = "Cannot retrieve user with invalid ID";
export const CANNOT_COMPLETE_FAVORITE_ACTION_MSG = "Cannot complete the favorite action with provided details";
export const CANNOT_CREATE_PSWD_MSG = "Cannot create user with non-compliant password";
export const CANNOT_CREATE_NICKNAME_MSG = "Cannot create user with already taken nickname";

