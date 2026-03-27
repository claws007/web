export type NotificationType = "info" | "warn" | "success" | "error";

export type SnapEdge = "top" | "right" | "bottom" | "left";

export interface ToastItem {
  id: string;
  type: NotificationType;
  message: string;
  /** Auto-dismiss delay in ms. 0 = persistent. */
  duration: number;
}

export interface ProgressTask {
  id: string;
  title: string;
  /** 0–100 for determinate; -1 for indeterminate. */
  progress: number;
  status: "active" | "complete" | "error";
  /** Optional subtitle / error description. */
  message?: string;
}
