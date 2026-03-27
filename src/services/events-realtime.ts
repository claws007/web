import type { EntityChangePayload, EventsWsReceive } from "@/api/generated-ws";

type EntityChangeHandler = (payload: EntityChangePayload) => void;

const handlers = new Set<EntityChangeHandler>();

let activeSocket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let reconnectAttempts = 0;
let running = false;
let lastToken: string | null = null;
let lastCompanyId: number | null = null;

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 15000;

function getWsUrl(token: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
  const base = new URL(apiBase, window.location.origin);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const basePath = base.pathname.replace(/\/$/, "");
  return `${protocol}//${base.host}${basePath}/events/ws?token=${encodeURIComponent(token)}`;
}

function dispatchEntityChange(payload: EntityChangePayload) {
  for (const handler of handlers) {
    handler(payload);
  }
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
    ws.send(
      JSON.stringify({
        type: "subscribe",
        companyId,
        events: ["entity_change"],
      }),
    );
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

    if (payload.event !== "entity_change") {
      return;
    }

    dispatchEntityChange(payload.data as EntityChangePayload);
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
): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function startEventsRealtime(options: {
  token: string | null | undefined;
  companyId: number | null | undefined;
}) {
  const token = options.token?.trim() || null;
  const companyId =
    typeof options.companyId === "number" && options.companyId > 0
      ? options.companyId
      : null;

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
