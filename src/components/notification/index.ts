/**
 * Notification API
 *
 * @example
 * ```ts
 * import { notify } from '@/components/notification'
 *
 * // Simple toasts
 * notify.info('已保存')
 * notify.warn('磁盘空间不足', { duration: 8000 })
 * notify.success('上传成功')
 * notify.error('网络错误')            // persistent by default
 *
 * // Progress widget
 * const task = notify.progress('上传文件...')
 * task.update(42, '正在上传第 3/7 个文件')
 * task.complete('上传完成')
 * // or:
 * task.fail('连接超时')
 * task.dismiss()
 * ```
 */

import { createApp } from "vue";
import NotificationHost from "./NotificationHost.vue";
import {
  addToast,
  addProgressTask,
  patchProgressTask,
  removeProgressTask,
} from "./store";
// ── Singleton host mount ───────────────────────────────────────────────────────

let _mounted = false;

function ensureHostMounted(): void {
  if (_mounted || typeof window === "undefined") return;
  _mounted = true;
  const host = document.createElement("div");
  host.id = "__notification-host__";
  // The host div itself is zero-size; actual UI is rendered via Teleport to body
  host.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;z-index:10000;pointer-events:none;overflow:visible";
  document.body.appendChild(host);
  createApp(NotificationHost).mount(host);
}

// ── Toast options ─────────────────────────────────────────────────────────────

export interface ToastOptions {
  /** Auto-dismiss delay in ms. Defaults: info/warn/success=4000, error=0 (persistent). */
  duration?: number;
}

// ── Progress handle ───────────────────────────────────────────────────────────

export interface ProgressHandle {
  /** Update progress (0–100) and optional message. */
  update(progress: number, message?: string): void;
  /** Mark as complete (progress → 100). Auto-removes after 3.5 s. */
  complete(message?: string): void;
  /** Mark as failed. Stays visible until dismissed. */
  fail(message?: string): void;
  /** Immediately remove from the widget. */
  dismiss(): void;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const notify = {
  info(message: string, options: ToastOptions = {}): string {
    ensureHostMounted();
    return addToast("info", message, options.duration ?? 4000);
  },

  warn(message: string, options: ToastOptions = {}): string {
    ensureHostMounted();
    return addToast("warn", message, options.duration ?? 4000);
  },

  success(message: string, options: ToastOptions = {}): string {
    ensureHostMounted();
    return addToast("success", message, options.duration ?? 4000);
  },

  /** Error toasts are persistent (duration=0) by default. */
  error(message: string, options: ToastOptions = {}): string {
    ensureHostMounted();
    return addToast("error", message, options.duration ?? 0);
  },

  /**
   * Show a draggable progress widget entry.
   * Returns a handle for updating / completing the task.
   */
  progress(title: string): ProgressHandle {
    ensureHostMounted();
    const id = addProgressTask(title);

    return {
      update(progress: number, message?: string) {
        patchProgressTask(id, {
          progress,
          ...(message !== undefined && { message }),
        });
      },
      complete(message?: string) {
        patchProgressTask(id, {
          status: "complete",
          progress: 100,
          ...(message !== undefined && { message }),
        });
      },
      fail(message?: string) {
        patchProgressTask(id, {
          status: "error",
          ...(message !== undefined && { message }),
        });
      },
      dismiss() {
        removeProgressTask(id);
      },
    };
  },
};

// Re-export lower-level helpers for advanced use
export { dismissToast } from "./store";
export type {
  ToastItem,
  ProgressTask,
  NotificationType,
  SnapEdge,
} from "./types";
