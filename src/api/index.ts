import { Api } from "./generated";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export const api = new Api<string>({
	baseUrl: apiBaseUrl,
	customFetch: async (input, init) => {
		const response = await fetch(input, init);

		if (response.status === 401) {
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
