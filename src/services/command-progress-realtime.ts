import type { CommandProgressItem } from "@/api";
import { api } from "@/api";
import { notify, type ProgressHandle } from "@/components/notification";
import type {
  CommandProgressEntityRecord,
  EntityChangePayload,
} from "@/api/generated-ws";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";

type NormalizedCommandProgress = {
  commandId: string;
  commandType: string;
  title: string;
  status: "running" | "success" | "failed";
  progress: number | null;
  message: string | null;
};

export type CommandProgressRealtimeEvent =
  | CommandProgressItem
  | NormalizedCommandProgress;

const commandHandleMap = new Map<string, ProgressHandle>();
const progressEventSubscribers = new Set<
  (event: CommandProgressRealtimeEvent) => void
>();

let running = false;
let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

function toProgressValue(value: number | null): number {
  if (typeof value !== "number") {
    return -1;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ensureHandle(
  task: CommandProgressItem | NormalizedCommandProgress,
): ProgressHandle {
  let handle = commandHandleMap.get(task.commandId);
  if (!handle) {
    handle = notify.progress(task.title);
    commandHandleMap.set(task.commandId, handle);
  }
  return handle;
}

function applyProgressUpdate(
  task: CommandProgressItem | NormalizedCommandProgress,
) {
  const handle = ensureHandle(task);
  const message = task.message ?? undefined;

  for (const subscriber of progressEventSubscribers) {
    subscriber(task);
  }

  if (task.status === "running") {
    handle.update(toProgressValue(task.progress), message);
    return;
  }

  if (task.status === "success") {
    handle.complete(message ?? "命令执行完成");
    commandHandleMap.delete(task.commandId);
    return;
  }

  handle.fail(message ?? "命令执行失败");
  commandHandleMap.delete(task.commandId);
}

function parseCommandProgressFromEntityChange(
  payload: EntityChangePayload,
): NormalizedCommandProgress | null {
  if (payload.entity !== "command_progress") {
    return null;
  }

  const record = payload.record as CommandProgressEntityRecord;
  if (
    !record ||
    typeof record.id !== "string" ||
    typeof record.title !== "string"
  ) {
    return null;
  }

  const status = record.status === "running" ||
      record.status === "success" ||
      record.status === "failed"
    ? record.status
    : null;
  if (!status) {
    return null;
  }

  const progress = typeof record.progress === "number" ? record.progress : null;

  const message = typeof record.message === "string" ? record.message : null;

  return {
    commandId: record.id,
    commandType: record.commandType,
    title: record.title,
    status,
    progress,
    message,
  };
}

async function loadInitialProgressList() {
  try {
    const res = await api.modelConnector.getCommandProgress();
    for (const item of res.data.items ?? []) {
      applyProgressUpdate(item);
    }
  } catch {
    // The realtime channel is best-effort; ignore initialization failures.
  }
}

function handleEntityChange(payload: EntityChangePayload) {
  const progress = parseCommandProgressFromEntityChange(payload);
  if (!progress) {
    return;
  }

  applyProgressUpdate(progress);
}

export async function startCommandProgressRealtime(options: {
  token: string | null | undefined;
  companyId: number | null | undefined;
}) {
  if (running) {
    return;
  }

  const token = options.token?.trim();
  const companyId = options.companyId;
  if (!token || typeof companyId !== "number" || companyId <= 0) {
    return;
  }

  running = true;
  if (!unsubscribeEntityChange) {
    unsubscribeEntityChange = registerEntityChangeHandler(handleEntityChange, {
      entities: ["command_progress"],
    });
  }
  if (!releaseSubscriptionDemand) {
    releaseSubscriptionDemand = requestRealtimeSubscription({
      token,
      companyId,
      events: ["entity_change"],
      entities: ["command_progress"],
    });
  }
  await loadInitialProgressList();
}

export function stopCommandProgressRealtime() {
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
