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

/** @example "OPENAI" */
export enum ModelType {
  OPENAI = "OPENAI",
  ANTHROPIC = "ANTHROPIC",
  GOOGLE = "GOOGLE",
  MISTRAL = "MISTRAL",
  META = "META",
  DEEPSEEK = "DEEPSEEK",
  ZHIPU = "ZHIPU",
  QWEN = "QWEN",
  BAIDU = "BAIDU",
  MOONSHOT = "MOONSHOT",
}

export interface RootResponse {
  /** @example "deno-hono-prisma-mysql" */
  name: string;
  /** @example "Server is running" */
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
  /** @example "Not found" */
  error: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: object;
}

export interface SuccessResponse {
  success: true;
}

/** OpenAPI 3.x JSON specification document */
export type OpenApiDocumentResponse = object;

export interface LoginRequest {
  /**
   * @format email
   * @example "alice@example.com"
   */
  email: string;
  /**
   * @minLength 1
   * @example "secret123"
   */
  password: string;
}

export interface SafeUser {
  /** @example 1 */
  id: number;
  /** @example "Alice" */
  name: string;
  /**
   * @format email
   * @example "alice@example.com"
   */
  email: string;
  /** @example "13800138000" */
  mobile: string;
}

export interface AuthResponse {
  user: SafeUser;
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  token: string;
}

export interface ModelTypesResponse {
  types: ModelType[];
}

export interface AIModel {
  /** @example 1 */
  id: number;
  /** @example "GPT-4o" */
  name: string;
  type: ModelType;
  /** @example {"apiKey":"sk-..."} */
  params: object;
}

export interface CreateModelRequest {
  /** @example "GPT-4o" */
  name: string;
  type: ModelType;
  /** @example {"apiKey":"sk-..."} */
  params: object;
}

export interface UpdateModelRequest {
  /** @example "GPT-4o" */
  name?: string;
  type?: ModelType;
  /** @example {"apiKey":"sk-..."} */
  params?: object;
}

export interface Agent {
  /** @example 1 */
  id: number;
  /** @example "My Assistant" */
  name: string;
  /** @example "A helpful coding assistant" */
  description?: string | null;
  /** @example "code,search,summarize" */
  capacity?: string | null;
  /** @example 1 */
  userId: number;
  /** @example 1 */
  modelId: number;
  user?: SafeUser;
  model?: AIModel;
}

export interface CreateAgentRequest {
  /** @example "My Assistant" */
  name: string;
  /** @example "A helpful coding assistant" */
  description?: string;
  /** @example "code,search,summarize" */
  capacity?: string;
  /** @example 1 */
  userId: number;
  /** @example 1 */
  modelId: number;
}

export interface UpdateAgentRequest {
  /** @example "My Assistant" */
  name?: string;
  /** @example "A helpful coding assistant" */
  description?: string;
  /** @example "code,search,summarize" */
  capacity?: string;
  /** @example 1 */
  modelId?: number;
}

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
 * Swagger documentation for the Deno + Hono + Prisma server.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags System
   * @name GetRoot
   * @summary Get service metadata
   * @request GET:/
   */
  getRoot = (params: RequestParams = {}) =>
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
     * @name HealthList
     * @summary Get database health
     * @request GET:/health
     */
    healthList: (params: RequestParams = {}) =>
      this.request<HealthUpResponse, HealthDownResponse>({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * No description
     *
     * @tags User
     * @name LoginCreate
     * @summary Login with email and password
     * @request POST:/user/login
     */
    loginCreate: (data: LoginRequest, params: RequestParams = {}) =>
      this.request<AuthResponse, ValidationErrorResponse | ErrorResponse>({
        path: `/user/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  model = {
    /**
     * No description
     *
     * @tags Model
     * @name TypesList
     * @summary Get all supported AI model brand types
     * @request GET:/model/types
     */
    typesList: (params: RequestParams = {}) =>
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
     * @name ModelList
     * @summary List all AI models
     * @request GET:/model
     */
    modelList: (params: RequestParams = {}) =>
      this.request<AIModel[], any>({
        path: `/model`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name ModelCreate
     * @summary Create a new AI model
     * @request POST:/model
     */
    modelCreate: (data: CreateModelRequest, params: RequestParams = {}) =>
      this.request<AIModel, ValidationErrorResponse>({
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
     * @name ModelDetail
     * @summary Get an AI model by ID
     * @request GET:/model/{id}
     */
    modelDetail: (id: number, params: RequestParams = {}) =>
      this.request<AIModel, ErrorResponse>({
        path: `/model/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Model
     * @name ModelUpdate
     * @summary Update an AI model
     * @request PUT:/model/{id}
     */
    modelUpdate: (
      id: number,
      data: UpdateModelRequest,
      params: RequestParams = {},
    ) =>
      this.request<AIModel, ErrorResponse>({
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
     * @name ModelDelete
     * @summary Delete an AI model
     * @request DELETE:/model/{id}
     */
    modelDelete: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/model/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  agent = {
    /**
     * No description
     *
     * @tags Agent
     * @name AgentList
     * @summary List all agents
     * @request GET:/agent
     */
    agentList: (params: RequestParams = {}) =>
      this.request<Agent[], any>({
        path: `/agent`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name AgentCreate
     * @summary Create a new agent
     * @request POST:/agent
     */
    agentCreate: (data: CreateAgentRequest, params: RequestParams = {}) =>
      this.request<Agent, ValidationErrorResponse>({
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
     * @name AgentDetail
     * @summary Get an agent by ID
     * @request GET:/agent/{id}
     */
    agentDetail: (id: number, params: RequestParams = {}) =>
      this.request<Agent, ErrorResponse>({
        path: `/agent/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Agent
     * @name AgentUpdate
     * @summary Update an agent
     * @request PUT:/agent/{id}
     */
    agentUpdate: (
      id: number,
      data: UpdateAgentRequest,
      params: RequestParams = {},
    ) =>
      this.request<Agent, ErrorResponse>({
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
     * @name AgentDelete
     * @summary Delete an agent
     * @request DELETE:/agent/{id}
     */
    agentDelete: (id: number, params: RequestParams = {}) =>
      this.request<SuccessResponse, ErrorResponse>({
        path: `/agent/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  swaggerJson = {
    /**
     * No description
     *
     * @tags Docs
     * @name SwaggerJsonList
     * @summary Get OpenAPI specification
     * @request GET:/swagger.json
     */
    swaggerJsonList: (params: RequestParams = {}) =>
      this.request<OpenApiDocumentResponse, any>({
        path: `/swagger.json`,
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
     * @name DocsList
     * @summary Get Swagger UI page
     * @request GET:/docs
     */
    docsList: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/docs`,
        method: "GET",
        ...params,
      }),
  };
  openapiYaml = {
    /**
     * No description
     *
     * @tags Docs
     * @name OpenapiYamlList
     * @summary Get OpenAPI YAML document
     * @request GET:/openapi.yaml
     */
    openapiYamlList: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/openapi.yaml`,
        method: "GET",
        ...params,
      }),
  };
}
