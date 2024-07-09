import type {
	APIResponseError,
	CardsQueryResponse,
} from "../../../../shared/api/sdk/types.js";
import { settle, wait } from "./utils.js";

type APIResponse = APIResponseError | CardsQueryResponse;
type APIInvokerFunction = () => Promise<APIResponse>;
type ResultsReceiverFunction = (results: APIResponse) => void;

const CallStatusReady = "READY";
const CallStatusInFlight = "INFLIGHT";

let delayChain: Promise<unknown> | undefined;
let APICallStatus = CallStatusReady;

// TODO: make this configurable for dev & prod
const apiBase = "http://localhost:8889";

const searchForTerm =
	(term: string, pagedTo = ""): APIInvokerFunction =>
	async (): Promise<APIResponse> => {
		let endpoint = `/search?term=${term}`;
		if (pagedTo !== "") {
			const url = new URL(pagedTo, `${apiBase}`);
			endpoint = `/search${url.search}`;
		}

		// Bubble any error over
		const resp = await fetch(`${apiBase}${endpoint}`);
		return resp.json();
	};

const issueSearch = async (
	apiCall: APIInvokerFunction,
): Promise<APIResponse> => {
	APICallStatus = CallStatusInFlight;
	console.log("Calling backend API ...");
	const data = await apiCall();
	console.log("Done!");
	APICallStatus = CallStatusReady;
	return data;
};

// Aready issued a call? wait for it while 'staging' new calls.
// Though we can delay issuing the API calls, we don't want
// 10 "delayed" calls all going out within a very short time window because
// the delays all elapsed in quick succession.
//
// Thus, calling readyToSearchAndDisplayResults('bird') within a loop
// of 10 iterations will:
// 1. allow the first call go through to the backend immediately
// 2. delay till 1 seconds after the last of the remaining 9 calls was issued
// 3. make only one backend call (not 9) for the remaining calls, which is likely
//    what the user wants to see results for
//
// Not rigorously tested, but works fine.
// Uncomment the loop at the
// bottom of the startApp function in client/vanilla/src/index.js,
// run `pnpm --filter vanilla-client start`, (re)load the app
// in the browser and view the console logs
const readyToIssueSearch = async (
	term: string,
	setResults: ResultsReceiverFunction,
	pagedTo = "",
) => {
	const apiCallr = searchForTerm(term, pagedTo);

	if (APICallStatus === CallStatusInFlight) {
		delayChain ||= Promise.resolve();

		delayChain = settle(wait()).after(delayChain);
		return;
	}

	const result = await issueSearch(apiCallr);
	setResults(result);

	if (delayChain) {
		await delayChain;
		delayChain = undefined;
		const result = await issueSearch(apiCallr);
		setResults(result);
	}
};

export default readyToIssueSearch;
