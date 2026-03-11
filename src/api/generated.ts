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

export interface AIModelResponse {
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
  userId: number;
  modelId: number;
  user?: Record<string, any>;
  model?: AIModelResponse;
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
  ac: string;
  state: string;
  queueOrder: number;
  /** @format date-time */
  assignedAt: string;
  agent?: AgentResponse;
}

export interface ChatHistoryResponse {
  id: number;
  role: "SYSTEM" | "USER" | "ASSISTANT";
  content: string;
  agentTaskId: number;
  /** @format date-time */
  createdAt: string;
}

export interface MCPServerResponse {
  id: number;
  name?: string | null;
  description?: string | null;
  /** @format uri */
  url: string;
  params?: Record<string, any>;
}

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
        /** @min 0 */
        modelId: number;
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
        /** @min 0 */
        modelId?: number | null;
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
        ac: string;
        state?: "PENDING" | "ACTIVE" | "FAILED" | "FINISHED" | null;
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
  };
  model = {
    /**
     * No description
     *
     * @tags Model
     * @name GetModelTypes
     * @summary Get supported AI model types
     * @request GET:/model/types
     */
    getModelTypes: (params: RequestParams = {}) =>
      this.request<ModelTypesResponse, any>({
        path: `/model/types`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name GetModel
     * @summary List all AI models
     * @request GET:/model
     */
    getModel: (params: RequestParams = {}) =>
      this.request<AIModelResponse[], any>({
        path: `/model`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name PostModel
     * @summary Create a new AI model
     * @request POST:/model
     */
    postModel: (
      data: {
        /** @minLength 1 */
        name: string;
        type:
          | "OPENAI"
          | "ANTHROPIC"
          | "GOOGLE"
          | "MISTRAL"
          | "META"
          | "DEEPSEEK"
          | "ZHIPU"
          | "QWEN"
          | "BAIDU"
          | "MOONSHOT";
        params: Record<string, any>;
      },
      params: RequestParams = {},
    ) =>
      this.request<AIModelResponse, ValidationErrorResponse>({
        path: `/model`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name GetModelById
     * @summary Get an AI model by ID
     * @request GET:/model/{id}
     */
    getModelById: (id: number, params: RequestParams = {}) =>
      this.request<AIModelResponse, ErrorResponse>({
        path: `/model/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name PutModelById
     * @summary Update an AI model
     * @request PUT:/model/{id}
     */
    putModelById: (
      id: number,
      data: {
        /** @minLength 1 */
        name?: string | null;
        type?:
          | "OPENAI"
          | "ANTHROPIC"
          | "GOOGLE"
          | "MISTRAL"
          | "META"
          | "DEEPSEEK"
          | "ZHIPU"
          | "QWEN"
          | "BAIDU"
          | "MOONSHOT"
          | null;
        params?: Record<string, any>;
      },
      params: RequestParams = {},
    ) =>
      this.request<AIModelResponse, ErrorResponse>({
        path: `/model/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name DeleteModelById
     * @summary Delete an AI model
     * @request DELETE:/model/{id}
     */
    deleteModelById: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/model/${id}`,
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
        /** @format uri */
        url: string;
        params?: Record<string, any>;
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
        /** @format uri */
        url?: string | null;
        params?: Record<string, any>;
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
     * No description
     *
     * @tags Agent
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
     * @tags Agent
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
        state?: "PENDING" | "ACTIVE" | "FAILED" | "FINISHED" | null;
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
     * @tags Agent
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
  };
}
