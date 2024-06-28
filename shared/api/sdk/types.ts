import {components, operations, paths} from './generated';

export type APIWelcome = components["schemas"]["APIWelcome"];
export type APIError = components["schemas"]["APIError"];
export type APIResponseError = components["schemas"]["APIResponseError"];
export type PageParam = components["schemas"]["PageParam"];
export type SearchTermParam = components["schemas"]["SearchTermParam"];
export type OrderByParam = components["schemas"]["OrderByParam"];
export type SortDirParam = components["schemas"]["SortDirParam"];
export type AuthAttempt = components["schemas"]["AuthAttempt"];
export type AuthToken = components["schemas"]["AuthToken"];
export type CardPrices = components["schemas"]["CardPrices"];
export type CardImageURIs = components["schemas"]["CardImageURIs"];
export type Card = components["schemas"]["Card"];
export type Pagination = components["schemas"]["Pagination"];
export type QueryResult = components["schemas"]["QueryResult"];
export type CardsQueryResponse = components["schemas"]["CardsQueryResponse"];

export type SearchCardsQureyParams = operations["searchCards"]["parameters"]["query"];

export type Endpoints = {
    [K in keyof paths]: K
}