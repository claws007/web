// Auto-generated from AsyncAPI spec. Do not edit manually.
// Source: http://localhost:8000/asyncapi.yaml

export interface ServerEventEnvelopeError {
  id?: string | number | unknown;
  event: "error";
  data: { code: string; message: string };
}

export type WsEventType = "entity_change";

export type CommandProgressStatus = "running" | "success" | "failed";

export type EntityType = "agent" | "skill" | "mcp_server" | "command_progress";

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

export interface CommandProgressEntityRecord {
  id: string;
  companyId: number;
  commandType: string;
  title: string;
  status: CommandProgressStatus;
  progress: number | unknown;
  message: string | unknown;
  startedAt: string;
  updatedAt: string;
  finishedAt: string | unknown;
}

export type EntityRecord =
  | AgentEntityRecord
  | SkillEntityRecord
  | MCPServerEntityRecord
  | AgentDeleteTombstone
  | CommandProgressEntityRecord;

export interface EntityChangePayload {
  companyId: number;
  entity: EntityType;
  operation: EntityOperation;
  entityId: number | string;
  record: EntityRecord;
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
