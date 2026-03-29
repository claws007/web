import type { NotificationResponse } from "@/api";

export type NotificationType = "info" | "warn" | "success" | "error";

export type SnapEdge = "top" | "right" | "bottom" | "left";

export interface ToastItem {
  kind: "toast";
  id: string;
  type: NotificationType;
  message: string;
  /** Auto-dismiss delay in ms. 0 = persistent. */
  duration: number;
  /** Unix timestamp (ms) when this entry was added — used for mixed-list ordering. */
  insertedAt: number;
}

export interface ProgressTask {
  kind: "progress";
  id: string;
  title: string;
  /** 0–100 for determinate; -1 for indeterminate. */
  progress: number;
  status: "active" | "complete" | "error";
  /** Optional subtitle / error description. */
  message?: string;
  /** Unix timestamp (ms) when this entry was added — used for mixed-list ordering. */
  insertedAt: number;
}

export type RequestNotificationType = Extract<
  NotificationResponse["type"],
  | "REQUEST_INPUT"
  | "REQUEST_SELECT_SINGLE"
  | "REQUEST_SELECT_MULTI"
  | "REQUEST_CONFIRM"
  | "AGENT_TASK_RESULT"
>;

export interface RequestInputItem {
  kind: "request";
  /** Widget-local unique id used as VDOM key. */
  id: string;
  /** Backend notification id used for submit/resolve APIs. */
  notificationId: number;
  requestType: RequestNotificationType;
  insertedAt: number;
  source: NotificationResponse;
}

/** Unified entry type for the shared notification list. */
export type NotificationEntry = ToastItem | ProgressTask | RequestInputItem;
