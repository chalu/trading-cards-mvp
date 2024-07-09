export const wait = async ({ until } = { until: 1000 }) =>
	new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, until);
	});

export const settle = (tailPromise: Promise<unknown>) => ({
	async after(headPromise: Promise<unknown>) {
		await headPromise;
		await tailPromise;
	},
});

export const capitalize = (str: string) => {
	return `${str.charAt(0).toUpperCase()}${str.substring(1)}`;
};

export const noop = () => {};

const getPageValueFromURL = (url: string) => {
	try {
		const { host, protocol } = window.location;
		const pageURL = new URL(url, `${protocol}${host}`);
		return pageURL.searchParams.get("page");
	} catch (error) {
		console.warn("unable to parse next pager URL", url);
	}
	return undefined;
};

export type PagerIndex = {
	totalPages: number;
	currentPage: number;
};

export const getPagerIndex = (
	totalResults: number,
	maxPerPage: number,
	nav: { next: string | undefined; previous: string | undefined },
): PagerIndex => {
	let currPage = 1;
	if (nav.next) {
		const nextPageValue = getPageValueFromURL(nav.next);
		if (nextPageValue) {
			currPage = Number.parseInt(nextPageValue, 10) - 1;
		}
	}

	if (nav.previous) {
		const prevPageValue = getPageValueFromURL(nav.previous);
		if (prevPageValue) {
			currPage = Number.parseInt(prevPageValue, 10) + 1;
		}
	}

	const totalPages =
		Number.parseInt(`${totalResults / maxPerPage}`) +
		(totalResults % maxPerPage === 0 ? 0 : 1);
	return { currentPage: currPage, totalPages };
};
