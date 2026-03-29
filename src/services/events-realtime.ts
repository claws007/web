import type {
  EntityChangePayload,
  EventsReadyEnvelope,
  EventsWsReceive,
  ServerEventEnvelopeError,
  SubscribedEnvelope,
  UnsubscribedEnvelope,
} from "@/api/generated-ws";
import type { EntityType, EventsWsSend, WsEventType } from "@/api/generated-ws";

type EntityChangeHandler = (payload: EntityChangePayload) => void;

type EntityChangeRegistration = {
  handler: EntityChangeHandler;
  entities: Set<EntityType> | null;
};

export type WsCommandDispatchPayload = {
  command: EventsWsSend;
  source: "demand" | "socket_open_resync";
};

export type WsServerEventPayload =
  | EventsReadyEnvelope
  | SubscribedEnvelope
  | UnsubscribedEnvelope
  | ServerEventEnvelopeError;

const handlers = new Set<EntityChangeRegistration>();
const wsCommandDispatchHandlers = new Set<
  (payload: WsCommandDispatchPayload) => void
>();
const wsServerEventHandlers = new Set<
  (payload: WsServerEventPayload) => void
>();

const subscriptionDemand = new Map<string, number>();
const entityChangeDemand = new Map<string, number>();

const ALL_ENTITY_TYPES: EntityType[] = [
  "agent",
  "agent_task",
  "chat_history",
  "skill",
  "mcp_server",
  "notification",
];

let activeSocket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let reconnectAttempts = 0;
let running = false;
let lastToken: string | null = null;
let lastCompanyId: number | null = null;

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 15000;

function buildDemandKey(event: WsEventType, companyId: number): string {
  return `${event}:${companyId}`;
}

function buildEntityDemandKey(companyId: number, entity: EntityType): string {
  return `${companyId}:${entity}`;
}

function normalizeCompanyId(
  companyId: number | null | undefined,
): number | null {
  return typeof companyId === "number" && companyId > 0 ? companyId : null;
}

function getWsUrl(token: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
  const base = new URL(apiBase, window.location.origin);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const basePath = base.pathname.replace(/\/$/, "");
  return `${protocol}//${base.host}${basePath}/events/ws?token=${encodeURIComponent(
    token,
  )}`;
}

function dispatchEntityChange(payload: EntityChangePayload) {
  for (const registration of handlers) {
    if (registration.entities && !registration.entities.has(payload.entity)) {
      continue;
    }
    registration.handler(payload);
  }
}

function dispatchWsCommand(payload: WsCommandDispatchPayload) {
  for (const handler of wsCommandDispatchHandlers) {
    handler(payload);
  }
}

function dispatchWsServerEvent(payload: WsServerEventPayload) {
  for (const handler of wsServerEventHandlers) {
    handler(payload);
  }
}

function sendWsCommand(
  command: EventsWsSend,
  source: "demand" | "socket_open_resync",
) {
  if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
    return;
  }

  activeSocket.send(JSON.stringify(command));
  dispatchWsCommand({ command, source });
}

function listDemandedEntities(companyId: number): EntityType[] {
  const entities: EntityType[] = [];
  for (const entity of ALL_ENTITY_TYPES) {
    if (
      (entityChangeDemand.get(buildEntityDemandKey(companyId, entity)) ?? 0) > 0
    ) {
      entities.push(entity);
    }
  }
  return entities;
}

function syncEntityChangeSubscription(
  companyId: number,
  source: "demand" | "socket_open_resync",
) {
  const entities = listDemandedEntities(companyId);

  sendWsCommand(
    {
      type: "unsubscribe",
      companyId,
      events: ["entity_change"],
    },
    source,
  );

  if (entities.length === 0) {
    return;
  }

  sendWsCommand(
    {
      type: "subscribe",
      companyId,
      events: ["entity_change"],
      entities,
    },
    source,
  );
}

function applyEntityDemandChange(
  companyId: number,
  entities: EntityType[],
  delta: 1 | -1,
) {
  const normalizedEntities = entities.length > 0 ? entities : ALL_ENTITY_TYPES;

  for (const entity of normalizedEntities) {
    const key = buildEntityDemandKey(companyId, entity);
    const current = entityChangeDemand.get(key) ?? 0;
    const next = Math.max(0, current + delta);

    if (next === 0) {
      entityChangeDemand.delete(key);
    } else {
      entityChangeDemand.set(key, next);
    }
  }

  if (!running || lastCompanyId !== companyId) {
    return;
  }

  syncEntityChangeSubscription(companyId, "demand");
}

function applyDemandChange(
  companyId: number,
  event: WsEventType,
  delta: 1 | -1,
  entities?: EntityType[],
) {
  if (event === "entity_change") {
    applyEntityDemandChange(companyId, entities ?? ALL_ENTITY_TYPES, delta);
    return;
  }

  const key = buildDemandKey(event, companyId);
  const currentCount = subscriptionDemand.get(key) ?? 0;
  const nextCount = Math.max(0, currentCount + delta);

  if (nextCount === currentCount) {
    return;
  }

  if (nextCount === 0) {
    subscriptionDemand.delete(key);
  } else {
    subscriptionDemand.set(key, nextCount);
  }

  if (!running || lastCompanyId !== companyId) {
    return;
  }

  if (currentCount === 0 && nextCount > 0) {
    sendWsCommand(
      {
        type: "subscribe",
        companyId,
        events: [event],
      },
      "demand",
    );
    return;
  }

  if (currentCount > 0 && nextCount === 0) {
    sendWsCommand(
      {
        type: "unsubscribe",
        companyId,
        events: [event],
      },
      "demand",
    );
  }
}

function resyncDemandsOnOpen(companyId: number) {
  const entityChangeEntities = listDemandedEntities(companyId);
  if (entityChangeEntities.length > 0) {
    sendWsCommand(
      {
        type: "subscribe",
        companyId,
        events: ["entity_change"],
        entities: entityChangeEntities,
      },
      "socket_open_resync",
    );
  }

  const eventsToSubscribe: WsEventType[] = [];

  for (const key of subscriptionDemand.keys()) {
    const [event, demandCompanyIdRaw] = key.split(":");
    const demandCompanyId = Number(demandCompanyIdRaw);
    if (demandCompanyId !== companyId) {
      continue;
    }

    const count = subscriptionDemand.get(key) ?? 0;
    if (count > 0) {
      eventsToSubscribe.push(event as WsEventType);
    }
  }

  const filteredEvents = eventsToSubscribe.filter(
    (event) => event !== "entity_change",
  );

  if (filteredEvents.length === 0) {
    return;
  }

  sendWsCommand(
    {
      type: "subscribe",
      companyId,
      events: filteredEvents,
    },
    "socket_open_resync",
  );
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function closeActiveSocket() {
  if (!activeSocket) {
    return;
  }
  activeSocket.close();
  activeSocket = null;
}

function scheduleReconnect() {
  if (!running || reconnectTimer !== null || !lastToken || !lastCompanyId) {
    return;
  }

  const delay = Math.min(
    RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
    MAX_RECONNECT_DELAY_MS,
  );
  reconnectAttempts += 1;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    const token = lastToken;
    const companyId = lastCompanyId;
    if (!token || !companyId) {
      return;
    }
    connectSocket(token, companyId);
  }, delay);
}

function connectSocket(token: string, companyId: number) {
  if (!running) {
    return;
  }

  const ws = new WebSocket(getWsUrl(token));
  activeSocket = ws;

  ws.onopen = () => {
    reconnectAttempts = 0;
    resyncDemandsOnOpen(companyId);
  };

  ws.onmessage = (event) => {
    if (typeof event.data !== "string") {
      return;
    }

    let payload: EventsWsReceive;
    try {
      payload = JSON.parse(event.data) as EventsWsReceive;
    } catch {
      return;
    }

    if (payload.event === "entity_change") {
      dispatchEntityChange(payload.data as EntityChangePayload);
      return;
    }

    if (
      payload.event === "ready" ||
      payload.event === "subscribed" ||
      payload.event === "unsubscribed" ||
      payload.event === "error"
    ) {
      dispatchWsServerEvent(payload);
    }
  };

  ws.onerror = () => {
    // onclose handles reconnect
  };

  ws.onclose = () => {
    if (activeSocket === ws) {
      activeSocket = null;
    }
    scheduleReconnect();
  };
}

export function registerEntityChangeHandler(
  handler: EntityChangeHandler,
  options?: {
    entities?: EntityType[];
  },
): () => void {
  const entities = options?.entities?.length ? new Set(options.entities) : null;
  const registration: EntityChangeRegistration = {
    handler,
    entities,
  };
  handlers.add(registration);

  return () => {
    handlers.delete(registration);
  };
}

export function registerWsCommandDispatchHandler(
  handler: (payload: WsCommandDispatchPayload) => void,
): () => void {
  wsCommandDispatchHandlers.add(handler);
  return () => {
    wsCommandDispatchHandlers.delete(handler);
  };
}

export function registerWsServerEventHandler(
  handler: (payload: WsServerEventPayload) => void,
): () => void {
  wsServerEventHandlers.add(handler);
  return () => {
    wsServerEventHandlers.delete(handler);
  };
}

export function requestRealtimeSubscription(options: {
  token: string | null | undefined;
  companyId: number | null | undefined;
  events: WsEventType[];
  entities?: EntityType[];
}): () => void {
  const token = options.token?.trim() || null;
  const companyId = normalizeCompanyId(options.companyId);
  const events = Array.from(new Set(options.events));
  const entities = options.entities?.length
    ? Array.from(new Set(options.entities))
    : ALL_ENTITY_TYPES;

  if (!token || !companyId || events.length === 0) {
    return () => {};
  }

  startEventsRealtime({ token, companyId });
  for (const event of events) {
    applyDemandChange(companyId, event, 1, entities);
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    for (const event of events) {
      applyDemandChange(companyId, event, -1, entities);
    }
  };
}

export function startEventsRealtime(options: {
  token: string | null | undefined;
  companyId: number | null | undefined;
}) {
  const token = options.token?.trim() || null;
  const companyId = normalizeCompanyId(options.companyId);

  if (!token || !companyId) {
    return;
  }

  const targetChanged = lastToken !== token || lastCompanyId !== companyId;
  lastToken = token;
  lastCompanyId = companyId;

  if (running && !targetChanged) {
    return;
  }

  running = true;
  clearReconnectTimer();

  if (targetChanged) {
    closeActiveSocket();
  }

  if (!activeSocket) {
    connectSocket(token, companyId);
  }
}

export function stopEventsRealtime() {
  running = false;
  clearReconnectTimer();
  closeActiveSocket();
  reconnectAttempts = 0;
}

export function isEventSubscriptionLive(
  companyId: number,
  event: WsEventType,
): boolean {
  if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
    return false;
  }

  if (event === "entity_change") {
    return listDemandedEntities(companyId).length > 0;
  }

  const key = buildDemandKey(event, companyId);
  return (subscriptionDemand.get(key) ?? 0) > 0;
}
