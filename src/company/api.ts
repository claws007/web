import { api } from "@/api";
import {
	type CompanyResponse,
	createBodyParams,
	type CreateCompanyMemberPayload,
	type CreateCompanyPayload,
	normalizeCompanyCollection,
	normalizeCompanyResponse,
	normalizeCompanyRole,
	normalizeUserCompanyRelationCollection,
	normalizeUserCompanyRelationResponse,
	type UpdateCompanyMemberPayload,
	type UpdateCompanyPayload,
	type UserCompanyRelationResponse,
} from "./types";

export async function listCompanies() {
	const response = await api.company.getCompany();
	return normalizeCompanyCollection(response.data);
}

export async function getCompany(companyId: number) {
	const response = await api.company.getCompanyByCompanyId(companyId);
	return normalizeCompanyResponse(response.data);
}

export async function createCompany(payload: CreateCompanyPayload) {
	const response = await api.company.postCompany(
		createBodyParams({
			name: payload.name,
			description: payload.description ?? undefined,
			brandFileId: payload.brandFileId ?? undefined,
		}),
	);

	return normalizeCompanyResponse(response.data);
}

export async function updateCompany(
	companyId: number,
	payload: UpdateCompanyPayload,
) {
	const response = await api.company.putCompanyByCompanyId(
		companyId,
		createBodyParams({
			name: payload.name,
			description: payload.description,
			brandFileId: payload.brandFileId,
		}),
	);

	return normalizeCompanyResponse(response.data);
}

export async function deleteCompany(companyId: number) {
	await api.company.deleteCompanyByCompanyId(companyId);
}

export async function listCompanyMembers(companyId: number) {
	const response = await api.company.getCompanyByCompanyIdMembers(companyId);
	return normalizeUserCompanyRelationCollection(response.data);
}

export async function createCompanyMember(
	companyId: number,
	payload: CreateCompanyMemberPayload,
) {
	const response = await api.company.postCompanyByCompanyIdMembers(
		companyId,
		createBodyParams({
			userId: payload.userId,
			role: normalizeOutboundRole(payload.role),
		}),
	);

	return normalizeUserCompanyRelationResponse(response.data);
}

export async function updateCompanyMember(
	companyId: number,
	relationId: number,
	payload: UpdateCompanyMemberPayload,
) {
	const response = await api.company.putCompanyByCompanyIdMembersByRelationId(
		companyId,
		relationId,
		createBodyParams({
			role: normalizeOutboundRole(payload.role),
		}),
	);

	return normalizeUserCompanyRelationResponse(response.data);
}

export async function deleteCompanyMember(
	companyId: number,
	relationId: number,
) {
	await api.company.deleteCompanyByCompanyIdMembersByRelationId(
		companyId,
		relationId,
	);
}

function normalizeOutboundRole(
	role:
		| CreateCompanyMemberPayload["role"]
		| UpdateCompanyMemberPayload["role"],
) {
	return normalizeCompanyRole(role).toLowerCase();
}

export type { CompanyResponse, UserCompanyRelationResponse };
