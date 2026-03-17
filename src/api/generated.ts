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
}

export interface AuthResponse {
  user: SafeUserResponse;
  token: string;
}

export interface ModelTypesResponse {
  types: string[];
}

export interface ModelCatalogResponse {
  type: string;
  models: string[];
}

export interface AIModelConnectorResponse {
  id: number;
  name: string;
  type: string;
  params: Record<string, any>;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalTokens?: number;
}

export interface AgentResponse {
  id: number;
  name: string;
  description?: string | null;
  capacity?: string | null;
  model?: string | null;
  userId: number;
  modelConnectorId: number;
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
  durationMs?: number | null;
  extraLogs?: Record<string, any>;
  content: string;
  agentTaskId: number;
  /** @format date-time */
  createdAt: string;
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
}

export type MCPServerHeaders = {
  toolList?: ToolListItem[];
  [key: string]: any;
} | null;

export interface AgentMcpServerRelationResponse {
  id: number;
  agentId: number;
  mcpServerId: number;
  enabled: boolean;
  /** @format date-time */
  assignedAt: string;
  agent?: AgentResponse;
  mcpServer?: MCPServerResponse;
}

export interface AgentFilePermissionResponse {
  id: number;
  userId: number;
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
  };
  agent = {
    /**
     * No description
     *
     * @tags Agent
     * @name GetAgent
     * @summary List all agents
     * @request GET:/agent
     */
    getAgent: (params: RequestParams = {}) =>
      this.request<AgentResponse[], any>({
        path: `/agent`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name PostAgent
     * @summary Create a new agent
     * @request POST:/agent
     */
    postAgent: (
      data: {
        /** @minLength 1 */
        name: string;
        description?: string | null;
        capacity?: string | null;
        /** @minLength 1 */
        model?: string | null;
        sandboxType?: "NONE" | "DOCKER" | null;
        /** @min 0 */
        modelConnectorId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentResponse, ValidationErrorResponse>({
        path: `/agent`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name GetAgentById
     * @summary Get an agent by ID
     * @request GET:/agent/{id}
     */
    getAgentById: (id: number, params: RequestParams = {}) =>
      this.request<AgentResponse, ErrorResponse>({
        path: `/agent/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name PutAgentById
     * @summary Update an agent
     * @request PUT:/agent/{id}
     */
    putAgentById: (
      id: number,
      data: {
        /** @minLength 1 */
        name?: string | null;
        description?: string | null;
        capacity?: string | null;
        /** @minLength 1 */
        model?: string | null;
        sandboxType?: "NONE" | "DOCKER" | null;
        /** @min 0 */
        modelConnectorId?: number | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentResponse, ErrorResponse>({
        path: `/agent/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name DeleteAgentById
     * @summary Delete an agent
     * @request DELETE:/agent/{id}
     */
    deleteAgentById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/agent/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Task
     * @name PostAgentByIdTasks
     * @summary Create a task for an agent
     * @request POST:/agent/{id}/tasks
     */
    postAgentByIdTasks: (
      id: number,
      data: {
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
          | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/agent/${id}/tasks`,
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
     * @name GetAgentByIdTasks
     * @summary List tasks for an agent
     * @request GET:/agent/{id}/tasks
     */
    getAgentByIdTasks: (id: number, params: RequestParams = {}) =>
      this.request<AgentTaskResponse[], ErrorResponse>({
        path: `/agent/${id}/tasks`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name PostAgentByIdRun
     * @summary Run agent task queue
     * @request POST:/agent/{id}/run
     */
    postAgentByIdRun: (id: number, params: RequestParams = {}) =>
      this.request<AgentRunResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/agent/${id}/run`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  modelConnector = {
    /**
     * No description
     *
     * @tags Model Connector
     * @name GetModelConnectorTypes
     * @summary Get supported AI model connector types
     * @request GET:/model-connector/types
     */
    getModelConnectorTypes: (params: RequestParams = {}) =>
      this.request<ModelTypesResponse, any>({
        path: `/model-connector/types`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetModelConnectorCatalogByType
     * @summary Get available model names by provider type
     * @request GET:/model-connector/catalog/{type}
     */
    getModelConnectorCatalogByType: (
      type: string,
      params: RequestParams = {},
    ) =>
      this.request<ModelCatalogResponse, ErrorResponse>({
        path: `/model-connector/catalog/${type}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name GetModelConnector
     * @summary List all AI model connectors
     * @request GET:/model-connector
     */
    getModelConnector: (params: RequestParams = {}) =>
      this.request<AIModelConnectorResponse[], any>({
        path: `/model-connector`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name PostModelConnector
     * @summary Create a new AI model connector
     * @request POST:/model-connector
     */
    postModelConnector: (data: any, params: RequestParams = {}) =>
      this.request<AIModelConnectorResponse, ValidationErrorResponse>({
        path: `/model-connector`,
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
     * @name GetModelConnectorById
     * @summary Get an AI model connector by ID
     * @request GET:/model-connector/{id}
     */
    getModelConnectorById: (id: number, params: RequestParams = {}) =>
      this.request<AIModelConnectorResponse, ErrorResponse>({
        path: `/model-connector/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model Connector
     * @name PutModelConnectorById
     * @summary Update an AI model connector
     * @request PUT:/model-connector/{id}
     */
    putModelConnectorById: (
      id: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<AIModelConnectorResponse, ErrorResponse>({
        path: `/model-connector/${id}`,
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
     * @name DeleteModelConnectorById
     * @summary Delete an AI model connector
     * @request DELETE:/model-connector/{id}
     */
    deleteModelConnectorById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/model-connector/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  subagent = {
    /**
     * No description
     *
     * @tags SubAgent
     * @name GetSubagent
     * @summary List all sub-agent relationships
     * @request GET:/subagent
     */
    getSubagent: (params: RequestParams = {}) =>
      this.request<SubAgentResponse[], any>({
        path: `/subagent`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name PostSubagent
     * @summary Create a sub-agent relationship
     * @request POST:/subagent
     */
    postSubagent: (
      data: {
        /** @min 0 */
        agentId: number;
        /** @min 0 */
        parentAgentId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<SubAgentResponse, ValidationErrorResponse>({
        path: `/subagent`,
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
     * @name GetSubagentById
     * @summary Get a sub-agent relationship by ID
     * @request GET:/subagent/{id}
     */
    getSubagentById: (id: number, params: RequestParams = {}) =>
      this.request<SubAgentResponse, ErrorResponse>({
        path: `/subagent/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name PutSubagentById
     * @summary Update a sub-agent relationship
     * @request PUT:/subagent/{id}
     */
    putSubagentById: (
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
        path: `/subagent/${id}`,
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
     * @name DeleteSubagentById
     * @summary Delete a sub-agent relationship
     * @request DELETE:/subagent/{id}
     */
    deleteSubagentById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/subagent/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name GetSubagentAgentByAgentId
     * @summary List sub-agent relationships by child agent ID
     * @request GET:/subagent/agent/{agentId}
     */
    getSubagentAgentByAgentId: (agentId: number, params: RequestParams = {}) =>
      this.request<SubAgentResponse[], ErrorResponse>({
        path: `/subagent/agent/${agentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags SubAgent
     * @name GetSubagentParentByParentAgentId
     * @summary List sub-agent relationships by parent agent ID
     * @request GET:/subagent/parent/{parentAgentId}
     */
    getSubagentParentByParentAgentId: (
      parentAgentId: number,
      params: RequestParams = {},
    ) =>
      this.request<SubAgentResponse[], ErrorResponse>({
        path: `/subagent/parent/${parentAgentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  chatHistory = {
    /**
     * No description
     *
     * @tags Chat History
     * @name GetChatHistoryById
     * @summary Get a chat history record by ID
     * @request GET:/chat-history/{id}
     */
    getChatHistoryById: (id: number, params: RequestParams = {}) =>
      this.request<ChatHistoryResponse, ErrorResponse>({
        path: `/chat-history/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat History
     * @name GetChatHistoryAgentTaskByAgentTaskId
     * @summary List chat history records for an agent task
     * @request GET:/chat-history/agent-task/{agentTaskId}
     */
    getChatHistoryAgentTaskByAgentTaskId: (
      agentTaskId: number,
      params: RequestParams = {},
    ) =>
      this.request<ChatHistoryResponse[], ErrorResponse>({
        path: `/chat-history/agent-task/${agentTaskId}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  mcpServer = {
    /**
     * No description
     *
     * @tags MCP Server
     * @name GetMcpServer
     * @summary List all MCP servers
     * @request GET:/mcp-server
     */
    getMcpServer: (params: RequestParams = {}) =>
      this.request<MCPServerResponse[], any>({
        path: `/mcp-server`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name PostMcpServer
     * @summary Create a new MCP server
     * @request POST:/mcp-server
     */
    postMcpServer: (
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
          toolList?: any;
        } | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<MCPServerResponse, ValidationErrorResponse>({
        path: `/mcp-server`,
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
     * @name GetMcpServerById
     * @summary Get an MCP server by ID
     * @request GET:/mcp-server/{id}
     */
    getMcpServerById: (id: number, params: RequestParams = {}) =>
      this.request<MCPServerResponse, ErrorResponse>({
        path: `/mcp-server/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MCP Server
     * @name PutMcpServerById
     * @summary Update an MCP server
     * @request PUT:/mcp-server/{id}
     */
    putMcpServerById: (
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
          toolList?: any;
        } | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<MCPServerResponse, ErrorResponse>({
        path: `/mcp-server/${id}`,
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
     * @name DeleteMcpServerById
     * @summary Delete an MCP server
     * @request DELETE:/mcp-server/{id}
     */
    deleteMcpServerById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/mcp-server/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  agentMcpServer = {
    /**
     * No description
     *
     * @tags Agent
     * @name GetAgentMcpServer
     * @summary List all agent MCP server assignments
     * @request GET:/agent-mcp-server
     */
    getAgentMcpServer: (params: RequestParams = {}) =>
      this.request<AgentMcpServerRelationResponse[], any>({
        path: `/agent-mcp-server`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name PostAgentMcpServer
     * @summary Assign an MCP server to an agent
     * @request POST:/agent-mcp-server
     */
    postAgentMcpServer: (
      data: {
        /** @min 0 */
        agentId: number;
        /** @min 0 */
        mcpServerId: number;
        enabled?: boolean | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentMcpServerRelationResponse, ValidationErrorResponse>({
        path: `/agent-mcp-server`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name GetAgentMcpServerAgentByAgentId
     * @summary List MCP servers assigned to an agent
     * @request GET:/agent-mcp-server/agent/{agentId}
     */
    getAgentMcpServerAgentByAgentId: (
      agentId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentMcpServerRelationResponse[], ErrorResponse>({
        path: `/agent-mcp-server/agent/${agentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name GetAgentMcpServerById
     * @summary Get an agent MCP server assignment by ID
     * @request GET:/agent-mcp-server/{id}
     */
    getAgentMcpServerById: (id: number, params: RequestParams = {}) =>
      this.request<AgentMcpServerRelationResponse, ErrorResponse>({
        path: `/agent-mcp-server/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name PutAgentMcpServerById
     * @summary Toggle enabled flag for an agent MCP server assignment
     * @request PUT:/agent-mcp-server/{id}
     */
    putAgentMcpServerById: (
      id: number,
      data: {
        enabled: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentMcpServerRelationResponse, ErrorResponse>({
        path: `/agent-mcp-server/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name DeleteAgentMcpServerById
     * @summary Remove an MCP server from an agent
     * @request DELETE:/agent-mcp-server/{id}
     */
    deleteAgentMcpServerById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/agent-mcp-server/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  agentTask = {
    /**
     * @description Streams ChatHistory updates as Server-Sent Events (SSE) for the target agent task. State events: - `event: task_state` is emitted when task state changes (or first observed state). - Payload shape: `{ taskId, state, previousState }`. Resume semantics: - Each event includes an SSE `id` equal to `ChatHistory.id`. - Browsers using `EventSource` automatically reconnect and send `Last-Event-ID`. - The server also accepts `after` as a fallback cursor for non-browser clients. - When the task reaches FINISHED, FAILED, or CANCELLED, the stream emits `event: done` and closes. Authentication: - Pass the JWT via `?token=<jwt>` because native `EventSource` cannot attach Authorization headers.
     *
     * @tags Agent Task
     * @name GetAgentTaskByIdStream
     * @summary Stream live chat history updates for an agent task
     * @request GET:/agent-task/{id}/stream
     */
    getAgentTaskByIdStream: (
      id: number,
      query: {
        /** JWT access token for EventSource-based authentication. */
        token: string;
        /** Fallback resume cursor. Streams records with ChatHistory.id greater than this value. */
        after?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<string, ErrorResponse>({
        path: `/agent-task/${id}/stream`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name GetAgentTaskById
     * @summary Get an agent task by ID
     * @request GET:/agent-task/{id}
     */
    getAgentTaskById: (id: number, params: RequestParams = {}) =>
      this.request<AgentTaskResponse, ErrorResponse>({
        path: `/agent-task/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PutAgentTaskById
     * @summary Update an agent task
     * @request PUT:/agent-task/{id}
     */
    putAgentTaskById: (
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
          | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<AgentTaskResponse, ErrorResponse>({
        path: `/agent-task/${id}`,
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
     * @name DeleteAgentTaskById
     * @summary Delete an agent task
     * @request DELETE:/agent-task/{id}
     */
    deleteAgentTaskById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/agent-task/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostAgentTaskByIdRun
     * @summary Run an agent task with priority
     * @request POST:/agent-task/{id}/run
     */
    postAgentTaskByIdRun: (id: number, params: RequestParams = {}) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/agent-task/${id}/run`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostAgentTaskByIdRetry
     * @summary Retry an agent task (including finished tasks)
     * @request POST:/agent-task/{id}/retry
     */
    postAgentTaskByIdRetry: (id: number, params: RequestParams = {}) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/agent-task/${id}/retry`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent Task
     * @name PostAgentTaskByIdStop
     * @summary Stop (cancel) an agent task
     * @request POST:/agent-task/{id}/stop
     */
    postAgentTaskByIdStop: (id: number, params: RequestParams = {}) =>
      this.request<
        AgentTaskRunResponse,
        ValidationErrorResponse | ErrorResponse
      >({
        path: `/agent-task/${id}/stop`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  agentFilePermission = {
    /**
     * No description
     *
     * @tags Agent File Permission
     * @name GetAgentFilePermission
     * @summary List all agent file permissions
     * @request GET:/agent-file-permission
     */
    getAgentFilePermission: (params: RequestParams = {}) =>
      this.request<AgentFilePermissionResponse[], any>({
        path: `/agent-file-permission`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name PostAgentFilePermission
     * @summary Create an agent file permission
     * @request POST:/agent-file-permission
     */
    postAgentFilePermission: (
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
      this.request<AgentFilePermissionResponse, ValidationErrorResponse>({
        path: `/agent-file-permission`,
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
     * @name GetAgentFilePermissionAgentByAgentId
     * @summary List file permissions assigned to an agent
     * @request GET:/agent-file-permission/agent/{agentId}
     */
    getAgentFilePermissionAgentByAgentId: (
      agentId: number,
      params: RequestParams = {},
    ) =>
      this.request<AgentFilePermissionResponse[], ErrorResponse>({
        path: `/agent-file-permission/agent/${agentId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name GetAgentFilePermissionById
     * @summary Get an agent file permission by ID
     * @request GET:/agent-file-permission/{id}
     */
    getAgentFilePermissionById: (id: number, params: RequestParams = {}) =>
      this.request<AgentFilePermissionResponse, ErrorResponse>({
        path: `/agent-file-permission/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent File Permission
     * @name PutAgentFilePermissionById
     * @summary Update an agent file permission
     * @request PUT:/agent-file-permission/{id}
     */
    putAgentFilePermissionById: (
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
        path: `/agent-file-permission/${id}`,
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
     * @name DeleteAgentFilePermissionById
     * @summary Delete an agent file permission
     * @request DELETE:/agent-file-permission/{id}
     */
    deleteAgentFilePermissionById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/agent-file-permission/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
}
