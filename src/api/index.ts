import { Api } from "./generated";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const loginPath = "/user/login";

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

function isLoginEndpoint(input: RequestInfo | URL) {
	const urlString = typeof input === "string"
		? input
		: input instanceof URL
		? input.toString()
		: input.url;

	try {
		const url = new URL(urlString, window.location.origin);
		return url.pathname.endsWith(loginPath);
	} catch {
		return urlString.endsWith(loginPath);
	}
}

function stripAuthorization(init: RequestInit = {}) {
	const headers = new Headers(init.headers);
	headers.delete("Authorization");

	return {
		...init,
		headers,
	};
}

export const api = new Api<string>({
	baseUrl: apiBaseUrl,
	baseApiParams: {
		secure: true,
	},
	customFetch: async (input, init) => {
		const isLoginRequest = isLoginEndpoint(input);
		const requestInit = isLoginRequest ? stripAuthorization(init) : init;
		const response = await fetch(input, requestInit);

		if (!isLoginRequest && response.status === 401) {
			await unauthorizedHandler?.();
		}

		return response;
	},
	securityWorker: (token) => {
		if (!token) {
			return undefined;
		}

		return {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
	},
});

export function setApiToken(token: string | null) {
	api.setSecurityData(token);
}

export function clearApiToken() {
	api.setSecurityData(null);
}

export function onUnauthorized(handler: (() => void | Promise<void>) | null) {
	unauthorizedHandler = handler;
}

export * from "./generated";
