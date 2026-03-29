import { api } from "@/api";
import type {
  EntityChangePayload,
  NotificationEntityRecord,
} from "@/api/generated-ws";
import { notify, type ProgressHandle } from "@/components/notification";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";

// Subscriber event shape kept backward-compatible for existing consumers (e.g. ManageDockerImageDialog).
export type CommandProgressRealtimeEvent = {
  commandId: string;
  commandType: string;
  title: string;
  status: "running" | "success" | "failed";
  progress: number | null;
  message: string | null;
};

// handleMap key: String(notification.id)
const handleMap = new Map<string, ProgressHandle>();
const progressEventSubscribers = new Set<
  (event: CommandProgressRealtimeEvent) => void
>();

let running = false;
let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

function resolveTitle(record: { title: unknown; content: string }): string {
  return typeof record.title === "string" && record.title.length > 0
    ? record.title
    : record.content;
}

function extractExtraParams(extraParams: unknown): {
  progress: number;
  message: string | null;
  commandType: string;
} {
  if (!extraParams || typeof extraParams !== "object") {
    return { progress: -1, message: null, commandType: "" };
  }
  const p = extraParams as Record<string, unknown>;
  const progress =
    typeof p.progress === "number"
      ? Math.max(0, Math.min(100, Math.round(p.progress)))
      : -1;
  const message = typeof p.message === "string" ? p.message : null;
  const commandType = typeof p.commandType === "string" ? p.commandType : "";
  return { progress, message, commandType };
}

function ensureHandle(key: string, title: string): ProgressHandle {
  let handle = handleMap.get(key);
  if (!handle) {
    handle = notify.progress(title);
    handleMap.set(key, handle);
  }
  return handle;
}

function emitToSubscribers(event: CommandProgressRealtimeEvent): void {
  for (const subscriber of progressEventSubscribers) {
    subscriber(event);
  }
}

function applyRecord(
  key: string,
  record: {
    title: unknown;
    content: string;
    extraParams: unknown;
    state: "PENDING" | "RESOLVE";
  },
  operation: "create" | "update" | "delete",
): void {
  const { progress, message, commandType } = extractExtraParams(
    record.extraParams,
  );
  const title = resolveTitle(record);

  if (operation === "delete") {
    const handle = handleMap.get(key);
    if (handle) {
      handle.dismiss();
      handleMap.delete(key);
    }
    emitToSubscribers({
      commandId: key,
      commandType,
      title,
      status: "failed",
      progress: null,
      message,
    });
    return;
  }

  if (record.state === "RESOLVE") {
    const handle = handleMap.get(key);
    if (handle) {
      handle.complete();
      handleMap.delete(key);
    }
    emitToSubscribers({
      commandId: key,
      commandType,
      title,
      status: "success",
      progress: 100,
      message,
    });
    return;
  }

  // PENDING
  const handle = ensureHandle(key, title);
  handle.update(progress, message ?? undefined);
  emitToSubscribers({
    commandId: key,
    commandType,
    title,
    status: "running",
    progress: progress === -1 ? null : progress,
    message,
  });
}

function handleEntityChange(payload: EntityChangePayload): void {
  if (payload.entity !== "notification") return;
  const record = payload.record as NotificationEntityRecord;
  if (record.type !== "COMMAND_PROGRESS") return;
  const key = String(record.id);
  applyRecord(key, record, payload.operation);
}

async function loadInitialSnapshot(): Promise<void> {
  try {
    const res = await api.notification.getNotification({
      pending: true,
      pageSize: 100,
    });
    for (const item of res.data.items ?? []) {
      if (item.type !== "COMMAND_PROGRESS") continue;
      const key = String(item.id);
      // Skip ids already received via WS during this fetch window.
      if (handleMap.has(key)) continue;
      applyRecord(key, item, "create");
    }
  } catch {
    // Best-effort; realtime channel handles subsequent updates.
  }
}

export async function startCommandProgressRealtime(options: {
  token: string | null | undefined;
  companyId: number | null | undefined;
}): Promise<void> {
  if (running) return;

  const token = options.token?.trim();
  const companyId = options.companyId;
  if (!token || typeof companyId !== "number" || companyId <= 0) return;

  running = true;

  // Step A: Activate WS subscription first so no events are missed during HTTP fetch.
  if (!unsubscribeEntityChange) {
    unsubscribeEntityChange = registerEntityChangeHandler(handleEntityChange, {
      entities: ["notification"],
    });
  }
  if (!releaseSubscriptionDemand) {
    releaseSubscriptionDemand = requestRealtimeSubscription({
      token,
      companyId,
      events: ["entity_change"],
      entities: ["notification"],
    });
  }

  // Step B+C: Fetch pending snapshot and dedup against ids already in handleMap.
  await loadInitialSnapshot();
}

export function stopCommandProgressRealtime(): void {
  running = false;
  if (unsubscribeEntityChange) {
    unsubscribeEntityChange();
    unsubscribeEntityChange = null;
  }
  if (releaseSubscriptionDemand) {
    releaseSubscriptionDemand();
    releaseSubscriptionDemand = null;
  }
}

export function subscribeCommandProgressRealtime(
  handler: (event: CommandProgressRealtimeEvent) => void,
): () => void {
  progressEventSubscribers.add(handler);
  return () => {
    progressEventSubscribers.delete(handler);
  };
}
