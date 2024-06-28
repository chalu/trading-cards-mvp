import { Modal } from 'bootstrap';
import { formatDistanceToNow } from 'date-fns';

import performSearch, { capitalize, getPagerIndex, noop, wait } from 'client-core';
import type { Card, CardsQueryResponse, APIResponseError } from '../../../shared/api/sdk/types.js';

type CardInfo = 'id' | 'name' | 'set_name' | 'rarity';
type CardDisplay = Pick<Card, CardInfo> & {
    img: string;
    prices: string[];
    games: string[] | undefined;
    collector_number: string | undefined;
};
type SearchActionHandler = () => void;
type SearchActionHandlerTuple = [SearchActionHandler, SearchActionHandler];
type Fav = {
    name: string;
    when: number;
};
type FavStore = {
    [key: string]: Fav | undefined;
}

const maxPerPage = 175;
const cards: CardDisplay[] = [];
let [preSearch, postSearch] = [noop, noop];

const domParser = new DOMParser();

const handlePreAndPostSearchAction = (form: HTMLFormElement): SearchActionHandlerTuple => {
    const txtField = form['term'];
    const btn = form['search-btn'];
    const searchIco = btn.querySelector('.bi-search');
    const spinnerIco = btn.querySelector('.spinner-grow');

    const pre = () => {
        if (btn) btn.setAttribute('disabled', 'disabled');

        if (txtField) txtField.setAttribute('disabled', 'disabled');
        
        if (searchIco) searchIco.classList.add('visually-hidden');
        
        if (spinnerIco) spinnerIco.classList.remove('visually-hidden');
    };

    const post = () => {
        if (btn) btn.removeAttribute('disabled');

        if (txtField) txtField.removeAttribute('disabled');
        
        if (spinnerIco) spinnerIco.classList.add('visually-hidden');
        
        if (searchIco) searchIco.classList.remove('visually-hidden');
    };

    return [pre, post];
}

const navigate = (event: Event) => {
    event.preventDefault();
    const link = event.target as HTMLAnchorElement;
    const href = link.getAttribute('href');
    if (href && href !== '#') {
        const searchTerm = href.substring(href.indexOf('?') + 1)
        .split('&')
        .find((param) => param.startsWith('term='))
        ?.split('=')[1];

        if (searchTerm) {
            preSearch();
            performSearch(searchTerm, displayResults, href);
        } else {
            console.error('Search term not found in pagination links');
        }
    }
};

const displayFavs = (event: Event) => {
    event.preventDefault();

    const favs: FavStore = JSON.parse(localStorage.getItem('favs') || '{}');
    const favIds = Object.keys(favs);
    if (favIds.length === 0) return;

    const favslistDiv = document.querySelector('#favslist') as HTMLDivElement;
    const uiFragment = document.createDocumentFragment();

    for (const id of favIds) {
        const fav = favs[id];
        if (fav) {
            const favItemDoc = domParser.parseFromString(favToUIElement(id, fav), 'text/html');
            uiFragment.appendChild(favItemDoc.body.firstChild as ChildNode);
        }
    }

    favslistDiv.innerHTML = '';
    favslistDiv.appendChild(uiFragment);

    const favsWindow = new Modal('#favswindow');
    favsWindow.show();
}

const attemptSubmit = (event: Event) => {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const field = form['term'];
    // TODO can we use the min/max length defined in the API spec?
    if (!field.validity.valid || field.value.trim().length < 3) return;

    preSearch();
    try {
        performSearch(field.value, displayResults);
    } catch (error) {
        console.warn(error);
    }
};

const handleFavsToggle = (event: Event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const iconLink = target.closest('[data-game-card]') as HTMLElement;
    if (!iconLink) return;

    const cardId = iconLink.dataset['gameCard'];
    if (!cardId) return;

    addToFavs(cardId, iconLink);
};

const addToFavs = (cardId: string, iconLink: HTMLElement) => {
    const favs: FavStore = JSON.parse(localStorage.getItem('favs') || '{}');
    if (cardId in favs) {
        removeFromFavs(cardId, iconLink);
        return;
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    favs[cardId] = {
        name: card.name,
        when: Date.now()
    };
    localStorage.setItem('favs', JSON.stringify(favs));

    if (!iconLink) return;

    requestAnimationFrame(() => {
        iconLink.querySelector('.star-outlined')?.classList.add('visually-hidden');
        iconLink.querySelector('.star-filled')?.classList.remove('visually-hidden');
    });
};

const removeFromFavs = (cardId: string, iconLink: HTMLElement | undefined) => {
    const favs: FavStore = JSON.parse(localStorage.getItem('favs') || '{}');
    if (Object.keys(favs).length === 0) return;

    favs[cardId] = undefined;
    localStorage.setItem('favs', JSON.stringify(favs));

    if (!iconLink) return;

    requestAnimationFrame(() => {
        iconLink.querySelector('.star-filled')?.classList.add('visually-hidden');
        iconLink.querySelector('.star-outlined')?.classList.remove('visually-hidden');
    });
};

const markFavs = () => {
    const favs: FavStore = JSON.parse(localStorage.getItem('favs') || '{}');
    const favsKeys = Object.keys(favs);
    if (favsKeys.length === 0) return;

    favsKeys.map(
        (key) => document.querySelector(`[data-game-card='${key}']`)
    ).forEach((starEl) => {
        if (starEl) {
            requestAnimationFrame(() => {
                starEl.querySelector('.star-outlined')?.classList.add('visually-hidden');
                starEl.querySelector('.star-filled')?.classList.remove('visually-hidden');
            });
            
        }
    });
}

const startApp = () => {
    const form = document.querySelector('#form') as HTMLFormElement;
    form.addEventListener("submit", attemptSubmit);
    const searchField = form.querySelector("input[type=text]") as HTMLInputElement;
    searchField.focus();

    const favsBtn = document.querySelector('#favscta') as HTMLAnchorElement;
    favsBtn.addEventListener('click', displayFavs);

    const favsList = document.querySelector('#favslist') as HTMLDivElement;
    favsList.addEventListener('click', (event) => {
        event.preventDefault();

        const target = event.target as HTMLElement;
        const favedItemEl = target.closest('[data-faved-item]') as HTMLDivElement;
        if (!favedItemEl) return;

        const cardId = favedItemEl.dataset['favedItem'];
        if (!cardId) return;

        favedItemEl.remove();

        const iconLink = document.querySelector(`[data-game-card='${cardId}']`) as HTMLElement;
        removeFromFavs(cardId, iconLink);
    });

    const pagerEl = document.querySelector('#pager') as HTMLElement;
    pagerEl.classList.remove('visually-hidden');
    pagerEl.querySelectorAll('a[href]').forEach((link) => link.addEventListener('click', navigate));
    pagerEl.classList.add('visually-hidden');

    [preSearch, postSearch] = handlePreAndPostSearchAction(form);

    const resultsDiv = document.querySelector('#results') as HTMLDivElement;
    resultsDiv.addEventListener("click", handleFavsToggle);

    // ====================================
    // Only here as a quick and dirty test
    // ====================================
    // for (const count of [1, 2, 3, 4, 5, 6, 7, 8, 9, 20]) {
    //     performSearch('red', () => {});
    // }
};

const resultsToCards = (raw: Card[]): CardDisplay[] => {
    const justIn: CardDisplay[] = [];
    for (const crd of raw) {
        let priceFigures: string[] = [];

        if (crd.prices) {
            priceFigures = Object.keys(crd.prices)
                .map((currency, index) => {
                    const currencyFormat = new Intl.NumberFormat('en-US', {
                        currency,
                        style: 'currency'
                    });
                    const rawPrice = parseFloat(Object.values(crd.prices)[index] || '0.0');
                    return currencyFormat.format(rawPrice);
                });
        }

        const card = {
            id: crd.id,
            name: crd.name,
            games: crd.games,
            rarity: capitalize(crd.rarity),
            prices: priceFigures,
            set_name: crd.set_name,
            collector_number: `${crd.collector_number}` || 'N/A', 
            img: crd.image_uris.normal || crd.image_uris.large || 'https://placehold.co/240x335/333/ccc.webp?text=No+Image'
        };
        justIn.push(card);
    }

    cards.push(...justIn);
    return justIn;
}

const favToUIElement = (
    id: string, {name, when }: Fav
) => `
    <div class="d-flex w-100 align-items-center justify-content-between my-2" data-faved-item="${id}">
        <strong class="mb-1">
            <a class="icon-link icon-link-hover" href="/remove-fav/${id}">
                <svg class="bi" width="24" height="24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                ${name}
            </a>
        </strong>
        <small class="text-muted">
            ${formatDistanceToNow(when, { addSuffix: true })}
        </small>
    </div>
`;

const cardToUIElement = (
    { id, name, img, games, prices, set_name, rarity, collector_number }: CardDisplay
) => `
    <div data-card-id="${id}" class="col">
        <div class="card h-100">
            <img src="${img}" loading="lazy" alt="${name}" class="card-img-top">
            <div class="card-body">
                <h5 class="card-title text-wrap text-capitalize">
                    <a class="icon-link icon-link-hover" href="/favs/${id}" data-game-card="${id}">
                        <svg class="ico-star star-outlined" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
                        <svg class="ico-star star-filled visually-hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
                    </a>
                    <span>${name}<span>
                </h5>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item text-wrap text-capitalize">Set: ${set_name}</li>
                    <li class="list-group-item">
                        Rarity: ${
                            rarity === 'Rare' 
                            ? "<span class='badge rounded-pill text-bg-danger'>Rare</span>"
                            : rarity === 'Uncommon'
                                ? "<span class='badge rounded-pill text-bg-warning'>Uncommon</span>"
                                : "<span class='badge rounded-pill text-bg-light'>Common</span>"
                        }
                    </li>
                    <li class="list-group-item">Number: ${collector_number || 'N/A'}</li>
                    <li class="list-group-item text-wrap">Games: ${(games && games.map((game) => capitalize(game)).join(' | ')) || 'N/A'}</li>
                    <li class="list-group-item">Prices: ${(prices && prices.join(' | ')) || 'N/A'}</li>
                    
                </ul>
            </div>
        </div>
    </div>
`;

const updatePager = (
    next: string | undefined, previous: string | undefined, total: number
) => {
    const pagerEl = document.querySelector('#pager') as HTMLElement;
    const pagerEls = Array.from(pagerEl.querySelectorAll('li')) as HTMLLIElement[];
    const [prevNav, currentNav, nextNav] = pagerEls;

    requestAnimationFrame(() => {
        if (!total || (!next && !previous)) {
            pagerEl.classList.add('visually-hidden');
        } else {
            pagerEl.classList.remove('visually-hidden');
        }
    
        if (nextNav && next) {
            nextNav.classList.remove('disabled');
            nextNav.querySelector('a')?.setAttribute('href', next);
        } else if (nextNav && !next) {
            nextNav.classList.add('disabled');
            nextNav.querySelector('a')?.setAttribute('href', '#');
        }
    
        if (prevNav && previous) {
            prevNav.classList.remove('disabled');
            prevNav.querySelector('a')?.setAttribute('href', previous);
        } else if (prevNav && !previous) {
            prevNav.classList.add('disabled');
            prevNav.querySelector('a')?.setAttribute('href', '#');
        }
    
        if (!currentNav) return;
        const { currentPage, totalPages } = getPagerIndex(total, maxPerPage, {next, previous});
        (currentNav.querySelector('a') as HTMLAnchorElement).textContent = `${currentPage} / ${totalPages}`;
    });
};

const displayResults = async (results: CardsQueryResponse | APIResponseError) => {
    postSearch();
    if ('errors' in results) {
        console.error('API response error', results);
        return;
    }

    const { total, next, previous, data } = results as CardsQueryResponse;
    const resultsDiv = document.querySelector('#results') as HTMLDivElement;
    const uiFragment = document.createDocumentFragment();

    const justIn = resultsToCards(data);
    for (const crd of justIn) {
        const cardUIStr = cardToUIElement({
            id: crd.id, 
            img: crd.img,
            name: crd.name,
            games: crd.games,
            prices: crd.prices,
            set_name: crd.set_name,
            rarity: capitalize(crd.rarity),
            collector_number: `${crd.collector_number}` || 'N/A'
        });

        const cardItemDoc = domParser.parseFromString(cardUIStr, 'text/html');
        uiFragment.appendChild(cardItemDoc.body.firstChild as ChildNode);
    }

    data.slice(0, 5).forEach((crd) => {
        const imgEl = document.createElement('img');
        imgEl.src = crd.image_uris.normal || crd.image_uris.large || 'https://placehold.co/240x335/333/ccc.webp?text=No+Image';
    });

    requestAnimationFrame(() => {
        resultsDiv.innerHTML = ''
        resultsDiv.appendChild(uiFragment);
    });
    updatePager(next, previous, total);

    await wait({until: 1000});
    markFavs();
};

document.addEventListener("DOMContentLoaded", startApp);

// Empty state content with only CSS
// Effective type-safe Express handlers 
// Lazy loading images with loading="lazy" attribute
// Use the browser's network pref/setting to load different image resolutions
// 

// https://github.com/gunn/pure-store/
// https://mobx-state-tree.js.org/intro/welcome
// https://github.com/tinyplex/tinybase
// https://github.com/LegendApp/legend-state

// https://www.youtube.com/watch?v=ncaiRMdgy4Q