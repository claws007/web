import { api, clearApiToken, onUnauthorized, setApiToken } from "@/api";
import type { AuthResponse } from "@/api";
import { clearStoredActiveCompanyId } from "@/company/context";
import { defineStore } from "pinia";
import { useCompanyStore } from "./company";

type LoginRequest = {
	email: string;
	password: string;
};

type SafeUser = AuthResponse["user"];

const authStorageKey = "agents-studio.auth";

type StoredAuthSession = {
	token: string;
	user: SafeUser;
};

export const useUserStore = defineStore("user", {
	state: () => ({
		token: null as string | null,
		user: null as SafeUser | null,
		initialized: false,
		loggingIn: false,
	}),
	getters: {
		isAuthenticated: (state) => !!state.token && !!state.user,
		userId: (state) => state.user?.id ?? null,
	},
	actions: {
		initAuth() {
			if (this.initialized) {
				return;
			}

			this.bindUnauthorizedHandler();

			const session = readStoredSession();
			if (session) {
				this.token = session.token;
				this.user = session.user;
				setApiToken(session.token);
			} else {
				clearApiToken();
			}

			this.initialized = true;
		},
		async login(payload: LoginRequest) {
			this.bindUnauthorizedHandler();
			this.loggingIn = true;

			try {
				const response = await api.user.postUserLogin(payload);
				this.applySession(response.data);
				this.initialized = true;
				return response.data;
			} finally {
				this.loggingIn = false;
			}
		},
		applySession(session: AuthResponse) {
			this.token = session.token;
			this.user = session.user;
			this.initialized = true;
			setApiToken(session.token);
			writeStoredSession({
				token: session.token,
				user: session.user,
			});
		},
		setUser(user: SafeUser | null) {
			this.user = user;
			this.initialized = true;

			if (this.token && this.user) {
				writeStoredSession({
					token: this.token,
					user: this.user,
				});
				return;
			}

			removeStoredSession();
		},
		logout() {
			const companyStore = useCompanyStore();
			companyStore.reset();

			this.token = null;
			this.user = null;
			this.initialized = true;
			clearApiToken();
			clearStoredActiveCompanyId();
			removeStoredSession();
		},
		bindUnauthorizedHandler() {
			onUnauthorized(() => {
				this.logout();
			});
		},
	},
});

function readStoredSession(): StoredAuthSession | null {
	if (!hasWindow()) {
		return null;
	}

	const rawSession = window.localStorage.getItem(authStorageKey);
	if (!rawSession) {
		return null;
	}

	try {
		const session = JSON.parse(rawSession) as Partial<StoredAuthSession>;
		if (!session.token || !session.user) {
			removeStoredSession();
			return null;
		}

		return {
			token: session.token,
			user: session.user,
		};
	} catch {
		removeStoredSession();
		return null;
	}
}

function writeStoredSession(session: StoredAuthSession) {
	if (!hasWindow()) {
		return;
	}

	window.localStorage.setItem(authStorageKey, JSON.stringify(session));
}

function removeStoredSession() {
	if (!hasWindow()) {
		return;
	}

	window.localStorage.removeItem(authStorageKey);
}

function hasWindow() {
	return typeof window !== "undefined";
}
