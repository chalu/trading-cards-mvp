import { produce } from "immer";
import type { AppState, AppUser, CardDisplay } from "./types.js";

let state: AppState = {
    cards: [],
    currentUser: {
        isAuthenticated: false,
        id: localStorage.getItem('userId') || undefined,
        authToken: localStorage.getItem('jwToken') || undefined
    }
};

export const getCards = () => state.cards;
export const getCurrentUser = () => state.currentUser;

export const addCards = (...recents: CardDisplay[]) => {
    state = produce(state, (draft) => {
        draft.cards.push(...recents);
    });
    return state.cards;
};

export const updateCurrentUser = (user: Partial<AppUser>) => {
    state = produce(state, (draft) => {
        draft.currentUser = Object.assign(draft.currentUser, user);
    });
    return state.currentUser;
};