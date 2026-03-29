// Auto-generated from AsyncAPI spec. Do not edit manually.
// Source: http://localhost:8000/asyncapi.yaml

export interface ServerEventEnvelopeError {
  id?: string | number | unknown;
  event: "error";
  data: { code: string; message: string };
}

export type WsEventType = "entity_change";

export type NotificationState = "PENDING" | "RESOLVE";

export type NotificationType =
  | "REQUEST_INPUT"
  | "REQUEST_SELECT_SINGLE"
  | "REQUEST_SELECT_MULTI"
  | "REQUEST_CONFIRM"
  | "COMMAND_PROGRESS"
  | "AGENT_TASK_RESULT";

export type EntityType =
  | "agent"
  | "agent_task"
  | "chat_history"
  | "skill"
  | "mcp_server"
  | "notification";

export type EntityOperation = "create" | "update" | "delete";

export type SubscribeCommandType = "subscribe";

export type UnsubscribeCommandType = "unsubscribe";

export type SubscriptionEventList = WsEventType[];

export interface AgentEntityRecord {
  id: number;
  companyId: number;
  createdByUserId: number | unknown;
  updatedByUserId: number | unknown;
  name: string;
  description: string | unknown;
  capacity: string | unknown;
  model: string | unknown;
  sandboxType: "NONE" | "DOCKER";
  containerImage: string | unknown;
  modelConnectorId: number;
  builtin: boolean;
}

export interface AgentDeleteTombstone {
  id: number;
  companyId: number;
}

export interface AgentTaskEntityRecord {
  id: number;
  companyId: number;
  createdByUserId: number | unknown;
  updatedByUserId: number | unknown;
  taskId: number;
  agentId: number;
  content: string;
  ac: string | unknown;
  state: string;
  queueOrder: number;
  assignedAt: string;
  startedAt: string | unknown;
  finishedAt: string | unknown;
  updatedAt: string;
}

export interface ChatHistoryEntityRecord {
  id: number;
  companyId: number;
  createdByUserId: number | unknown;
  role: "SYSTEM" | "USER" | "ASSISTANT" | "TOOL";
  eventType:
    | "MESSAGE"
    | "EXECUTION"
    | "MCP_CALL"
    | "MCP_RESULT"
    | "SKILL_CALL"
    | "TOOL_CALL";
  eventTypeName: string | unknown;
  durationMs: number | unknown;
  extraLogs: unknown;
  content: string;
  agentTaskId: number;
  createdAt: string;
}

export interface SkillEntityRecord {
  id: number;
  companyId: number;
  createdByUserId: number | unknown;
  updatedByUserId: number | unknown;
  name: string;
  fileListId: number;
  description: string | unknown;
}

export interface MCPServerEntityRecord {
  id: number;
  companyId: number;
  createdByUserId: number | unknown;
  updatedByUserId: number | unknown;
  name: string | unknown;
  description: string | unknown;
  type: "HTTP" | "STDIO";
  url: string | unknown;
  command: string | unknown;
  commandArguments: string | unknown;
  headers: unknown;
  builtin: boolean;
}

export type EntityRecord =
  | AgentEntityRecord
  | AgentTaskEntityRecord
  | ChatHistoryEntityRecord
  | SkillEntityRecord
  | MCPServerEntityRecord
  | AgentDeleteTombstone
  | NotificationEntityRecord;

export interface EntityChangePayload {
  companyId: number;
  entity: EntityType;
  operation: EntityOperation;
  entityId: number | string;
  record: EntityRecord;
}

export interface NotificationEntityRecord {
  id: number;
  companyId: number;
  type: NotificationType;
  title: string | unknown;
  content: string;
  extraParams: unknown;
  state: NotificationState;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | unknown;
}

export interface EventsReadyEnvelope {
  event: "ready";
  data: { availableEvents: SubscriptionEventList };
}

export interface SubscribedEnvelope {
  event: "subscribed";
  data: { companyId: number; events: SubscriptionEventList };
}

export interface UnsubscribedEnvelope {
  event: "unsubscribed";
  data: { companyId: number; events: SubscriptionEventList };
}

export interface ServerEventEnvelopeEntityChange {
  event: "entity_change";
  data: EntityChangePayload;
}

export interface SubscribeCommand {
  type: SubscribeCommandType;
  companyId: number;
  events: SubscriptionEventList;
}

export interface UnsubscribeCommand {
  type: UnsubscribeCommandType;
  companyId: number;
  events: SubscriptionEventList;
}

/** Messages sent by the client on the `/events/ws` channel */
export type EventsWsSend = SubscribeCommand | UnsubscribeCommand;
/** Messages received by the client on the `/events/ws` channel */
export type EventsWsReceive =
  | EventsReadyEnvelope
  | SubscribedEnvelope
  | UnsubscribedEnvelope
  | ServerEventEnvelopeEntityChange
  | ServerEventEnvelopeError;
