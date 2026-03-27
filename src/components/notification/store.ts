import { reactive } from "vue";
import type {
  NotificationEntry,
  NotificationType,
  ProgressTask,
  SnapEdge,
  ToastItem,
} from "./types";

let _uid = 0;
const uid = () => `_n${Date.now()}_${++_uid}`;

// ── Unified Notification State ─────────────────────────────────────────────────

export const notificationState = reactive<{
  entries: (NotificationEntry & { _closing?: boolean })[];
  pos: { x: number; y: number };
  snapEdge: SnapEdge;
  minimized: boolean;
  closing: boolean;
}>({
  entries: [],
  pos: { x: 0, y: 0 },
  snapEdge: "right",
  minimized: false,
  closing: false,
});

// ── Timer Maps ────────────────────────────────────────────────────────────────

/** Auto-dismiss timers: used for toast items and completed progress tasks. */
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Per-card slide-out animation timers before actual splice. */
const removingTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ── Internal helpers ──────────────────────────────────────────────────────────

function markClosing(id: string): void {
  const entry = notificationState.entries.find((e) => e.id === id);
  if (entry) entry._closing = true;
}

function spliceEntry(id: string): void {
  const idx = notificationState.entries.findIndex((e) => e.id === id);
  if (idx !== -1) notificationState.entries.splice(idx, 1);
}

/**
 * Remove an entry. If it is the last one, play widget-level closing fade then
 * splice; otherwise play per-card slide-out then splice.
 */
function scheduleRemove(id: string): void {
  const dt = dismissTimers.get(id);
  if (dt) {
    clearTimeout(dt);
    dismissTimers.delete(id);
  }

  // Already being removed
  if (removingTimers.has(id)) return;

  if (notificationState.entries.length === 1) {
    // Last entry — trigger widget-level fade-out
    notificationState.closing = true;
    markClosing(id);

    const t = setTimeout(() => {
      spliceEntry(id);
      notificationState.closing = false;
      removingTimers.delete(id);
    }, 300);
    removingTimers.set(id, t);
    return;
  }

  // Not last — slide individual card out then splice
  markClosing(id);
  const t = setTimeout(() => {
    spliceEntry(id);
    removingTimers.delete(id);
  }, 250);
  removingTimers.set(id, t);
}

// ── Toast API ─────────────────────────────────────────────────────────────────

export function addToast(
  type: NotificationType,
  message: string,
  duration = 4000,
): string {
  const id = uid();
  notificationState.closing = false;
  const entry: ToastItem = {
    kind: "toast",
    id,
    type,
    message,
    duration,
    insertedAt: Date.now(),
  };
  notificationState.entries.push(entry);

  if (duration > 0) {
    const timer = setTimeout(() => dismissToast(id), duration);
    dismissTimers.set(id, timer);
  }
  return id;
}

export function pauseToastTimer(id: string): void {
  const t = dismissTimers.get(id);
  if (t) {
    clearTimeout(t);
    dismissTimers.delete(id);
  }
}

export function resumeToastTimer(id: string): void {
  const entry = notificationState.entries.find(
    (e) => e.id === id && e.kind === "toast",
  ) as ToastItem | undefined;
  if (entry && entry.duration > 0) {
    const timer = setTimeout(() => dismissToast(id), entry.duration);
    dismissTimers.set(id, timer);
  }
}

export function dismissToast(id: string): void {
  const entry = notificationState.entries.find(
    (e) => e.id === id && e.kind === "toast",
  );
  if (!entry || entry._closing) return;
  scheduleRemove(id);
}

// ── Progress API ──────────────────────────────────────────────────────────────

export function addProgressTask(title: string): string {
  const id = uid();
  notificationState.closing = false;
  const entry: ProgressTask = {
    kind: "progress",
    id,
    title,
    progress: -1,
    status: "active",
    insertedAt: Date.now(),
  };
  notificationState.entries.push(entry);
  return id;
}

export function patchProgressTask(
  id: string,
  patch: Partial<
    Pick<ProgressTask, "progress" | "status" | "message" | "title">
  >,
): void {
  const task = notificationState.entries.find(
    (e) => e.id === id && e.kind === "progress",
  ) as ProgressTask | undefined;
  if (!task) return;
  Object.assign(task, patch);

  if (patch.status === "complete") {
    const timer = setTimeout(() => removeProgressTask(id), 3500);
    dismissTimers.set(id, timer);
  }
}

export function pauseProgressTaskTimer(id: string): void {
  const t = dismissTimers.get(id);
  if (t) {
    clearTimeout(t);
    dismissTimers.delete(id);
  }
}

export function resumeProgressTaskTimer(id: string): void {
  const task = notificationState.entries.find(
    (e) => e.id === id && e.kind === "progress",
  ) as ProgressTask | undefined;
  if (task && task.status !== "active") {
    const timer = setTimeout(() => removeProgressTask(id), 3500);
    dismissTimers.set(id, timer);
  }
}

export function removeProgressTask(id: string): void {
  const entry = notificationState.entries.find(
    (e) => e.id === id && e.kind === "progress",
  );
  if (!entry || entry._closing) return;
  scheduleRemove(id);
}

// ── Unified hover-pause helpers ────────────────────────────────────────────────

/** IDs of all entries that should be paused on hover. */
export function getPausableIds(): string[] {
  return notificationState.entries
    .filter((e) => {
      if (e.kind === "toast") return (e as ToastItem).duration > 0;
      if (e.kind === "progress") return (e as ProgressTask).status !== "active";
      return false;
    })
    .map((e) => e.id);
}

export function pauseTimer(id: string): void {
  const entry = notificationState.entries.find((e) => e.id === id);
  if (!entry) return;
  if (entry.kind === "toast") pauseToastTimer(id);
  else if (entry.kind === "progress") pauseProgressTaskTimer(id);
}

export function resumeTimer(id: string): void {
  const entry = notificationState.entries.find((e) => e.id === id);
  if (!entry) return;
  if (entry.kind === "toast") resumeToastTimer(id);
  else if (entry.kind === "progress") resumeProgressTaskTimer(id);
}
