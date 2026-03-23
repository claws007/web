import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { CompanyResponse, SafeUserResponse } from "@/api";
import {
  api,
  clearApiToken,
  clearStoredActiveCompanyId,
  readStoredActiveCompanyId,
  setApiToken,
  setStoredActiveCompanyId,
} from "@/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type UserWithCompanyMeta = SafeUserResponse & {
  companies?: CompanyResponse[];
  companyIds?: number[];
};

export const useUserStore = defineStore("user", () => {
  const storedToken =
    localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  const storedUser =
    localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);

  const token = ref<string | null>(storedToken);
  const user = ref<UserWithCompanyMeta | null>(
    storedUser ? (JSON.parse(storedUser) as UserWithCompanyMeta) : null,
  );
  const companies = ref<CompanyResponse[]>(
    Array.isArray(user.value?.companies) ? user.value.companies : [],
  );

  const isLoggedIn = computed(() => !!token.value);

  function syncCompanies(nextCompanies: CompanyResponse[]) {
    const normalizedCompanies = Array.isArray(nextCompanies)
      ? nextCompanies
      : [];
    companies.value = normalizedCompanies;

    const activeCompanyId = readStoredActiveCompanyId();
    const firstCompanyId = normalizedCompanies[0]?.id;
    const hasActiveCompany =
      typeof activeCompanyId === "number" &&
      normalizedCompanies.some((company) => company.id === activeCompanyId);

    if (!normalizedCompanies.length) {
      clearStoredActiveCompanyId();
    } else if (!hasActiveCompany && typeof firstCompanyId === "number") {
      setStoredActiveCompanyId(firstCompanyId);
    }

    if (!user.value) {
      return;
    }

    const nextUser: UserWithCompanyMeta = {
      ...user.value,
      companies: normalizedCompanies,
      companyIds: normalizedCompanies.map((company) => company.id),
    };

    user.value = nextUser;
    persistUser(nextUser);
  }

  function persistUser(nextUser: UserWithCompanyMeta | null) {
    const localHasAuth = localStorage.getItem(TOKEN_KEY) !== null;
    const sessionHasAuth = sessionStorage.getItem(TOKEN_KEY) !== null;

    if (!nextUser) {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
      return;
    }

    const serializedUser = JSON.stringify(nextUser);

    if (localHasAuth) {
      localStorage.setItem(USER_KEY, serializedUser);
    }

    if (sessionHasAuth) {
      sessionStorage.setItem(USER_KEY, serializedUser);
    }

    if (!localHasAuth && !sessionHasAuth) {
      sessionStorage.setItem(USER_KEY, serializedUser);
    }
  }

  if (token.value) {
    setApiToken(token.value);
  }

  async function initialize() {
    if (!token.value) {
      companies.value = [];
      return;
    }

    setApiToken(token.value);

    try {
      const companyRes = await api.company.getCompany();
      syncCompanies(companyRes.data);
    } catch {
      companies.value = Array.isArray(user.value?.companies)
        ? user.value.companies
        : [];
    }
  }

  async function login(email: string, password: string, remember: boolean) {
    const res = await api.user.postUserLogin({ email, password });
    const { token: newToken, user: newUser } = res.data;

    token.value = newToken;
    setApiToken(newToken);

    const nextUser: UserWithCompanyMeta = {
      ...newUser,
      companies: [],
      companyIds: [],
    };

    user.value = nextUser;
    companies.value = [];

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, newToken);
    storage.setItem(USER_KEY, JSON.stringify(nextUser));

    await initialize();
  }

  function logout() {
    token.value = null;
    user.value = null;
    companies.value = [];
    clearApiToken();
    clearStoredActiveCompanyId();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function markCompanyCreated(company: CompanyResponse) {
    const existingCompanies = companies.value;
    const nextCompanies = existingCompanies.some(
      (item) => item.id === company.id,
    )
      ? existingCompanies
      : [...existingCompanies, company];

    syncCompanies(nextCompanies);
  }

  return {
    token,
    user,
    isLoggedIn,
    companies,
    initialize,
    login,
    logout,
    markCompanyCreated,
  };
});
