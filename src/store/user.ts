import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SafeUserResponse } from "@/api";
import { api, clearApiToken, setApiToken } from "@/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const useUserStore = defineStore("user", () => {
	const storedToken = localStorage.getItem(TOKEN_KEY) ??
		sessionStorage.getItem(TOKEN_KEY);
	const storedUser = localStorage.getItem(USER_KEY) ??
		sessionStorage.getItem(USER_KEY);

	const token = ref<string | null>(storedToken);
	const user = ref<SafeUserResponse | null>(
		storedUser ? (JSON.parse(storedUser) as SafeUserResponse) : null,
	);

	const isLoggedIn = computed(() => !!token.value);

	if (token.value) {
		setApiToken(token.value);
	}

	async function login(email: string, password: string, remember: boolean) {
		const res = await api.user.postUserLogin({ email, password });
		const { token: newToken, user: newUser } = res.data;

		token.value = newToken;
		user.value = newUser;
		setApiToken(newToken);

		const storage = remember ? localStorage : sessionStorage;
		storage.setItem(TOKEN_KEY, newToken);
		storage.setItem(USER_KEY, JSON.stringify(newUser));
	}

	function logout() {
		token.value = null;
		user.value = null;
		clearApiToken();
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		sessionStorage.removeItem(TOKEN_KEY);
		sessionStorage.removeItem(USER_KEY);
	}

	return { token, user, isLoggedIn, login, logout };
});
