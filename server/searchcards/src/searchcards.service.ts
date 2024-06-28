import { logAs, Config } from 'backend-core';
import { backOff } from "exponential-backoff";
import { cardsRepo } from './external-cards-apis.js';
import * as errors from './searchcards.errors.js';

import type { CardsRepoSearchResult } from './searchcards.types.js';
import type * as oas from '../../../shared/api/sdk/types.js';

const log = logAs('search-cards');
const MaxScryfallAPIRetries = parseInt(Config.cardsRepo.maxRetries, 10);

const parseCard = (raw: oas.Card): oas.Card => {
    const {
        id, name, lang, uri, released_at, games, foil, nonfoil,
        prices, image_uris, set_name, rarity, collector_number
    } = raw;

    const parsedImgs: oas.CardImageURIs = {};
    if (image_uris?.small) parsedImgs.small = image_uris.small;
    if (image_uris?.normal) parsedImgs.normal = image_uris.normal;
    if (image_uris?.large) parsedImgs.large = image_uris.large;

    const parsedPrices: oas.CardPrices = {};
    if (prices?.usd) parsedPrices.usd = prices.usd;
    if (prices?.eur) parsedPrices.eur = prices.eur;

    const parsed: oas.Card = {
        id, name, lang,
        released_at,
        rarity, set_name,
        prices: parsedPrices,
        image_uris: parsedImgs,
        foil: foil === true,
        nonfoil: nonfoil === true,
        uri: (uri || '').substring(uri.lastIndexOf('/'))
    };

    if (games?.length) parsed.games = games;
    if (collector_number) parsed.collector_number = parseInt(`${collector_number}`, 10);

    return parsed;
};

const repoErrMsg = 'Unable to reach repository for game cards';

export const searchForGameCards = async (
    queryParameters: oas.SearchCardsQureyParams
): Promise<CardsRepoSearchResult> => {
    let searchResult: CardsRepoSearchResult = {
        has_more: false,
        total_cards: 0,
        data: []
    };

    let cardsRepoAPIAttempts = 0;

    try {
        const backOffAndRetryOpts = {
            numOfAttempts: MaxScryfallAPIRetries,
            retry: (_e: any, attemptNumber: number) => {
                cardsRepoAPIAttempts = attemptNumber;
                let msg = `Calling Scryfall failed [${attemptNumber}]. Will`;
                msg += attemptNumber >= MaxScryfallAPIRetries ? ' no longer retry' : ' retry';
                log.warn(msg);
                return true;
            }
        };

        const result = await backOff(
            () => cardsRepo.performSearch(queryParameters), 
            backOffAndRetryOpts
        );
        if (cardsRepoAPIAttempts > MaxScryfallAPIRetries) {
            log.warn(repoErrMsg);
            throw new errors.CardsRepoUnreachableException(repoErrMsg);
        }

        log.info(`retrieved cards for term: ${queryParameters.term}`);
        if (result) {
            searchResult = result.data;
            if (searchResult.data && Array.isArray(searchResult.data)) {
                searchResult.data = searchResult.data.map((card) => parseCard(card));
            }
        }
    } catch (err) {
        const error = err as Error;
        const msg = error.message || 'Unable to handle your request. Pls try again';
        log.error(error);
        throw new errors.CardSearchException(msg, {cause: error})
    }

    return searchResult;
}
