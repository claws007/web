import {
	type AgentFilePermissionResponse,
	type AgentMcpServerRelationResponse,
	type AgentResponse,
	type AgentSkillRelationResponse,
	type AgentTaskResponse,
	type AIModelConnectorResponse,
	Api,
	type ChatHistoryResponse,
	type FileListFileResponse,
	type FileListResponse,
	type FileResponse,
	type HttpResponse,
	type MCPServerResponse,
	type ModelCatalogResponse,
	type ModelTypesResponse,
	type RequestParams,
	type SkillResponse,
	type SubAgentResponse,
} from "./generated";

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

const rawApi = new Api<string>({
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

type LegacyAgentApi = {
	getAgent(
		params?: RequestParams,
	): Promise<HttpResponse<AgentResponse[], unknown>>;
	getAgentById(
		id: number,
		params?: RequestParams,
	): Promise<HttpResponse<AgentResponse, unknown>>;
	postAgent(
		data: Parameters<
			Api<string>["company"]["postCompanyByCompanyIdAgent"]
		>[1],
		params?: RequestParams,
	): Promise<HttpResponse<AgentResponse, unknown>>;
	putAgentById(
		id: number,
		data: Parameters<
			Api<string>["company"]["putCompanyByCompanyIdAgentById"]
		>[2],
		params?: RequestParams,
	): Promise<HttpResponse<AgentResponse, unknown>>;
	deleteAgentById(
		id: number,
		params?: RequestParams,
	): Promise<HttpResponse<unknown, unknown>>;
	postAgentByIdTasks(
		id: number,
		data: Parameters<
			Api<string>["company"]["postCompanyByCompanyIdAgentByIdTasks"]
		>[2],
		params?: RequestParams,
	): Promise<HttpResponse<AgentTaskResponse, unknown>>;
	getAgentByIdTasks(
		id: number,
		params?: RequestParams,
	): Promise<HttpResponse<AgentTaskResponse[], unknown>>;
	postAgentByIdRun(
		id: number,
		params?: RequestParams,
	): Promise<HttpResponse<unknown, unknown>>;
};

type EnhancedApi = Api<string> & {
	agent: LegacyAgentApi;
	modelConnector: {
		getModelConnectorTypes(
			params?: RequestParams,
		): Promise<HttpResponse<ModelTypesResponse, unknown>>;
		getModelConnectorCatalogByType(
			type: string,
			params?: RequestParams,
		): Promise<HttpResponse<ModelCatalogResponse, unknown>>;
		getModelConnector(
			params?: RequestParams,
		): Promise<HttpResponse<AIModelConnectorResponse[], unknown>>;
		getModelConnectorById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<AIModelConnectorResponse, unknown>>;
		postModelConnector(
			data: any,
			params?: RequestParams,
		): Promise<HttpResponse<AIModelConnectorResponse, unknown>>;
		putModelConnectorById(
			id: number,
			data: any,
			params?: RequestParams,
		): Promise<HttpResponse<AIModelConnectorResponse, unknown>>;
		deleteModelConnectorById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	mcpServer: {
		getMcpServer(
			params?: RequestParams,
		): Promise<HttpResponse<MCPServerResponse[], unknown>>;
		getMcpServerById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<MCPServerResponse, unknown>>;
		postMcpServer(
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdMcpServer"]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<MCPServerResponse, unknown>>;
		putMcpServerById(
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdMcpServerById"]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<MCPServerResponse, unknown>>;
		deleteMcpServerById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	skill: {
		getSkill(
			params?: RequestParams,
		): Promise<HttpResponse<SkillResponse[], unknown>>;
		getSkillById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<SkillResponse, unknown>>;
		postSkill(
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdSkill"]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<SkillResponse, unknown>>;
		putSkillById(
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdSkillById"]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<SkillResponse, unknown>>;
		deleteSkillById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	agentTask: {
		getAgentTaskById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<AgentTaskResponse, unknown>>;
		putAgentTaskById(
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdAgentTaskById"]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<AgentTaskResponse, unknown>>;
		deleteAgentTaskById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
		postAgentTaskByIdRun(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
		postAgentTaskByIdRetry(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
		postAgentTaskByIdRetryContinue(
			id: number,
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdAgentTaskByIdRetryContinue"
				]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
		postAgentTaskByIdStop(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	chatHistory: {
		getChatHistoryAgentTaskByAgentTaskId(
			agentTaskId: number,
			params?: RequestParams,
		): Promise<HttpResponse<ChatHistoryResponse[], unknown>>;
	};
	agentMcpServer: {
		getAgentMcpServerAgentByAgentId(
			agentId: number,
			params?: RequestParams,
		): Promise<HttpResponse<AgentMcpServerRelationResponse[], unknown>>;
		postAgentMcpServer(
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdAgentMcpServer"]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<AgentMcpServerRelationResponse, unknown>>;
		deleteAgentMcpServerById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	agentSkillRelation: {
		getAgentSkillRelationAgentByAgentId(
			agentId: number,
			params?: RequestParams,
		): Promise<HttpResponse<AgentSkillRelationResponse[], unknown>>;
		postAgentSkillRelation(
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdAgentSkillRelation"
				]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<AgentSkillRelationResponse, unknown>>;
		deleteAgentSkillRelationById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	agentFilePermission: {
		getAgentFilePermissionAgentByAgentId(
			agentId: number,
			params?: RequestParams,
		): Promise<HttpResponse<AgentFilePermissionResponse[], unknown>>;
		postAgentFilePermission(
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdAgentFilePermission"
				]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<AgentFilePermissionResponse, unknown>>;
		putAgentFilePermissionById(
			id: number,
			data: Parameters<
				Api<string>["company"][
					"putCompanyByCompanyIdAgentFilePermissionById"
				]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<AgentFilePermissionResponse, unknown>>;
		deleteAgentFilePermissionById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	subAgent: {
		getSubAgent(
			params?: RequestParams,
		): Promise<HttpResponse<SubAgentResponse[], unknown>>;
		postSubAgent(
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdSubagent"]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<SubAgentResponse, unknown>>;
		putSubAgentById(
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdSubagentById"]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<SubAgentResponse, unknown>>;
		deleteSubAgentById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	file: {
		getFile(
			params?: RequestParams,
		): Promise<HttpResponse<FileResponse[], unknown>>;
		getFileById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<FileResponse, unknown>>;
		postFileUpload(
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdFileUpload"]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<FileResponse, unknown>>;
		getFileByIdDownload(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<File, unknown>>;
		deleteFileById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
	fileList: {
		getFileList(
			params?: RequestParams,
		): Promise<HttpResponse<FileListResponse[], unknown>>;
		postFileList(
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdFileList"]
			>[1],
			params?: RequestParams,
		): Promise<HttpResponse<FileListResponse, unknown>>;
		getFileListById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<FileListResponse, unknown>>;
		deleteFileListById(
			id: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
		getFileListByListIdFiles(
			listId: number,
			params?: RequestParams,
		): Promise<HttpResponse<FileListFileResponse[], unknown>>;
		postFileListByListIdFiles(
			listId: number,
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdFileListByListIdFiles"
				]
			>[2],
			params?: RequestParams,
		): Promise<HttpResponse<FileListFileResponse, unknown>>;
		deleteFileListByListIdFilesByEntryId(
			listId: number,
			entryId: number,
			params?: RequestParams,
		): Promise<HttpResponse<unknown, unknown>>;
	};
};

function getRequiredCompanyId() {
	const companyId = readStoredActiveCompanyId();
	if (!companyId) {
		throw new Error("Please select a company first.");
	}

	return companyId;
}

function withCompanyScope<TArgs extends unknown[], TResult>(
	callback: (companyId: number, ...args: TArgs) => TResult,
) {
	return (...args: TArgs) => callback(getRequiredCompanyId(), ...args);
}

export const api = Object.assign(rawApi, {
	agent: {
		getAgent: withCompanyScope((companyId, params: RequestParams = {}) =>
			rawApi.company.getCompanyByCompanyIdAgent(companyId, params)
		),
		getAgentById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdAgentById(
			companyId,
			id,
			params,
		)),
		postAgent: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdAgent"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgent(
			companyId,
			data,
			params,
		)),
		putAgentById: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdAgentById"]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdAgentById(
			companyId,
			id,
			data,
			params,
		)),
		deleteAgentById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdAgentById(
			companyId,
			id,
			params,
		)),
		postAgentByIdTasks: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdAgentByIdTasks"]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentByIdTasks(
			companyId,
			id,
			data,
			params,
		)),
		getAgentByIdTasks: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdAgentByIdTasks(
			companyId,
			id,
			params,
		)),
		postAgentByIdRun: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentByIdRun(
			companyId,
			id,
			params,
		)),
	},
	modelConnector: {
		getModelConnectorTypes: withCompanyScope((
			companyId,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdModelConnectorTypes(
			companyId,
			params,
		)),
		getModelConnectorCatalogByType: withCompanyScope((
			companyId,
			type: string,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdModelConnectorCatalogByType(
			companyId,
			type,
			params,
		)),
		getModelConnector: withCompanyScope((
			companyId,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdModelConnector(
			companyId,
			params,
		)),
		getModelConnectorById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdModelConnectorById(
			companyId,
			id,
			params,
		)),
		postModelConnector: withCompanyScope((
			companyId,
			data: any,
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdModelConnector(
			companyId,
			data,
			params,
		)),
		putModelConnectorById: withCompanyScope((
			companyId,
			id: number,
			data: any,
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdModelConnectorById(
			companyId,
			id,
			data,
			params,
		)),
		deleteModelConnectorById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdModelConnectorById(
			companyId,
			id,
			params,
		)),
	},
	mcpServer: {
		getMcpServer: withCompanyScope((
			companyId,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdMcpServer(companyId, params)),
		getMcpServerById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdMcpServerById(
			companyId,
			id,
			params,
		)),
		postMcpServer: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdMcpServer"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdMcpServer(
			companyId,
			data,
			params,
		)),
		putMcpServerById: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdMcpServerById"]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdMcpServerById(
			companyId,
			id,
			data,
			params,
		)),
		deleteMcpServerById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdMcpServerById(
			companyId,
			id,
			params,
		)),
	},
	skill: {
		getSkill: withCompanyScope((companyId, params: RequestParams = {}) =>
			rawApi.company.getCompanyByCompanyIdSkill(companyId, params)
		),
		getSkillById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdSkillById(
			companyId,
			id,
			params,
		)),
		postSkill: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdSkill"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdSkill(
			companyId,
			data,
			params,
		)),
		putSkillById: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdSkillById"]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdSkillById(
			companyId,
			id,
			data,
			params,
		)),
		deleteSkillById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdSkillById(
			companyId,
			id,
			params,
		)),
	},
	agentTask: {
		getAgentTaskById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdAgentTaskById(
			companyId,
			id,
			params,
		)),
		putAgentTaskById: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdAgentTaskById"]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdAgentTaskById(
			companyId,
			id,
			data,
			params,
		)),
		deleteAgentTaskById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdAgentTaskById(
			companyId,
			id,
			params,
		)),
		postAgentTaskByIdRun: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentTaskByIdRun(
			companyId,
			id,
			params,
		)),
		postAgentTaskByIdRetry: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentTaskByIdRetry(
			companyId,
			id,
			params,
		)),
		postAgentTaskByIdRetryContinue: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdAgentTaskByIdRetryContinue"
				]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentTaskByIdRetryContinue(
			companyId,
			id,
			data,
			params,
		)),
		postAgentTaskByIdStop: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentTaskByIdStop(
			companyId,
			id,
			params,
		)),
	},
	chatHistory: {
		getChatHistoryAgentTaskByAgentTaskId: withCompanyScope((
			companyId,
			agentTaskId: number,
			params: RequestParams = {},
		) => rawApi.company
			.getCompanyByCompanyIdChatHistoryAgentTaskByAgentTaskId(
				companyId,
				agentTaskId,
				params,
			)
		),
	},
	agentMcpServer: {
		getAgentMcpServerAgentByAgentId: withCompanyScope((
			companyId,
			agentId: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdAgentMcpServerAgentByAgentId(
			companyId,
			agentId,
			params,
		)),
		postAgentMcpServer: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdAgentMcpServer"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentMcpServer(
			companyId,
			data,
			params,
		)),
		deleteAgentMcpServerById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdAgentMcpServerById(
			companyId,
			id,
			params,
		)),
	},
	agentSkillRelation: {
		getAgentSkillRelationAgentByAgentId: withCompanyScope((
			companyId,
			agentId: number,
			params: RequestParams = {},
		) => rawApi.company
			.getCompanyByCompanyIdAgentSkillRelationAgentByAgentId(
				companyId,
				agentId,
				params,
			)
		),
		postAgentSkillRelation: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdAgentSkillRelation"
				]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentSkillRelation(
			companyId,
			data,
			params,
		)),
		deleteAgentSkillRelationById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdAgentSkillRelationById(
			companyId,
			id,
			params,
		)),
	},
	agentFilePermission: {
		getAgentFilePermissionAgentByAgentId: withCompanyScope((
			companyId,
			agentId: number,
			params: RequestParams = {},
		) => rawApi.company
			.getCompanyByCompanyIdAgentFilePermissionAgentByAgentId(
				companyId,
				agentId,
				params,
			)
		),
		postAgentFilePermission: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdAgentFilePermission"
				]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdAgentFilePermission(
			companyId,
			data,
			params,
		)),
		putAgentFilePermissionById: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"][
					"putCompanyByCompanyIdAgentFilePermissionById"
				]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdAgentFilePermissionById(
			companyId,
			id,
			data,
			params,
		)),
		deleteAgentFilePermissionById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdAgentFilePermissionById(
			companyId,
			id,
			params,
		)),
	},
	subAgent: {
		getSubAgent: withCompanyScope((
			companyId,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdSubagent(companyId, params)),
		postSubAgent: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdSubagent"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdSubagent(
			companyId,
			data,
			params,
		)),
		putSubAgentById: withCompanyScope((
			companyId,
			id: number,
			data: Parameters<
				Api<string>["company"]["putCompanyByCompanyIdSubagentById"]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.putCompanyByCompanyIdSubagentById(
			companyId,
			id,
			data,
			params,
		)),
		deleteSubAgentById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdSubagentById(
			companyId,
			id,
			params,
		)),
	},
	file: {
		getFile: withCompanyScope((companyId, params: RequestParams = {}) =>
			rawApi.company.getCompanyByCompanyIdFile(companyId, params)
		),
		getFileById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdFileById(
			companyId,
			id,
			params,
		)),
		postFileUpload: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdFileUpload"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdFileUpload(
			companyId,
			data,
			params,
		)),
		getFileByIdDownload: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdFileByIdDownload(
			companyId,
			id,
			params,
		)),
		deleteFileById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdFileById(
			companyId,
			id,
			params,
		)),
	},
	fileList: {
		getFileList: withCompanyScope((companyId, params: RequestParams = {}) =>
			rawApi.company.getCompanyByCompanyIdFileList(companyId, params)
		),
		postFileList: withCompanyScope((
			companyId,
			data: Parameters<
				Api<string>["company"]["postCompanyByCompanyIdFileList"]
			>[1],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdFileList(
			companyId,
			data,
			params,
		)),
		getFileListById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdFileListById(
			companyId,
			id,
			params,
		)),
		deleteFileListById: withCompanyScope((
			companyId,
			id: number,
			params: RequestParams = {},
		) => rawApi.company.deleteCompanyByCompanyIdFileListById(
			companyId,
			id,
			params,
		)),
		getFileListByListIdFiles: withCompanyScope((
			companyId,
			listId: number,
			params: RequestParams = {},
		) => rawApi.company.getCompanyByCompanyIdFileListByListIdFiles(
			companyId,
			listId,
			params,
		)),
		postFileListByListIdFiles: withCompanyScope((
			companyId,
			listId: number,
			data: Parameters<
				Api<string>["company"][
					"postCompanyByCompanyIdFileListByListIdFiles"
				]
			>[2],
			params: RequestParams = {},
		) => rawApi.company.postCompanyByCompanyIdFileListByListIdFiles(
			companyId,
			listId,
			data,
			params,
		)),
		deleteFileListByListIdFilesByEntryId: withCompanyScope((
			companyId,
			listId: number,
			entryId: number,
			params: RequestParams = {},
		) => rawApi.company
			.deleteCompanyByCompanyIdFileListByListIdFilesByEntryId(
				companyId,
				listId,
				entryId,
				params,
			)
		),
	},
}) as EnhancedApi;

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
