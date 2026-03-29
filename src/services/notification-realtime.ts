import { api, type NotificationResponse } from "@/api";
import type {
  EntityChangePayload,
  NotificationEntityRecord,
} from "@/api/generated-ws";
import { reactive, readonly } from "vue";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { addToast } from "@/components/notification/store";

type NotificationState = {
  items: NotificationResponse[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

const state = reactive<NotificationState>({
  items: [],
  loading: false,
  error: null,
  initialized: false,
});

let running = false;
let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asType(value: unknown): NotificationResponse["type"] {
  if (
    value === "REQUEST_INPUT" ||
    value === "REQUEST_SELECT_SINGLE" ||
    value === "REQUEST_SELECT_MULTI" ||
    value === "REQUEST_CONFIRM" ||
    value === "COMMAND_PROGRESS" ||
    value === "AGENT_TASK_RESULT"
  ) {
    return value;
  }
  return "COMMAND_PROGRESS";
}

function asState(value: unknown): NotificationResponse["state"] {
  return value === "RESOLVE" ? "RESOLVE" : "PENDING";
}

function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function normalizeRecord(
  record: NotificationEntityRecord,
): NotificationResponse {
  return {
    id: Number(record.id) || 0,
    companyId: Number(record.companyId) || 0,
    type: asType(record.type),
    title: asString(record.title),
    content: String(record.content ?? ""),
    extraParams:
      record.extraParams && typeof record.extraParams === "object"
        ? (record.extraParams as Record<string, any>)
        : {},
    state: asState(record.state),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
    resolvedAt: asString(record.resolvedAt),
  };
}

function sortItems(items: NotificationResponse[]) {
  items.sort((a, b) => {
    const ta = toTimestamp(a.updatedAt);
    const tb = toTimestamp(b.updatedAt);
    if (tb !== ta) return tb - ta;
    return b.id - a.id;
  });
}

function upsertItem(next: NotificationResponse) {
  const idx = state.items.findIndex((item) => item.id === next.id);
  if (idx >= 0) {
    state.items[idx] = { ...state.items[idx], ...next };
  } else {
    state.items.unshift(next);
  }
  sortItems(state.items);
}

function removeItem(id: number) {
  const idx = state.items.findIndex((item) => item.id === id);
  if (idx >= 0) {
    state.items.splice(idx, 1);
  }
}

function handleEntityChange(payload: EntityChangePayload): void {
  if (payload.entity !== "notification") return;

  const record = payload.record as NotificationEntityRecord;
  const id = Number(record.id || payload.entityId);
  if (!Number.isFinite(id) || id <= 0) return;

  if (payload.operation === "delete") {
    removeItem(id);
    return;
  }

  const normalized = normalizeRecord(record);
  upsertItem(normalized);

  // Show a toast for successful task results arriving in real time
  if (
    state.initialized &&
    payload.operation === "create" &&
    normalized.type === "AGENT_TASK_RESULT" &&
    normalized.state === "RESOLVE"
  ) {
    addToast("success", normalized.title || "任务已完成", 5000);
  }
}

async function loadInitialSnapshot() {
  state.loading = true;
  state.error = null;

  try {
    const res = await api.notification.getNotification({
      page: 1,
      pageSize: 100,
    });
    const incoming = Array.isArray(res.data.items) ? res.data.items : [];
    for (const item of incoming) {
      upsertItem(item);
    }
    state.initialized = true;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "加载通知失败";
  } finally {
    state.loading = false;
  }
}

export async function startNotificationRealtime(options: {
  token: string | null | undefined;
  companyId: number | null | undefined;
}) {
  if (running) return;

  const token = options.token?.trim();
  const companyId = options.companyId;
  if (!token || typeof companyId !== "number" || companyId <= 0) return;

  running = true;

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

  await loadInitialSnapshot();
}

export function stopNotificationRealtime() {
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

export function getNotificationRealtimeState() {
  return readonly(state);
}
