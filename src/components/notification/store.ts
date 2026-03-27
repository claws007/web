import { reactive } from "vue";
import type {
  ToastItem,
  ProgressTask,
  NotificationType,
  SnapEdge,
} from "./types";

let _uid = 0;
const uid = () => `_n${Date.now()}_${++_uid}`;

// ── Toast ─────────────────────────────────────────────────────────────────────

export const toastState = reactive<{ items: ToastItem[] }>({ items: [] });

// Map to track timeout IDs for each toast
const toastTimers = new Map<string, NodeJS.Timeout>();

export function addToast(
  type: NotificationType,
  message: string,
  duration = 4000,
): string {
  const id = uid();
  toastState.items.push({ id, type, message, duration });
  if (duration > 0) {
    const timer = setTimeout(() => dismissToast(id), duration);
    toastTimers.set(id, timer);
  }
  return id;
}

export function refreshToastTimer(id: string): void {
  const toast = toastState.items.find((t) => t.id === id);
  if (!toast || toast.duration <= 0) return;

  // Clear existing timer
  const existingTimer = toastTimers.get(id);
  if (existingTimer) clearTimeout(existingTimer);

  // Set new timer
  const newTimer = setTimeout(() => dismissToast(id), toast.duration);
  toastTimers.set(id, newTimer);
}

export function pauseToastTimer(id: string): void {
  // Clear the timer but keep the toast
  const existingTimer = toastTimers.get(id);
  if (existingTimer) clearTimeout(existingTimer);
  toastTimers.delete(id);
}

export function resumeToastTimer(id: string): void {
  // Resume the timer if toast still exists
  const toast = toastState.items.find((t) => t.id === id);
  if (toast && toast.duration > 0) {
    const newTimer = setTimeout(() => dismissToast(id), toast.duration);
    toastTimers.set(id, newTimer);
  }
}

export function dismissToast(id: string): void {
  const i = toastState.items.findIndex((t) => t.id === id);
  if (i !== -1) toastState.items.splice(i, 1);

  // Clean up timer
  const timer = toastTimers.get(id);
  if (timer) clearTimeout(timer);
  toastTimers.delete(id);
}

// ── Progress ──────────────────────────────────────────────────────────────────

export const progressState = reactive<{
  tasks: ProgressTask[];
  pos: { x: number; y: number };
  snapEdge: SnapEdge;
  minimized: boolean;
}>({
  tasks: [],
  pos: { x: 0, y: 0 },
  snapEdge: "right",
  minimized: false,
});

// Map to track timeout IDs for each progress task's auto-dismiss
const progressTimers = new Map<string, NodeJS.Timeout>();

export function addProgressTask(title: string): string {
  const id = uid();
  progressState.tasks.push({ id, title, progress: -1, status: "active" });
  return id;
}

export function patchProgressTask(
  id: string,
  patch: Partial<
    Pick<ProgressTask, "progress" | "status" | "message" | "title">
  >,
): void {
  const task = progressState.tasks.find((t) => t.id === id);
  if (!task) return;
  Object.assign(task, patch);
  if (patch.status === "complete") {
    const timer = setTimeout(() => removeProgressTask(id), 3500);
    progressTimers.set(id, timer);
  }
}

export function refreshProgressTaskTimer(id: string): void {
  // Clear existing timer
  const existingTimer = progressTimers.get(id);
  if (existingTimer) clearTimeout(existingTimer);

  // Set new timer if task still exists and is completed
  const task = progressState.tasks.find((t) => t.id === id);
  if (task && task.status !== "active") {
    const newTimer = setTimeout(() => removeProgressTask(id), 3500);
    progressTimers.set(id, newTimer);
  }
}

export function pauseProgressTaskTimer(id: string): void {
  // Clear the timer but keep the task
  const existingTimer = progressTimers.get(id);
  if (existingTimer) clearTimeout(existingTimer);
  progressTimers.delete(id);
}

export function resumeProgressTaskTimer(id: string): void {
  // Resume the timer if task still exists and is completed
  const task = progressState.tasks.find((t) => t.id === id);
  if (task && task.status !== "active") {
    const newTimer = setTimeout(() => removeProgressTask(id), 3500);
    progressTimers.set(id, newTimer);
  }
}

export function removeProgressTask(id: string): void {
  const i = progressState.tasks.findIndex((t) => t.id === id);
  if (i !== -1) progressState.tasks.splice(i, 1);

  // Clean up timer
  const timer = progressTimers.get(id);
  if (timer) clearTimeout(timer);
  progressTimers.delete(id);
}
