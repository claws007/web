/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface RootResponse {
  name: string;
  message: string;
  /** @format date-time */
  now: string;
}

export interface HealthUpResponse {
  ok: true;
  db: "up";
}

export interface HealthDownResponse {
  ok: false;
  db: "down";
}

export interface ErrorResponse {
  error: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: Record<string, any>;
}

export interface SuccessResponse {
  success: true;
}

export interface SafeUserResponse {
  id: number;
  name: string | null;
  /** @format email */
  email: string | null;
  mobile: string | null;
  avatarFileId?: number | null;
}

export interface AuthResponse {
  user: SafeUserResponse;
  token: string;
}

export interface CompanyResponse {
  id: number;
  name: string;
  description?: string | null;
  brandFileId?: number | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  brandFile?: FileResponse | null;
}

export interface ModelTypesResponse {
  types: ModelTypeOptionResponse[];
}

export interface ModelTypeOptionResponse {
  code: string;
  /** Chinese display label for the model connector type */
  label: string;
}

export interface ModelCatalogResponse {
  type: string;
  models: string[];
}

export interface DockerAvailabilityResponse {
  available: boolean;
  clientVersion?: string;
  serverVersion?: string;
  error?: string;
}

export interface DockerLocalImageResponse {
  repository: string;
  tag: string;
  imageId: string;
  digest?: string;
  createdSince?: string;
  size?: string;
  fullName: string;
}

export interface DockerLocalImagePageResponse {
  items: DockerLocalImageResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface DockerPullResponse {
  success: true;
  image: string;
  output: string;
}

export interface DockerHubImageResponse {
  name: string;
  namespace: string;
  repositoryType?: string;
  shortDescription?: string;
  starCount?: number;
  pullCount?: number;
  isOfficial?: boolean;
}

export interface DockerHubImagePageResponse {
  items: DockerHubImageResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AIModelConnectorResponse {
  id: number;
  name: string;
  type: string;
  params: Record<string, any>;
  /**
   * Maximum number of tasks that can execute concurrently with this model connector
   * @min 1
   */
  concurrency: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalTokens?: number;
}

export interface AgentResponse {
  id: number;
  name: string;
  extraPrompt?: string | null;
  capacity?: string | null;
  model?: string | null;
  sandboxType?: "NONE" | "DOCKER";
  containerImage?: string | null;
  autoStoreSandboxContext?: boolean;
  sandboxStartupArguments?: string | null;
  avatarFileId?: number | null;
  companyId: number;
  modelConnectorId: number;
  builtin: boolean;
  builtinType?: "SYSTEM_ASSISTANT" | null;
  user?: Record<string, any>;
  modelConnector?: AIModelConnectorResponse;
}

export interface ToolSourceInfo {
  originType: "mcp" | "local";
  mcpServerId: number;
  mcpServerName: string;
  mcpServerType: "HTTP" | "STDIO";
}

export interface ToolMetadata {
  source?: ToolSourceInfo;
  mcpServerId?: number;
  mcpServerType?: "HTTP" | "STDIO";
  mcpToolName?: string;
  [key: string]: any;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  [key: string]: any;
}

export interface ToolListItem {
  type: "function";
  function: ToolFunction;
  metadata?: ToolMetadata;
  [key: string]: any;
}

export interface AgentTaskArtifact {
  type: string;
  uri?: string | null;
  path?: string | null;
  description?: string | null;
}

export interface AgentTaskSubmissionResult {
  isCompleted: boolean;
  output: string;
  summary?: string | null;
  artifacts?: AgentTaskArtifact[];
  notes?: string | null;
  failureReason?: string | null;
}

export interface AgentTaskValidationResult {
  status: "NOT_RUN" | "PASSED" | "FAILED" | "SKIPPED";
  command?: string | null;
  exitCode?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  durationMs?: number | null;
  /** @format date-time */
  ranAt?: string | null;
  skipped: boolean;
  skipReason?:
    | "NO_AC"
    | "AGENT_DECLARED_FAILURE"
    | "TASK_CANCELLED"
    | "SYSTEM_ERROR"
    | null;
}

export interface AgentTaskFailureResult {
  code?:
    | "AGENT_DECLARED_FAILURE"
    | "SUBMIT_REQUIRED"
    | "VALIDATION_COMMAND_FAILED"
    | "VALIDATION_COMMAND_TIMEOUT"
    | "VALIDATION_COMMAND_ERROR"
    | "MODEL_LOOP_MAX_ITERATIONS"
    | "TASK_CANCELLED"
    | "SYSTEM_ERROR"
    | null;
  message?: string | null;
  /** @format date-time */
  at?: string | null;
}

export interface AgentTaskResult {
  status:
    | "PENDING_SUBMISSION"
    | "SUBMITTED_SUCCESS"
    | "SUBMITTED_FAILED"
    | "VALIDATION_PASSED"
    | "VALIDATION_FAILED"
    | "SYSTEM_FAILED";
  /** @format date-time */
  submittedAt: string | null;
  submission: AgentTaskSubmissionResult | null;
  validation: AgentTaskValidationResult;
  failure: AgentTaskFailureResult | null;
}

export interface SubAgentResponse {
  id: number;
  agentId: number;
  parentAgentId: number;
  agent?: AgentResponse;
  parentAgent?: AgentResponse;
}

export interface CreateSubAgentWithAgentResponse {
  agent: AgentResponse;
  subAgent: SubAgentResponse;
}

export interface AgentTaskResponse {
  id: number;
  agentId: number;
  content: string;
  ac: string | null;
  result?: AgentTaskResult | null;
  toolList?: ToolListItem[] | null;
  state: string;
  queueOrder: number;
  /** @format date-time */
  assignedAt: string;
  /** @format date-time */
  startedAt?: string | null;
  /** @format date-time */
  finishedAt?: string | null;
  /** @format date-time */
  updatedAt?: string;
  retryCount?: number;
  /** @format date-time */
  lastRetryAt?: string | null;
  /** @format date-time */
  lastHeartbeatAt?: string | null;
  executionCursor?: Record<string, any>;
  /** @format date-time */
  priorityRunAt?: string | null;
  agent?: AgentResponse;
}

export interface AgentTaskCommentResponse {
  id: number;
  agentTaskId: number;
  userId: number;
  content: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  user?: SafeUserResponse;
}

export interface ChatHistoryResponse {
  id: number;
  role: "SYSTEM" | "USER" | "ASSISTANT";
  eventType?:
    | "MESSAGE"
    | "EXECUTION"
    | "MCP_CALL"
    | "MCP_RESULT"
    | "SKILL_CALL"
    | "TOOL_CALL";
  eventTypeName?: string | null;
  contextSize?: number | null;
  durationMs?: number | null;
  extraLogs?: Record<string, any>;
  content: string;
  agentTaskId: number;
  /** @format date-time */
  createdAt: string;
}

export interface ChatHistoryPageResponse {
  items: ChatHistoryResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface CompanyPageResponse {
  items: CompanyResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AIModelConnectorPageResponse {
  items: AIModelConnectorResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentPageResponse {
  items: AgentResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentTaskPageResponse {
  items: AgentTaskResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentTaskCommentPageResponse {
  items: AgentTaskCommentResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface SubAgentPageResponse {
  items: SubAgentResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface MCPServerPageResponse {
  items: MCPServerResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentMcpServerRelationPageResponse {
  items: AgentMcpServerRelationResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentSkillRelationPageResponse {
  items: AgentSkillRelationResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentFilePermissionPageResponse {
  items: AgentFilePermissionResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface FilePageResponse {
  items: FileResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface FileListPageResponse {
  items: FileListResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface FileListFilePageResponse {
  items: FileListFileResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface SkillPageResponse {
  items: SkillResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface TaskPageResponse {
  items: TaskResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface GenericPageResponse {
  items: Record<string, any>[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export interface AgentRunResponse {
  success: true;
  started: boolean;
  agentId: number;
}

export interface AgentTaskRunResponse {
  success: true;
  taskId: number;
  agentId: number;
  state: string;
}

export interface MCPServerResponse {
  id: number;
  name?: string | null;
  description?: string | null;
  type: "HTTP" | "STDIO";
  /** @format uri */
  url?: string | null;
  command?: string | null;
  commandArguments?: string | null;
  headers?: MCPServerHeaders;
  envs?: MCPServerEnvs;
}

export type MCPServerHeaders = {
  toolList?: ToolListItem[];
  [key: string]: any;
} | null;

export type MCPServerEnvs = Record<string, string>;

export interface AgentMcpServerRelationResponse {
  id: number;
  agentId: number;
  mcpServerId: number;
  /** @format date-time */
  assignedAt: string;
  agent?: AgentResponse;
  mcpServer?: MCPServerResponse;
}

export interface AgentSkillRelationResponse {
  id: number;
  agentId: number;
  skillId: number;
  /** @format date-time */
  assignedAt: string;
  agent?: AgentResponse;
  skill?: SkillResponse;
}

export interface AgentFilePermissionResponse {
  id: number;
  companyId: number;
  agentId: number;
  path: string;
  normalizedPath: string;
  mountPath: string;
  normalizedMountPath: string;
  enabled: boolean;
  writable: boolean;
  /** @format date-time */
  createdAt: string;
  agent?: Record<string, any>;
}

export interface FileResponse {
  id: number;
  bucketName: string;
  objectName: string;
  filePath?: string | null;
  companyId: number;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface FileListFileResponse {
  id: number;
  fileListId: number;
  fileId: number;
  /** @format date-time */
  createdAt: string;
  file: FileResponse;
}

export interface FileListResponse {
  id: number;
  companyId: number;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  files: {
    id: number;
    fileListId: number;
    fileId: number;
    /** @format date-time */
    createdAt: string;
    file: FileResponse;
  }[];
}

export interface SkillResponse {
  id: number;
  companyId: number;
  name: string;
  fileListId: number;
  description?: string | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  fileList?: {
    id?: number;
    companyId?: number;
    /** @format date-time */
    createdAt?: string;
    /** @format date-time */
    updatedAt?: string;
    files?: {
      id?: number;
      fileListId?: number;
      fileId?: number;
      /** @format date-time */
      createdAt?: string;
      file?: FileResponse;
    }[];
  } | null;
}

export interface SkillDownloadFileResponse {
  fileId: number;
  filePath: string;
  contentType?: string | null;
  contentBase64: string;
}

export interface SkillDownloadFilesResponse {
  skillId: number;
  skillName: string;
  files: SkillDownloadFileResponse[];
}

export interface TaskResponse {
  id: number;
  companyId: number;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
  content: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  agentTasks?: AgentTaskResponse[];
}

export interface NotificationResponse {
  /** @min 1 */
  id: number;
  /** @min 1 */
  companyId: number;
  type:
    | "REQUEST_INPUT"
    | "REQUEST_SELECT_SINGLE"
    | "REQUEST_SELECT_MULTI"
    | "REQUEST_CONFIRM"
    | "COMMAND_PROGRESS"
    | "AGENT_TASK_RESULT";
  title: string | null;
  content: string;
  extraParams: Record<string, any>;
  state: "PENDING" | "RESOLVE";
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  resolvedAt: string | null;
}

export interface NotificationPageResponse {
  items: NotificationResponse[];
  /** @min 1 */
  page: number;
  /** @min 1 */
  pageSize: number;
  /** @min 0 */
  total: number;
  /** @min 0 */
  totalPages: number;
}

export type GenericObjectResponse = Record<string, any>;

export type GenericArrayResponse = Record<string, any>[];

export type OpenApiDocumentResponse = Record<string, any>;

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "http://localhost:8000";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Agents Studio Server API
 * @version 1.0.0
 * @baseUrl http://localhost:8000
 *
 * OpenAPI documentation generated from registered Hono routes and Zod validators.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags System
   * @name Get
   * @summary Get service metadata
   * @request GET:/
   */
  get = (params: RequestParams = {}) =>
    this.request<RootResponse, any>({
      path: `/`,
      method: "GET",
      format: "json",
      ...params,
    });

  health = {
    /**
     * No description
     *
     * @tags System
     * @name GetHealth
     * @summary Get database health
     * @request GET:/health
     */
    getHealth: (params: RequestParams = {}) =>
      this.request<HealthUpResponse, HealthDownResponse>({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  swaggerJson = {
    /**
     * No description
     *
     * @tags Docs
     * @name GetSwaggerJson
     * @summary Get OpenAPI specification
     * @request GET:/swagger.json
     */
    getSwaggerJson: (params: RequestParams = {}) =>
      this.request<OpenApiDocumentResponse, any>({
        path: `/swagger.json`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  openapiYaml = {
    /**
     * No description
     *
     * @tags Docs
     * @name GetOpenapiYaml
     * @summary Get OpenAPI YAML document
     * @request GET:/openapi.yaml
     */
    getOpenapiYaml: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/openapi.yaml`,
        method: "GET",
        ...params,
      }),
  };
  asyncapiYaml = {
    /**
     * No description
     *
     * @tags Docs
     * @name GetAsyncapiYaml
     * @summary Get AsyncAPI YAML document
     * @request GET:/asyncapi.yaml
     */
    getAsyncapiYaml: (params: RequestParams = {}) =>
      this.request<GenericArrayResponse, any>({
        path: `/asyncapi.yaml`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  docs = {
    /**
     * No description
     *
     * @tags Docs
     * @name GetDocs
     * @summary Get Swagger UI page
     * @request GET:/docs
     */
    getDocs: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/docs`,
        method: "GET",
        ...params,
      }),
  };
  user = {
    /**
     * No description
     *
     * @tags User
     * @name PostUserLogin
     * @summary Login with email and password
     * @request POST:/user/login
     */
    postUserLogin: (
      data: {
        /** @format email */
        email: string;
        /** @minLength 1 */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<AuthResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/user/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Uploads avatar content for the current user over HTTP. Body fields: - `fileName`: original file name. - `contentBase64`: base64 encoded file content. - `contentType`: optional MIME type.
     *
     * @tags User
     * @name PostUserAvatar
     * @summary Upload current user avatar
     * @request POST:/user/avatar
     */
    postUserAvatar: (
      data: {
        /** @minLength 1 */
        fileName: string;
        /** @minLength 1 */
        contentBase64: string;
        contentType?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<SafeUserResponse, ValidationErrorResponse>({
        path: `/user/avatar`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Updates the current user's profile via multipart/form-data. Form fields: - `name`: optional new display name. Send empty string to clear. - `avatarFile`: optional avatar image blob. When provided, the server uploads it as a File and writes `avatarFileId` atomically with the profile update.
     *
     * @tags User
     * @name PutUserMe
     * @summary Update current user profile
     * @request PUT:/user/me
     */
    putUserMe: (
      data: {
        /** Send empty string to clear display name */
        name?: string;
        /**
         * Optional avatar image file
         * @format binary
         */
        avatarFile?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<SafeUserResponse, ErrorResponse>({
        path: `/user/me`,
        method: "PUT",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  events = {
    /**
     * No description
     *
     * @tags System
     * @name GetEventsWs
     * @summary GET /events/ws
     * @request GET:/events/ws
     */
    getEventsWs: (params: RequestParams = {}) =>
      this.request<GenericArrayResponse, any>({
        path: `/events/ws`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  images = {
    /**
     * No description
     *
     * @tags System
     * @name GetImagesByFileId
     * @summary GET /images/{fileId}
     * @request GET:/images/{fileId}
     */
    getImagesByFileId: (fileId: number, params: RequestParams = {}) =>
      this.request<GenericObjectResponse, ErrorResponse>({
        path: `/images/${fileId}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  company = {
    /**
     * No description
     *
     * @tags Company
     * @name GetCompany
     * @summary List companies for current user
     * @request GET:/company
     */
    getCompany: (params: RequestParams = {}) =>
      this.request<CompanyPageResponse, any>({
        path: `/company`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Company
     * @name PostCompany
     * @summary Create a company (multipart/form-data, optional brandFile binary; brand metadata + brandFileId are persisted transactionally)
     * @request POST:/company
     */
    postCompany: (
      data: {
        /** @minLength 1 */
        name: string;
        description?: string;
        /**
         * Optional company brand image file; when provided, the server uploads metadata and writes brandFileId in the same database transaction as company creation
         * @format binary
         */
        brandFile?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<CompanyResponse, ValidationErrorResponse>({
        path: `/company`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Company
     * @name GetCompanyByCompanyId
     * @summary Get company by ID
     * @request GET:/company/{companyId}
     */
    getCompanyByCompanyId: (companyId: number, params: RequestParams = {}) =>
      this.request<CompanyResponse, ErrorResponse>({
        path: `/company/${companyId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Company
     * @name PutCompanyByCompanyId
     * @summary Update company (multipart/form-data, optional brandFile binary; updates brandFileId transactionally with other fields)
     * @request PUT:/company/{companyId}
     */
    putCompanyByCompanyId: (
      companyId: number,
      data: {
        /** @minLength 1 */
        name?: string;
        /** Send empty string to clear description */
        description?: string;
        /**
         * Optional company brand image file; when provided, the server uploads metadata and updates brandFileId in the same database transaction as other Company fields
         * @format binary
         */
        brandFile?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<CompanyResponse, ErrorResponse>({
        path: `/company/${companyId}`,
        method: "PUT",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Company
     * @name DeleteCompanyByCompanyId
     * @summary Delete company
     * @request DELETE:/company/{companyId}
     */
    deleteCompanyByCompanyId: (companyId: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name GetCompanyByCompanyIdMembers
     * @summary List company members
     * @request GET:/company/{companyId}/members
     */
    getCompanyByCompanyIdMembers: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<GenericPageResponse, ErrorResponse>({
        path: `/company/${companyId}/members`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name PostCompanyByCompanyIdMembers
     * @summary Add company member
     * @request POST:/company/{companyId}/members
     */
    postCompanyByCompanyIdMembers: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        GenericObjectResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/members`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name PutCompanyByCompanyIdMembersByRelationId
     * @summary Update company member role
     * @request PUT:/company/{companyId}/members/{relationId}
     */
    putCompanyByCompanyIdMembersByRelationId: (
      companyId: number,
      relationId: number,
      params: RequestParams = {},
    ) =>
      this.request<GenericObjectResponse, ErrorResponse>({
        path: `/company/${companyId}/members/${relationId}`,
        method: "PUT",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags System
     * @name DeleteCompanyByCompanyIdMembersByRelationId
     * @summary Remove company member
     * @request DELETE:/company/{companyId}/members/{relationId}
     */
    deleteCompanyByCompanyIdMembersByRelationId: (
      companyId: number,
      relationId: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/members/${relationId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name GetCompanyByCompanyIdAgent
     * @summary List all agents
     * @request GET:/company/{companyId}/agent
     */
    getCompanyByCompanyIdAgent: (
      companyId: number,
      query?: {
        /** Filter by whether the listed agents are sub-agents. Accepts true or false. */
        subAgents?: boolean;
        /**
         * Filter by parent agent ID when listing sub-agents. Must be a positive integer.
         * @min 1
         */
        parentAgentId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a new agent via multipart/form-data. Avatar fields: - `avatarFile` is optional. If provided, the server uploads it as a File and writes `avatarFileId` atomically with Agent creation. Sandbox fields: - `sandboxType` controls whether the task runs directly (`NONE`) or in Docker (`DOCKER`). - `containerImage` is optional and only used when `sandboxType=DOCKER`. - `autoStoreSandboxContext` (boolean, default: false) automatically runs `docker commit` before sandbox cleanup if the sandbox supports it. When enabled, the persisted image name is written back to `containerImage` so the next task run resumes from the saved state. - `sandboxStartupArguments` is optional and appended to `docker run` before the image name. - If `containerImage` is omitted for Docker sandboxes, the runtime default image is `alpine:latest`.
     *
     * @tags Agent
     * @name PostCompanyByCompanyIdAgent
     * @summary Create a new agent
     * @request POST:/company/{companyId}/agent
     */
    postCompanyByCompanyIdAgent: (
      companyId: number,
      data: {
        /** @minLength 1 */
        name: string;
        extraPrompt?: string;
        /** Send empty string to clear capacity */
        capacity?: string | null;
        /** @minLength 1 */
        model?: string;
        sandboxType?: "NONE" | "DOCKER";
        /** @minLength 1 */
        containerImage?: string;
        autoStoreSandboxContext?: boolean;
        sandboxStartupArguments?: string;
        /** @min 1 */
        modelConnectorId: number;
        /**
         * Optional avatar image file
         * @format binary
         */
        avatarFile?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/agent`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name GetCompanyByCompanyIdAgentById
     * @summary Get an agent by ID
     * @request GET:/company/{companyId}/agent/{id}
     */
    getCompanyByCompanyIdAgentById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentResponse, ErrorResponse>({
        path: `/company/${companyId}/agent/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Updates an existing agent via multipart/form-data. Avatar fields: - `avatarFile` is optional. If provided, the server uploads it as a File and updates `avatarFileId` in the same database transaction as other Agent updates. Sandbox fields: - `sandboxType` toggles sandbox mode. - `containerImage` updates the Docker image name used by future task runs. - `autoStoreSandboxContext` toggles auto-persist: when true, the sandbox is committed before cleanup and `containerImage` is updated to the resulting image. - `sandboxStartupArguments` updates additional `docker run` arguments used by future task runs. - Set `containerImage` only when Docker sandboxing is desired.
     *
     * @tags Agent
     * @name PutCompanyByCompanyIdAgentById
     * @summary Update an agent
     * @request PUT:/company/{companyId}/agent/{id}
     */
    putCompanyByCompanyIdAgentById: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        name?: string;
        /** Send empty string to clear extra instructions/workflow */
        extraPrompt?: string | null;
        /** Send empty string to clear capacity */
        capacity?: string | null;
        /** @minLength 1 */
        model?: string;
        sandboxType?: "NONE" | "DOCKER";
        /** @minLength 1 */
        containerImage?: string;
        autoStoreSandboxContext?: boolean;
        sandboxStartupArguments?: string;
        /** @min 1 */
        modelConnectorId?: number;
        /**
         * Optional avatar image file
         * @format binary
         */
        avatarFile?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentResponse, ErrorResponse>({
        path: `/company/${companyId}/agent/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name DeleteCompanyByCompanyIdAgentById
     * @summary Delete an agent
     * @request DELETE:/company/{companyId}/agent/{id}
     */
    deleteCompanyByCompanyIdAgentById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/agent/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a new task for an agent. Notify stack fields: - `notifies` is an ordered stack where the last entry is processed first. - `notifyOnSuccessBottomOnly` only applies when the current notify entry is at the stack bottom. - `notifyOnFailureBottomOnly` only applies when the current notify entry is at the stack bottom. - Non-bottom notify entries always notify, regardless of task success or failure.
     *
     * @tags Task
     * @name PostCompanyByCompanyIdAgentByIdTasks
     * @summary Create a task for an agent. `notifies` is an ordered stack where the last entry is processed first. `notifyOnSuccessBottomOnly` and `notifyOnFailureBottomOnly` only apply when the current notify entry is at the stack bottom; non-bottom entries always notify.
     * @request POST:/company/{companyId}/agent/{id}/tasks
     */
    postCompanyByCompanyIdAgentByIdTasks: (
      companyId: number,
      id: number,
      data: {
        /** @min 0 */
        taskId?: number | null;
        /** @minLength 1 */
        content: string;
        /** @minLength 1 */
        ac?: string | null;
        state?:
          | "PENDING"
          | "ACTIVE"
          | "FAILED"
          | "FINISHED"
          | "CANCELLED"
          | "TRANSFERRED"
          | null;
        /** Ordered notify stack. The last entry is processed first. BottomOnly flags are only honored when the current entry is the stack bottom; non-bottom entries always notify. */
        notifies?: {
          /** Notify an agent target. */
          type: "agent";
          /**
           * Target agent ID.
           * @min 0
           */
          agentId: number;
          /** Only effective when this notify entry is at the stack bottom. If true, a successful submission creates a notify task. */
          notifyOnSuccessBottomOnly?: boolean | null;
          /** Only effective when this notify entry is at the stack bottom. If true, a failed submission creates a notify task. */
          notifyOnFailureBottomOnly?: boolean | null;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/agent/${id}/tasks`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name GetCompanyByCompanyIdAgentByIdTasks
     * @summary List tasks for an agent
     * @request GET:/company/{companyId}/agent/{id}/tasks
     */
    getCompanyByCompanyIdAgentByIdTasks: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent/${id}/tasks`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Starts queued tasks for the agent. When `sandboxType=DOCKER`, task commands run inside a container created from `containerImage`. When configured, `sandboxStartupArguments` are injected into `docker run` before the image name. If no `containerImage` is configured, `alpine:latest` is used by default.
     *
     * @tags Agent
     * @name PostCompanyByCompanyIdAgentByIdRun
     * @summary Run agent task queue
     * @request POST:/company/{companyId}/agent/{id}/run
     */
    postCompanyByCompanyIdAgentByIdRun: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentRunResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/agent/${id}/run`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorDockerAvailability
     * @summary Check whether Docker is available
     * @request GET:/company/{companyId}/model-connector/docker/availability
     */
    getCompanyByCompanyIdModelConnectorDockerAvailability: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<DockerAvailabilityResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/docker/availability`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorDockerImages
     * @summary List local Docker images with pagination
     * @request GET:/company/{companyId}/model-connector/docker/images
     */
    getCompanyByCompanyIdModelConnectorDockerImages: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<DockerLocalImagePageResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/docker/images`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name DeleteCompanyByCompanyIdModelConnectorDockerImages
     * @summary Delete a local Docker image
     * @request DELETE:/company/{companyId}/model-connector/docker/images
     */
    deleteCompanyByCompanyIdModelConnectorDockerImages: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<DockerPullResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/docker/images`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name PostCompanyByCompanyIdModelConnectorDockerPull
     * @summary Pull a Docker image
     * @request POST:/company/{companyId}/model-connector/docker/pull
     */
    postCompanyByCompanyIdModelConnectorDockerPull: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<DockerPullResponse, ValidationErrorResponse | ErrorResponse>(
        {
          path: `/company/${companyId}/model-connector/docker/pull`,
          method: "POST",
          format: "json",
          ...params,
        },
      ),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorCommandProgress
     * @summary GET /company/{companyId}/model-connector/command-progress
     * @request GET:/company/{companyId}/model-connector/command-progress
     */
    getCompanyByCompanyIdModelConnectorCommandProgress: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<AIModelConnectorResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/command-progress`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorDockerSearch
     * @summary Search Docker Hub images
     * @request GET:/company/{companyId}/model-connector/docker/search
     */
    getCompanyByCompanyIdModelConnectorDockerSearch: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<DockerHubImagePageResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/docker/search`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorTypes
     * @summary Get supported AI model connector types
     * @request GET:/company/{companyId}/model-connector/types
     */
    getCompanyByCompanyIdModelConnectorTypes: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<ModelTypesResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/types`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorCatalogByType
     * @summary Get available model names by provider type
     * @request GET:/company/{companyId}/model-connector/catalog/{type}
     */
    getCompanyByCompanyIdModelConnectorCatalogByType: (
      companyId: number,
      type: string,
      params: RequestParams = {},
    ) =>
      this.request<ModelCatalogResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/catalog/${type}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnector
     * @summary List all AI model connectors
     * @request GET:/company/{companyId}/model-connector
     */
    getCompanyByCompanyIdModelConnector: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<AIModelConnectorPageResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name PostCompanyByCompanyIdModelConnector
     * @summary Create a new AI model connector
     * @request POST:/company/{companyId}/model-connector
     */
    postCompanyByCompanyIdModelConnector: (
      companyId: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<
        AIModelConnectorResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/model-connector`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetCompanyByCompanyIdModelConnectorById
     * @summary Get an AI model connector by ID
     * @request GET:/company/{companyId}/model-connector/{id}
     */
    getCompanyByCompanyIdModelConnectorById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AIModelConnectorResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name PutCompanyByCompanyIdModelConnectorById
     * @summary Update an AI model connector
     * @request PUT:/company/{companyId}/model-connector/{id}
     */
    putCompanyByCompanyIdModelConnectorById: (
      companyId: number,
      id: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<AIModelConnectorResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name DeleteCompanyByCompanyIdModelConnectorById
     * @summary Delete an AI model connector
     * @request DELETE:/company/{companyId}/model-connector/{id}
     */
    deleteCompanyByCompanyIdModelConnectorById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/model-connector/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name GetCompanyByCompanyIdSubagent
     * @summary List all sub-agent relationships
     * @request GET:/company/{companyId}/subagent
     */
    getCompanyByCompanyIdSubagent: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<SubAgentPageResponse, ErrorResponse>({
        path: `/company/${companyId}/subagent`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name PostCompanyByCompanyIdSubagent
     * @summary Link an existing agent as a sub-agent
     * @request POST:/company/{companyId}/subagent
     */
    postCompanyByCompanyIdSubagent: (
      companyId: number,
      data: {
        /** @min 0 */
        agentId: number;
        /** @min 0 */
        parentAgentId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<SubAgentResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/subagent`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name GetCompanyByCompanyIdSubagentById
     * @summary Get a sub-agent relationship by ID
     * @request GET:/company/{companyId}/subagent/{id}
     */
    getCompanyByCompanyIdSubagentById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SubAgentResponse, ErrorResponse>({
        path: `/company/${companyId}/subagent/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name PutCompanyByCompanyIdSubagentById
     * @summary Update a sub-agent relationship
     * @request PUT:/company/{companyId}/subagent/{id}
     */
    putCompanyByCompanyIdSubagentById: (
      companyId: number,
      id: number,
      data: {
        /** @min 0 */
        agentId?: number | null;
        /** @min 0 */
        parentAgentId?: number | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<SubAgentResponse, ErrorResponse>({
        path: `/company/${companyId}/subagent/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name DeleteCompanyByCompanyIdSubagentById
     * @summary Delete a sub-agent relationship
     * @request DELETE:/company/{companyId}/subagent/{id}
     */
    deleteCompanyByCompanyIdSubagentById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/subagent/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name GetCompanyByCompanyIdSubagentParentByParentAgentId
     * @summary List sub-agent relationships by parent agent ID
     * @request GET:/company/{companyId}/subagent/parent/{parentAgentId}
     */
    getCompanyByCompanyIdSubagentParentByParentAgentId: (
      companyId: number,
      parentAgentId: number,
      params: RequestParams = {},
    ) =>
      this.request<SubAgentPageResponse, ErrorResponse>({
        path: `/company/${companyId}/subagent/parent/${parentAgentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Transactionally creates a new Agent and registers it as a sub-agent of the specified parent. Both rows (Agent + SubAgent) are committed atomically. If either fails, neither is persisted. Agent fields: - `name`, `modelConnectorId` are required. - `sandboxType` defaults to `NONE`. Set `containerImage` only when using `DOCKER`.
     *
     * @tags SubAgent
     * @name PostCompanyByCompanyIdSubagentWithAgent
     * @summary Transactionally create a new agent and register it as a sub-agent
     * @request POST:/company/{companyId}/subagent/with-agent
     */
    postCompanyByCompanyIdSubagentWithAgent: (
      companyId: number,
      data: {
        /** @min 0 */
        parentAgentId: number;
        /** @minLength 1 */
        name: string;
        /** @min 0 */
        modelConnectorId: number;
        extraPrompt?: string | null;
        capacity?: string | null;
        /** @minLength 1 */
        model?: string | null;
        sandboxType?: "NONE" | "DOCKER" | null;
        /** @minLength 1 */
        containerImage?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        CreateSubAgentWithAgentResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/subagent/with-agent`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat History
     * @name GetCompanyByCompanyIdChatHistoryById
     * @summary Get a chat history record by ID
     * @request GET:/company/{companyId}/chat-history/{id}
     */
    getCompanyByCompanyIdChatHistoryById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<ChatHistoryResponse, ErrorResponse>({
        path: `/company/${companyId}/chat-history/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns paginated chat history for a task over plain HTTP pagination. Pagination: - `page` defaults to 1. - `pageSize` defaults to 20. - `reverse` defaults to false. - When `reverse=true`, results are ordered by `createdAt` descending. - When `reverse=false`, results are ordered by `createdAt` ascending.
     *
     * @tags Chat History
     * @name GetCompanyByCompanyIdChatHistoryAgentTaskByAgentTaskId
     * @summary List chat history records for an agent task with pagination
     * @request GET:/company/{companyId}/chat-history/agent-task/{agentTaskId}
     */
    getCompanyByCompanyIdChatHistoryAgentTaskByAgentTaskId: (
      companyId: number,
      agentTaskId: number,
      query?: {
        /**
         * 1-based page number.
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Number of records returned per page.
         * @min 1
         * @default 20
         */
        pageSize?: number;
        /**
         * When true, returns newest records first.
         * @default false
         */
        reverse?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ChatHistoryPageResponse, ErrorResponse>({
        path: `/company/${companyId}/chat-history/agent-task/${agentTaskId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name GetCompanyByCompanyIdMcpServer
     * @summary List all MCP servers
     * @request GET:/company/{companyId}/mcp-server
     */
    getCompanyByCompanyIdMcpServer: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<MCPServerPageResponse, ErrorResponse>({
        path: `/company/${companyId}/mcp-server`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name PostCompanyByCompanyIdMcpServer
     * @summary Create a new MCP server
     * @request POST:/company/{companyId}/mcp-server
     */
    postCompanyByCompanyIdMcpServer: (
      companyId: number,
      data: {
        /** @minLength 1 */
        name?: string | null;
        description?: string | null;
        type: "HTTP" | "STDIO";
        /** @format uri */
        url?: string | null;
        /** @minLength 1 */
        command?: string | null;
        commandArguments?: string | null;
        headers?: {
          toolList?: {
            type: "function";
            function: {
              /** @minLength 1 */
              name: string;
              description?: string | null;
              parameters?: Record<string, any>;
            };
            metadata?: object | null;
          }[];
        };
        envs?: object | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<MCPServerResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/mcp-server`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name GetCompanyByCompanyIdMcpServerById
     * @summary Get an MCP server by ID
     * @request GET:/company/{companyId}/mcp-server/{id}
     */
    getCompanyByCompanyIdMcpServerById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<MCPServerResponse, ErrorResponse>({
        path: `/company/${companyId}/mcp-server/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name PutCompanyByCompanyIdMcpServerById
     * @summary Update an MCP server
     * @request PUT:/company/{companyId}/mcp-server/{id}
     */
    putCompanyByCompanyIdMcpServerById: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        name?: string | null;
        description?: string | null;
        type?: "HTTP" | "STDIO" | null;
        /** @format uri */
        url?: string | null;
        /** @minLength 1 */
        command?: string | null;
        commandArguments?: string | null;
        headers?: {
          toolList?: {
            type: "function";
            function: {
              /** @minLength 1 */
              name: string;
              description?: string | null;
              parameters?: Record<string, any>;
            };
            metadata?: object | null;
          }[];
        };
        envs?: object | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<MCPServerResponse, ErrorResponse>({
        path: `/company/${companyId}/mcp-server/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name DeleteCompanyByCompanyIdMcpServerById
     * @summary Delete an MCP server
     * @request DELETE:/company/{companyId}/mcp-server/{id}
     */
    deleteCompanyByCompanyIdMcpServerById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/mcp-server/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent MCP Server
     * @name GetCompanyByCompanyIdAgentMcpServer
     * @summary List all agent MCP server assignments
     * @request GET:/company/{companyId}/agent-mcp-server
     */
    getCompanyByCompanyIdAgentMcpServer: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentMcpServerRelationPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-mcp-server`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent MCP Server
     * @name PostCompanyByCompanyIdAgentMcpServer
     * @summary Assign an MCP server to an agent
     * @request POST:/company/{companyId}/agent-mcp-server
     */
    postCompanyByCompanyIdAgentMcpServer: (
      companyId: number,
      data: {
        /** @min 0 */
        agentId: number;
        /** @min 0 */
        mcpServerId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AgentMcpServerRelationResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-mcp-server`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent MCP Server
     * @name GetCompanyByCompanyIdAgentMcpServerAgentByAgentId
     * @summary List MCP servers assigned to an agent
     * @request GET:/company/{companyId}/agent-mcp-server/agent/{agentId}
     */
    getCompanyByCompanyIdAgentMcpServerAgentByAgentId: (
      companyId: number,
      agentId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentMcpServerRelationPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-mcp-server/agent/${agentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent MCP Server
     * @name GetCompanyByCompanyIdAgentMcpServerById
     * @summary Get an agent MCP server assignment by ID
     * @request GET:/company/{companyId}/agent-mcp-server/{id}
     */
    getCompanyByCompanyIdAgentMcpServerById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentMcpServerRelationResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-mcp-server/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent MCP Server
     * @name DeleteCompanyByCompanyIdAgentMcpServerById
     * @summary Remove an MCP server from an agent
     * @request DELETE:/company/{companyId}/agent-mcp-server/{id}
     */
    deleteCompanyByCompanyIdAgentMcpServerById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-mcp-server/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name GetCompanyByCompanyIdAgentTaskById
     * @summary Get an agent task by ID
     * @request GET:/company/{companyId}/agent-task/{id}
     */
    getCompanyByCompanyIdAgentTaskById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-task/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Updates an existing agent task. Notify stack fields: - `notifies` is an ordered stack where the last entry is processed first. - BottomOnly notify flags are only honored when the current notify entry is the stack bottom.
     *
     * @tags Agent Task
     * @name PutCompanyByCompanyIdAgentTaskById
     * @summary Update an agent task. `notifies` is an ordered stack where the last entry is processed first. BottomOnly notify flags only apply when the current notify entry is the stack bottom.
     * @request PUT:/company/{companyId}/agent-task/{id}
     */
    putCompanyByCompanyIdAgentTaskById: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        content?: string | null;
        /** @minLength 1 */
        ac?: string | null;
        state?:
          | "PENDING"
          | "ACTIVE"
          | "FAILED"
          | "FINISHED"
          | "CANCELLED"
          | "TRANSFERRED"
          | null;
        /** Ordered notify stack. The last entry is processed first. BottomOnly flags are only honored when the current entry is the stack bottom; non-bottom entries always notify. */
        notifies?: {
          /** Notify an agent target. */
          type: "agent";
          /**
           * Target agent ID.
           * @min 0
           */
          agentId: number;
          /** Only effective when this notify entry is at the stack bottom. If true, a successful submission creates a notify task. */
          notifyOnSuccessBottomOnly?: boolean | null;
          /** Only effective when this notify entry is at the stack bottom. If true, a failed submission creates a notify task. */
          notifyOnFailureBottomOnly?: boolean | null;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-task/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name DeleteCompanyByCompanyIdAgentTaskById
     * @summary Delete an agent task
     * @request DELETE:/company/{companyId}/agent-task/{id}
     */
    deleteCompanyByCompanyIdAgentTaskById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-task/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostCompanyByCompanyIdAgentTaskByIdRun
     * @summary Run an agent task with priority
     * @request POST:/company/{companyId}/agent-task/{id}/run
     */
    postCompanyByCompanyIdAgentTaskByIdRun: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-task/${id}/run`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostCompanyByCompanyIdAgentTaskByIdRetry
     * @summary Retry an agent task (including finished tasks)
     * @request POST:/company/{companyId}/agent-task/{id}/retry
     */
    postCompanyByCompanyIdAgentTaskByIdRetry: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-task/${id}/retry`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostCompanyByCompanyIdAgentTaskByIdRetryContinue
     * @summary Continue an agent task without clearing chat history (optional new user message)
     * @request POST:/company/{companyId}/agent-task/{id}/retry-continue
     */
    postCompanyByCompanyIdAgentTaskByIdRetryContinue: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        message?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-task/${id}/retry-continue`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostCompanyByCompanyIdAgentTaskByIdStop
     * @summary Stop (cancel) an agent task
     * @request POST:/company/{companyId}/agent-task/{id}/stop
     */
    postCompanyByCompanyIdAgentTaskByIdStop: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-task/${id}/stop`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns paginated comments for an agent task. Pagination: - `page` defaults to 1. - `pageSize` defaults to 20. - Results are ordered by `createdAt` descending.
     *
     * @tags Agent Task
     * @name GetCompanyByCompanyIdAgentTaskByIdComments
     * @summary List comments for an agent task
     * @request GET:/company/{companyId}/agent-task/{id}/comments
     */
    getCompanyByCompanyIdAgentTaskByIdComments: (
      companyId: number,
      id: number,
      query?: {
        /**
         * 1-based page number.
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Number of comments returned per page.
         * @min 1
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskCommentPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-task/${id}/comments`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a comment for the target agent task. Body fields: - `content` is required.
     *
     * @tags Agent Task
     * @name PostCompanyByCompanyIdAgentTaskByIdComments
     * @summary Create an agent task comment
     * @request POST:/company/{companyId}/agent-task/{id}/comments
     */
    postCompanyByCompanyIdAgentTaskByIdComments: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        content: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AgentTaskCommentResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-task/${id}/comments`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PutCompanyByCompanyIdAgentTaskCommentsByCommentId
     * @summary Update an agent task comment
     * @request PUT:/company/{companyId}/agent-task/comments/{commentId}
     */
    putCompanyByCompanyIdAgentTaskCommentsByCommentId: (
      companyId: number,
      commentId: number,
      data: {
        /** @minLength 1 */
        content: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskCommentResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-task/comments/${commentId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name DeleteCompanyByCompanyIdAgentTaskCommentsByCommentId
     * @summary Delete an agent task comment
     * @request DELETE:/company/{companyId}/agent-task/comments/{commentId}
     */
    deleteCompanyByCompanyIdAgentTaskCommentsByCommentId: (
      companyId: number,
      commentId: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-task/comments/${commentId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name GetCompanyByCompanyIdAgentFilePermission
     * @summary List all agent file permissions
     * @request GET:/company/{companyId}/agent-file-permission
     */
    getCompanyByCompanyIdAgentFilePermission: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentFilePermissionPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-file-permission`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name PostCompanyByCompanyIdAgentFilePermission
     * @summary Create an agent file permission
     * @request POST:/company/{companyId}/agent-file-permission
     */
    postCompanyByCompanyIdAgentFilePermission: (
      companyId: number,
      data: {
        /** @min 0 */
        agentId: number;
        /** @minLength 1 */
        path: string;
        /** @minLength 1 */
        mountPath: string;
        enabled?: boolean | null;
        writable?: boolean | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AgentFilePermissionResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-file-permission`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name GetCompanyByCompanyIdAgentFilePermissionAgentByAgentId
     * @summary List file permissions assigned to an agent
     * @request GET:/company/{companyId}/agent-file-permission/agent/{agentId}
     */
    getCompanyByCompanyIdAgentFilePermissionAgentByAgentId: (
      companyId: number,
      agentId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentFilePermissionPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-file-permission/agent/${agentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name GetCompanyByCompanyIdAgentFilePermissionById
     * @summary Get an agent file permission by ID
     * @request GET:/company/{companyId}/agent-file-permission/{id}
     */
    getCompanyByCompanyIdAgentFilePermissionById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentFilePermissionResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-file-permission/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name PutCompanyByCompanyIdAgentFilePermissionById
     * @summary Update an agent file permission
     * @request PUT:/company/{companyId}/agent-file-permission/{id}
     */
    putCompanyByCompanyIdAgentFilePermissionById: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        path?: string | null;
        /** @minLength 1 */
        mountPath?: string | null;
        enabled?: boolean | null;
        writable?: boolean | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentFilePermissionResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-file-permission/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name DeleteCompanyByCompanyIdAgentFilePermissionById
     * @summary Delete an agent file permission
     * @request DELETE:/company/{companyId}/agent-file-permission/{id}
     */
    deleteCompanyByCompanyIdAgentFilePermissionById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-file-permission/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name GetCompanyByCompanyIdFile
     * @summary List file metadata for current user
     * @request GET:/company/{companyId}/file
     */
    getCompanyByCompanyIdFile: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<FilePageResponse, ErrorResponse>({
        path: `/company/${companyId}/file`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name GetCompanyByCompanyIdFileById
     * @summary Get file metadata by ID
     * @request GET:/company/{companyId}/file/{id}
     */
    getCompanyByCompanyIdFileById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<FileResponse, ErrorResponse>({
        path: `/company/${companyId}/file/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name DeleteCompanyByCompanyIdFileById
     * @summary Delete file metadata and object
     * @request DELETE:/company/{companyId}/file/{id}
     */
    deleteCompanyByCompanyIdFileById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/file/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description Batch uploads file content to MinIO and stores metadata in the File table. Supported content types: - application/json: send { files: [{ fileName, contentBase64, contentType?, filePath? }] } - multipart/form-data: send one or more files in files field and optional repeated filePath fields by index Storage strategy: - bucket name: company-{companyId} - object key: flat UUID
     *
     * @tags File
     * @name PostCompanyByCompanyIdFileUpload
     * @summary Batch upload files to MinIO and create file metadata
     * @request POST:/company/{companyId}/file/upload
     */
    postCompanyByCompanyIdFileUpload: (
      companyId: number,
      data: {
        files: {
          /** @minLength 1 */
          fileName: string;
          contentBase64: string;
          contentType?: string | null;
          /** @minLength 1 */
          filePath?: string | null;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<FileResponse[], ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/file/upload`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Downloads object bytes from MinIO by File metadata id. Returns binary stream with Content-Type and Content-Disposition headers.
     *
     * @tags File
     * @name GetCompanyByCompanyIdFileByIdDownload
     * @summary Download file object content by metadata ID
     * @request GET:/company/{companyId}/file/{id}/download
     */
    getCompanyByCompanyIdFileByIdDownload: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<File, ErrorResponse>({
        path: `/company/${companyId}/file/${id}/download`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name GetCompanyByCompanyIdFileList
     * @summary List all file lists
     * @request GET:/company/{companyId}/file-list
     */
    getCompanyByCompanyIdFileList: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<FileListPageResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name PostCompanyByCompanyIdFileList
     * @summary Create a new file list
     * @request POST:/company/{companyId}/file-list
     */
    postCompanyByCompanyIdFileList: (
      companyId: number,
      data: {
        fileIds?: number[] | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<FileListResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/file-list`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name GetCompanyByCompanyIdFileListById
     * @summary Get a file list by ID
     * @request GET:/company/{companyId}/file-list/{id}
     */
    getCompanyByCompanyIdFileListById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<FileListResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name PutCompanyByCompanyIdFileListById
     * @summary Update a file list
     * @request PUT:/company/{companyId}/file-list/{id}
     */
    putCompanyByCompanyIdFileListById: (
      companyId: number,
      id: number,
      data: {
        fileIds?: number[] | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<FileListResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name DeleteCompanyByCompanyIdFileListById
     * @summary Delete a file list
     * @request DELETE:/company/{companyId}/file-list/{id}
     */
    deleteCompanyByCompanyIdFileListById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name GetCompanyByCompanyIdFileListByListIdFiles
     * @summary List files in a file list
     * @request GET:/company/{companyId}/file-list/{listId}/files
     */
    getCompanyByCompanyIdFileListByListIdFiles: (
      companyId: number,
      listId: number,
      params: RequestParams = {},
    ) =>
      this.request<FileListFilePageResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list/${listId}/files`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name PostCompanyByCompanyIdFileListByListIdFiles
     * @summary Add a file to a file list
     * @request POST:/company/{companyId}/file-list/{listId}/files
     */
    postCompanyByCompanyIdFileListByListIdFiles: (
      companyId: number,
      listId: number,
      data: {
        /** @min 0 */
        fileId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        FileListFileResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/file-list/${listId}/files`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name GetCompanyByCompanyIdFileListByListIdFilesByEntryId
     * @summary Get a file list entry by ID
     * @request GET:/company/{companyId}/file-list/{listId}/files/{entryId}
     */
    getCompanyByCompanyIdFileListByListIdFilesByEntryId: (
      companyId: number,
      listId: number,
      entryId: number,
      params: RequestParams = {},
    ) =>
      this.request<FileListFileResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list/${listId}/files/${entryId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File List
     * @name DeleteCompanyByCompanyIdFileListByListIdFilesByEntryId
     * @summary Remove a file from a file list
     * @request DELETE:/company/{companyId}/file-list/{listId}/files/{entryId}
     */
    deleteCompanyByCompanyIdFileListByListIdFilesByEntryId: (
      companyId: number,
      listId: number,
      entryId: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/file-list/${listId}/files/${entryId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Skill
     * @name GetCompanyByCompanyIdSkill
     * @summary List all skills
     * @request GET:/company/{companyId}/skill
     */
    getCompanyByCompanyIdSkill: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<SkillPageResponse, ErrorResponse>({
        path: `/company/${companyId}/skill`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a new skill via multipart/form-data. File upload fields: - `files`: optional array of binary file entries extracted from a ZIP archive. - `filePath`: optional parallel string array with the relative path for each file. When no files are provided, a default SKILL.md placeholder is created automatically. When files are provided, they are stored under /skills/{skillId}/ and linked to the skill's file list.
     *
     * @tags Skill
     * @name PostCompanyByCompanyIdSkill
     * @summary Create a new skill
     * @request POST:/company/{companyId}/skill
     */
    postCompanyByCompanyIdSkill: (
      companyId: number,
      data: {
        /** @minLength 1 */
        name: string;
        description?: string;
        /** Optional skill files extracted from a ZIP archive */
        files?: File[];
        /** Relative path for each corresponding file entry (parallel array with files) */
        filePath?: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<SkillResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/skill`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Skill
     * @name GetCompanyByCompanyIdSkillById
     * @summary Get a skill by ID
     * @request GET:/company/{companyId}/skill/{id}
     */
    getCompanyByCompanyIdSkillById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SkillResponse, ErrorResponse>({
        path: `/company/${companyId}/skill/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Updates an existing skill via multipart/form-data. File upload fields: - `files`: optional array of binary file entries. When provided, replaces all existing files in the skill's file list. - `filePath`: optional parallel string array with the relative path for each file. Name and description updates are applied regardless of whether files are provided.
     *
     * @tags Skill
     * @name PutCompanyByCompanyIdSkillById
     * @summary Update a skill
     * @request PUT:/company/{companyId}/skill/{id}
     */
    putCompanyByCompanyIdSkillById: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        name?: string;
        description?: string;
        /** Optional replacement skill files. When provided, replaces all existing files in the skill's file list. */
        files?: File[];
        /** Relative path for each corresponding file entry (parallel array with files) */
        filePath?: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<SkillResponse, ErrorResponse>({
        path: `/company/${companyId}/skill/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Skill
     * @name DeleteCompanyByCompanyIdSkillById
     * @summary Delete a skill
     * @request DELETE:/company/{companyId}/skill/{id}
     */
    deleteCompanyByCompanyIdSkillById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/skill/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description Downloads all files of a skill as JSON payload for frontend packaging. Response fields: - `skillId`, `skillName`: skill metadata. - `files[]`: list of file entries with `filePath`, optional `contentType`, and `contentBase64`. Frontend should decode `contentBase64` and package files as ZIP using JSZip. Returns 404 if the skill has no files.
     *
     * @tags Skill
     * @name GetCompanyByCompanyIdSkillByIdDownload
     * @summary Download skill files payload for frontend ZIP packaging
     * @request GET:/company/{companyId}/skill/{id}/download
     */
    getCompanyByCompanyIdSkillByIdDownload: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SkillDownloadFilesResponse, ErrorResponse>({
        path: `/company/${companyId}/skill/${id}/download`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name GetCompanyByCompanyIdTask
     * @summary List all tasks
     * @request GET:/company/{companyId}/task
     */
    getCompanyByCompanyIdTask: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<TaskPageResponse, ErrorResponse>({
        path: `/company/${companyId}/task`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name PostCompanyByCompanyIdTask
     * @summary Create a new task
     * @request POST:/company/{companyId}/task
     */
    postCompanyByCompanyIdTask: (
      companyId: number,
      data: {
        /** @minLength 1 */
        content: string;
        autoAssign?: boolean;
        /** @min 1 */
        agentId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<TaskResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/task`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name GetCompanyByCompanyIdTaskById
     * @summary Get a task by ID
     * @request GET:/company/{companyId}/task/{id}
     */
    getCompanyByCompanyIdTaskById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<TaskResponse, ErrorResponse>({
        path: `/company/${companyId}/task/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name PutCompanyByCompanyIdTaskById
     * @summary Update a task
     * @request PUT:/company/{companyId}/task/{id}
     */
    putCompanyByCompanyIdTaskById: (
      companyId: number,
      id: number,
      data: {
        /** @minLength 1 */
        content?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<TaskResponse, ErrorResponse>({
        path: `/company/${companyId}/task/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name DeleteCompanyByCompanyIdTaskById
     * @summary Delete a task
     * @request DELETE:/company/{companyId}/task/{id}
     */
    deleteCompanyByCompanyIdTaskById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/task/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name PostCompanyByCompanyIdTaskByIdAssign
     * @summary Assign or auto-assign an existing task
     * @request POST:/company/{companyId}/task/{id}/assign
     */
    postCompanyByCompanyIdTaskByIdAssign: (
      companyId: number,
      id: number,
      data: {
        autoAssign?: boolean;
        /** @min 1 */
        agentId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/company/${companyId}/task/${id}/assign`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Skill Relation
     * @name GetCompanyByCompanyIdAgentSkillRelation
     * @summary List all agent skill assignments
     * @request GET:/company/{companyId}/agent-skill-relation
     */
    getCompanyByCompanyIdAgentSkillRelation: (
      companyId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentSkillRelationPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-skill-relation`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Skill Relation
     * @name PostCompanyByCompanyIdAgentSkillRelation
     * @summary Assign a skill to an agent
     * @request POST:/company/{companyId}/agent-skill-relation
     */
    postCompanyByCompanyIdAgentSkillRelation: (
      companyId: number,
      data: {
        /** @min 0 */
        agentId: number;
        /** @min 0 */
        skillId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AgentSkillRelationResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/agent-skill-relation`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Skill Relation
     * @name GetCompanyByCompanyIdAgentSkillRelationAgentByAgentId
     * @summary List skills assigned to an agent
     * @request GET:/company/{companyId}/agent-skill-relation/agent/{agentId}
     */
    getCompanyByCompanyIdAgentSkillRelationAgentByAgentId: (
      companyId: number,
      agentId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentSkillRelationPageResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-skill-relation/agent/${agentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Skill Relation
     * @name GetCompanyByCompanyIdAgentSkillRelationById
     * @summary Get an agent skill assignment by ID
     * @request GET:/company/{companyId}/agent-skill-relation/{id}
     */
    getCompanyByCompanyIdAgentSkillRelationById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentSkillRelationResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-skill-relation/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Skill Relation
     * @name DeleteCompanyByCompanyIdAgentSkillRelationById
     * @summary Remove a skill from an agent
     * @request DELETE:/company/{companyId}/agent-skill-relation/{id}
     */
    deleteCompanyByCompanyIdAgentSkillRelationById: (
      companyId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/company/${companyId}/agent-skill-relation/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notification
     * @name GetCompanyByCompanyIdNotification
     * @summary List notifications with pagination and pending filter
     * @request GET:/company/{companyId}/notification
     */
    getCompanyByCompanyIdNotification: (
      companyId: number,
      query?: {
        /**
         * 1-based page number.
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Number of records returned per page.
         * @min 1
         * @default 20
         */
        pageSize?: number;
        /** Filter by pending state. true returns only pending notifications, false returns only non-pending notifications. */
        pending?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<NotificationPageResponse, ErrorResponse>({
        path: `/company/${companyId}/notification`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notification
     * @name PostCompanyByCompanyIdNotificationByIdResolve
     * @summary POST /company/{companyId}/notification/{id}/resolve
     * @request POST:/company/{companyId}/notification/{id}/resolve
     */
    postCompanyByCompanyIdNotificationByIdResolve: (
      companyId: number,
      id: number,
      data:
        | {
            type: "REQUEST_INPUT";
            /** @minLength 1 */
            value: string;
          }
        | {
            type: "REQUEST_SELECT_SINGLE";
            /** @minLength 1 */
            value: string;
          }
        | {
            type: "REQUEST_SELECT_MULTI";
            value: string[];
          }
        | {
            type: "REQUEST_CONFIRM";
            value: boolean;
          }
        | {
            type: "AGENT_TASK_RESULT";
            value: boolean;
          },
      params: RequestParams = {},
    ) =>
      this.request<
        NotificationResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/company/${companyId}/notification/${id}/resolve`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
