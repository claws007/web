import { ContentType } from "@/api/generated";
import type {
	FileResponse,
	RequestParams,
	SafeUserResponse,
} from "@/api/generated";

export type CompanyRole = "OWNER" | "MANAGER" | "STAFF";

export type CompanyResponse = {
	id: number;
	name: string;
	description?: string | null;
	brandFileId?: number | null;
	brand?: FileResponse | Record<string, any> | null;
	role?: CompanyRole | null;
	relationId?: number | null;
	raw: Record<string, any>;
};

export type UserCompanyRelationResponse = {
	id: number;
	userId: number;
	companyId: number;
	role: CompanyRole;
	user?: SafeUserResponse | Record<string, any> | null;
	company?: CompanyResponse | Record<string, any> | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	raw: Record<string, any>;
};

export type CreateCompanyPayload = {
	name: string;
	description?: string | null;
	brandFileId?: number | null;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export type CreateCompanyMemberPayload = {
	userId: number;
	role: CompanyRole | Lowercase<CompanyRole>;
};

export type UpdateCompanyMemberPayload = {
	role: CompanyRole | Lowercase<CompanyRole>;
};

export function normalizeCompanyRole(value: unknown): CompanyRole {
	if (typeof value === "string") {
		const normalized = value.trim().toUpperCase();
		if (
			normalized === "OWNER" || normalized === "MANAGER" ||
			normalized === "STAFF"
		) {
			return normalized;
		}
	}

	return "STAFF";
}

export function normalizeCompanyResponse(raw: unknown): CompanyResponse | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}

	const source = raw as Record<string, any>;
	const id = toPositiveInteger(source.id);
	if (!id) {
		return null;
	}

	const brand = source.brand && typeof source.brand === "object"
		? source.brand
		: null;
	const brandFileId = toNullableInteger(source.brandFileId) ??
		toNullableInteger(source.brandId) ??
		toNullableInteger(source.brandFile?.id) ??
		toNullableInteger(brand?.id) ??
		toNullableInteger(brand?.fileId);

	return {
		id,
		name: toNonEmptyString(source.name) ?? `Company #${id}`,
		description: toNullableString(source.description),
		brandFileId,
		brand,
		role: source.role || source.currentUserRole
			? normalizeCompanyRole(source.role ?? source.currentUserRole)
			: null,
		relationId: toNullableInteger(source.relationId) ??
			toNullableInteger(source.userCompanyRelationId) ??
			toNullableInteger(source.membership?.id),
		raw: source,
	};
}

export function normalizeCompanyCollection(raw: unknown): CompanyResponse[] {
	return collectRecords(raw)
		.map((item) => normalizeCompanyResponse(item))
		.filter((item): item is CompanyResponse => !!item);
}

export function normalizeUserCompanyRelationResponse(
	raw: unknown,
): UserCompanyRelationResponse | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}

	const source = raw as Record<string, any>;
	const id = toPositiveInteger(source.id);
	const userId = toPositiveInteger(source.userId);
	const companyId = toPositiveInteger(source.companyId);
	if (!id || !userId || !companyId) {
		return null;
	}

	return {
		id,
		userId,
		companyId,
		role: normalizeCompanyRole(source.role),
		user: source.user && typeof source.user === "object"
			? (source.user as SafeUserResponse)
			: null,
		company: normalizeCompanyResponse(source.company) ?? null,
		createdAt: toNullableString(source.createdAt),
		updatedAt: toNullableString(source.updatedAt),
		raw: source,
	};
}

export function normalizeUserCompanyRelationCollection(
	raw: unknown,
): UserCompanyRelationResponse[] {
	return collectRecords(raw)
		.map((item) => normalizeUserCompanyRelationResponse(item))
		.filter((item): item is UserCompanyRelationResponse => !!item);
}

export function createBodyParams(body: unknown, params: RequestParams = {}) {
	return {
		...params,
		body,
		type: ContentType.Json,
		format: "json" as const,
	};
}

function collectRecords(raw: unknown): Record<string, any>[] {
	if (Array.isArray(raw)) {
		return raw.filter((item): item is Record<string, any> =>
			!!item && typeof item === "object"
		);
	}

	if (!raw || typeof raw !== "object") {
		return [];
	}

	const source = raw as Record<string, any>;
	const candidateKeys = [
		"items",
		"rows",
		"data",
		"companies",
		"members",
		"relations",
		"results",
	];

	for (const key of candidateKeys) {
		if (Array.isArray(source[key])) {
			return source[key].filter(
				(item: unknown): item is Record<string, any> =>
					!!item && typeof item === "object",
			);
		}
	}

	const normalizedCompany = normalizeCompanyResponse(source);
	if (normalizedCompany) {
		return [source];
	}

	const normalizedMember = normalizeUserCompanyRelationResponse(source);
	if (normalizedMember) {
		return [source];
	}

	return [];
}

function toPositiveInteger(value: unknown) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
}

function toNullableInteger(value: unknown) {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
}

function toNonEmptyString(value: unknown) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function toNullableString(value: unknown) {
	if (value === null || value === undefined) {
		return null;
	}

	return typeof value === "string" ? value : String(value);
}
