import {
	clearStoredActiveCompanyId,
	readStoredActiveCompanyId,
	writeStoredActiveCompanyId,
} from "@/company/context";
import {
	type CompanyResponse,
	type UserCompanyRelationResponse,
} from "@/company/types";
import { listCompanies, listCompanyMembers } from "@/company/api";
import { defineStore } from "pinia";
import { useUserStore } from "./user";

type CompanyState = {
	companies: CompanyResponse[];
	activeCompanyId: number | null;
	membersByCompanyId: Record<number, UserCompanyRelationResponse[]>;
	initialized: boolean;
	initializing: boolean;
	errorMessage: string;
};

export const useCompanyStore = defineStore("company", {
	state: (): CompanyState => ({
		companies: [],
		activeCompanyId: readStoredActiveCompanyId(),
		membersByCompanyId: {},
		initialized: false,
		initializing: false,
		errorMessage: "",
	}),
	getters: {
		hasCompanies: (state) => state.companies.length > 0,
		activeCompany: (state) =>
			state.companies.find((company) =>
				company.id === state.activeCompanyId
			) ?? null,
		selectionRequired: (state) =>
			state.companies.length > 1 && !state.activeCompanyId,
		activeRole(): CompanyResponse["role"] {
			const activeCompany = this.activeCompany;
			if (activeCompany?.role) {
				return activeCompany.role;
			}

			const relation = this.currentUserRelation;
			return relation?.role ?? null;
		},
		currentMembers(state) {
			if (!state.activeCompanyId) {
				return [];
			}

			return state.membersByCompanyId[state.activeCompanyId] || [];
		},
		currentUserRelation(): UserCompanyRelationResponse | null {
			if (!this.activeCompanyId) {
				return null;
			}

			const userStore = useUserStore();
			if (!userStore.userId) {
				return null;
			}

			return (
				this.currentMembers.find((relation) =>
					relation.userId === userStore.userId
				) ?? null
			);
		},
		canManageCompany(): boolean {
			return this.activeRole === "OWNER" || this.activeRole === "MANAGER";
		},
		canDeleteCompany(): boolean {
			return this.activeRole === "OWNER";
		},
		canManageMembers(): boolean {
			return this.activeRole === "OWNER" || this.activeRole === "MANAGER";
		},
		canEditMemberRoles(): boolean {
			return this.activeRole === "OWNER";
		},
	},
	actions: {
		async initCompanyContext(force = false) {
			const userStore = useUserStore();

			if (!userStore.isAuthenticated) {
				this.reset();
				return;
			}

			if (this.initialized && !force) {
				return;
			}

			this.initializing = true;
			this.errorMessage = "";

			try {
				await this.refreshCompanies();
				this.initialized = true;
			} catch (error) {
				this.errorMessage = getErrorMessage(
					error,
					"Failed to load companies.",
				);
				throw error;
			} finally {
				this.initializing = false;
			}
		},
		async refreshCompanies() {
			this.companies = await listCompanies();

			const storedActiveCompanyId = readStoredActiveCompanyId();
			const candidateCompanyId = this.activeCompanyId ??
				storedActiveCompanyId;
			const hasCandidate = typeof candidateCompanyId === "number" &&
				this.companies.some((company) =>
					company.id === candidateCompanyId
				);

			if (hasCandidate) {
				this.activeCompanyId = candidateCompanyId;
				writeStoredActiveCompanyId(candidateCompanyId!);
				return;
			}

			if (this.companies.length === 1) {
				const onlyCompany = this.companies[0];
				if (onlyCompany) {
					this.selectCompany(onlyCompany.id);
				}
				return;
			}

			this.activeCompanyId = null;
			clearStoredActiveCompanyId();
		},
		selectCompany(companyId: number) {
			if (!this.companies.some((company) => company.id === companyId)) {
				throw new Error("Selected company is not accessible.");
			}

			this.activeCompanyId = companyId;
			writeStoredActiveCompanyId(companyId);
		},
		clearSelection() {
			this.activeCompanyId = null;
			clearStoredActiveCompanyId();
		},
		async loadMembers(companyId?: number) {
			const targetCompanyId = companyId ?? this.activeCompanyId;
			if (!targetCompanyId) {
				return [];
			}

			const members = await listCompanyMembers(targetCompanyId);
			this.membersByCompanyId = {
				...this.membersByCompanyId,
				[targetCompanyId]: members,
			};
			return members;
		},
		reset() {
			this.companies = [];
			this.activeCompanyId = null;
			this.membersByCompanyId = {};
			this.initialized = false;
			this.initializing = false;
			this.errorMessage = "";
			clearStoredActiveCompanyId();
		},
	},
});

function getErrorMessage(error: unknown, fallback: string) {
	if (
		typeof error === "object" &&
		error !== null &&
		"error" in error &&
		typeof error.error === "object" &&
		error.error !== null &&
		"error" in error.error &&
		typeof error.error.error === "string"
	) {
		return error.error.error;
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}
