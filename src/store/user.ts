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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCompanyCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isObject(payload)) {
    return [];
  }

  const directCandidates = ["companies", "items", "list"];
  for (const key of directCandidates) {
    const candidate = payload[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  const nestedData = payload.data;
  if (Array.isArray(nestedData)) {
    return nestedData;
  }

  if (isObject(nestedData)) {
    for (const key of directCandidates) {
      const candidate = nestedData[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  return [];
}

function normalizeCompanyItem(item: unknown): CompanyResponse | null {
  if (!isObject(item)) {
    return null;
  }

  const candidate = isObject(item.company) ? item.company : item;
  const id = candidate.id;
  const name = candidate.name;

  if (typeof id !== "number" || typeof name !== "string") {
    return null;
  }

  // Fill missing fields for compatibility when API returns summary/relation payloads.
  const brandFile =
    isObject(candidate.brandFile) &&
    typeof candidate.brandFile.id === "number" &&
    typeof candidate.brandFile.bucketName === "string" &&
    typeof candidate.brandFile.objectName === "string" &&
    typeof candidate.brandFile.companyId === "number" &&
    typeof candidate.brandFile.createdAt === "string" &&
    typeof candidate.brandFile.updatedAt === "string"
      ? (candidate.brandFile as unknown as CompanyResponse["brandFile"])
      : null;

  return {
    id,
    name,
    description:
      typeof candidate.description === "string" ||
      candidate.description === null
        ? candidate.description
        : null,
    brandFileId:
      typeof candidate.brandFileId === "number" ||
      candidate.brandFileId === null
        ? candidate.brandFileId
        : null,
    createdAt:
      typeof candidate.createdAt === "string"
        ? candidate.createdAt
        : new Date(0).toISOString(),
    updatedAt:
      typeof candidate.updatedAt === "string"
        ? candidate.updatedAt
        : new Date(0).toISOString(),
    brandFile,
  };
}

function normalizeCompanyList(payload: unknown): CompanyResponse[] {
  const candidates = readCompanyCandidates(payload);
  return candidates
    .map(normalizeCompanyItem)
    .filter((company): company is CompanyResponse => company !== null);
}

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
      syncCompanies(normalizeCompanyList(companyRes.data));
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

  function upsertCompany(company: CompanyResponse) {
    const index = companies.value.findIndex((item) => item.id === company.id);
    if (index < 0) {
      syncCompanies([...companies.value, company]);
      return;
    }

    const next = [...companies.value];
    next[index] = company;
    syncCompanies(next);
  }

  function updateUserProfile(nextProfile: SafeUserResponse) {
    if (!user.value) {
      return;
    }

    const nextUser: UserWithCompanyMeta = {
      ...user.value,
      ...nextProfile,
    };

    user.value = nextUser;
    persistUser(nextUser);
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
    upsertCompany,
    updateUserProfile,
  };
});
