<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  notificationState,
  removeProgressTask,
  dismissToast,
  pauseTimer,
  resumeTimer,
  getPausableIds,
} from "./store";
import type { ProgressTask, ToastItem, NotificationEntry } from "./types";
import { useTimerPause } from "./composables/useTimerPause";
import { useDraggableSnapOverlay } from "./composables/useFloatingLayer";

const widgetEl = ref<HTMLElement | null>(null);
const { isDragging, startDrag, pushToSnapEdge } = useDraggableSnapOverlay(
  widgetEl,
  notificationState,
);

// Sort entries by insertion time
const sortedEntries = computed(() => {
  return [...notificationState.entries].sort(
    (a, b) => a.insertedAt - b.insertedAt,
  );
});

// Unified timer pause/resume
const pausableIds = computed(() => getPausableIds());

const {
  handleMouseEnter: handleWidgetMouseEnter,
  handleMouseLeave: handleWidgetMouseLeave,
} = useTimerPause({
  onPause: (ids) => ids.forEach((id) => pauseTimer(id)),
  onResume: (ids) => ids.forEach((id) => resumeTimer(id)),
  ids: pausableIds,
});

async function toggleMinimize() {
  notificationState.minimized = !notificationState.minimized;
  if (notificationState.minimized) {
    await nextTick();
    pushToSnapEdge();
  }
}

// Summary for minimized state
const summaryText = computed(() => {
  const total = notificationState.entries.length;
  if (total === 0) return "消息";

  const toasts = notificationState.entries.filter(
    (e) => e.kind === "toast",
  ).length;
  const tasks = notificationState.entries.filter(
    (e) => e.kind === "progress",
  ).length;

  if (toasts > 0 && tasks > 0) {
    return `${toasts} 条通知 / ${tasks} 个任务`;
  }
  if (toasts > 0) {
    return `${toasts} 条通知`;
  }
  return `${tasks} 个任务`;
});

const hasTasks = computed(() =>
  notificationState.entries.some((e) => e.kind === "progress"),
);

const hasActiveTask = computed(() =>
  notificationState.entries.some(
    (e) => e.kind === "progress" && (e as ProgressTask).status === "active",
  ),
);

function dismissDone() {
  notificationState.entries
    .filter(
      (e) => e.kind === "progress" && (e as ProgressTask).status !== "active",
    )
    .forEach((e) => removeProgressTask(e.id));
}

function isEntryClosing(entry: NotificationEntry): boolean {
  return Boolean((entry as any)._closing);
}

const iconMap = { info: "ℹ", warn: "⚠", success: "✓", error: "✕" } as const;
const labelMap = {
  info: "提示",
  warn: "警告",
  success: "成功",
  error: "错误",
} as const;

function getToastAccentColor(
  type: "info" | "warn" | "success" | "error",
): string {
  const colors: Record<"info" | "warn" | "success" | "error", string> = {
    info: "var(--primary)",
    warn: "#d97706",
    success: "#16a34a",
    error: "#dc2626",
  };
  return colors[type];
}
</script>

<template>
  <div
    ref="widgetEl"
    class="nw"
    :class="{
      'nw--min': notificationState.minimized,
      'nw--dragging': isDragging,
      'nw--closing': notificationState.closing,
      [`nw--snap-${notificationState.snapEdge}`]: true,
    }"
    :style="{
      left: `${notificationState.pos.x}px`,
      top: `${notificationState.pos.y}px`,
    }"
    @mouseenter="handleWidgetMouseEnter"
    @mouseleave="handleWidgetMouseLeave"
  >
    <!-- ── Header / drag-handle ── -->
    <div class="nw-header" @mousedown="startDrag">
      <span class="nw-grip" title="拖动">⠿</span>

      <span class="nw-title">
        <template v-if="notificationState.minimized">
          <span v-if="hasActiveTask" class="nw-spinner" />
          {{ summaryText }}
        </template>
        <template v-else>消息&通知</template>
      </span>

      <div class="nw-actions" @mousedown.stop>
        <!-- Clear completed tasks button -->
        <button
          v-if="!notificationState.minimized && hasTasks"
          class="nw-action"
          title="清除已完成"
          @click="dismissDone"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Minimize / restore button -->
        <button
          class="nw-action"
          :title="notificationState.minimized ? '展开' : '最小化'"
          @click="toggleMinimize"
        >
          <svg
            v-if="notificationState.minimized"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6h8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Body: mixed toast & task list ── -->
    <div v-show="!notificationState.minimized" class="nw-body">
      <TransitionGroup tag="div" name="nw-item" class="nw-item-list">
        <!-- ─ Toast entries ─ -->
        <div
          v-for="entry in sortedEntries"
          v-show="entry.kind === 'toast'"
          :key="entry.id"
          class="nw-toast"
          :class="[
            `nw-toast--${(entry as ToastItem).type}`,
            { 'nw-toast--closing': isEntryClosing(entry) },
          ]"
        >
          <div class="nw-toast-icon">
            {{ iconMap[(entry as ToastItem).type] }}
          </div>

          <div class="nw-toast-body">
            <div class="nw-toast-label">
              {{ labelMap[(entry as ToastItem).type] }}
            </div>
            <div class="nw-toast-message">
              {{ (entry as ToastItem).message }}
            </div>
          </div>

          <button
            class="nw-toast-close"
            :title="`关闭${labelMap[(entry as ToastItem).type]}`"
            @click="dismissToast(entry.id)"
          >
            ✕
          </button>

          <!-- Countdown bar for auto-dismiss toasts -->
          <div
            v-if="(entry as ToastItem).duration > 0"
            class="nw-toast-timer"
            :style="
              {
                '--toast-duration': `${(entry as ToastItem).duration}ms`,
                '--toast-accent': getToastAccentColor(
                  (entry as ToastItem).type,
                ),
              } as any
            "
          />
        </div>

        <!-- ─ Progress task entries ─ -->
        <div
          v-for="entry in sortedEntries"
          v-show="entry.kind === 'progress'"
          :key="entry.id"
          class="nw-task"
          :class="[
            `nw-task--${(entry as ProgressTask).status}`,
            { 'nw-task--closing': isEntryClosing(entry) },
          ]"
        >
          <div class="nw-task-top">
            <!-- Status indicator -->
            <span class="nw-task-status-slot">
              <span
                v-if="
                  (entry as ProgressTask).status === 'active' &&
                  (entry as ProgressTask).progress === -1
                "
                class="nw-spinner nw-spinner--sm"
              />
              <span
                v-else-if="(entry as ProgressTask).status === 'active'"
                class="nw-task-pct"
                >{{ (entry as ProgressTask).progress }}%</span
              >
              <span
                v-else-if="(entry as ProgressTask).status === 'complete'"
                class="nw-task-badge nw-task-badge--ok"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5l2.5 2.5 4.5-4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span v-else class="nw-task-badge nw-task-badge--err">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 2l6 6M8 2L2 8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </span>

            <span class="nw-task-title">{{
              (entry as ProgressTask).title
            }}</span>

            <!-- Dismiss button for errored tasks -->
            <button
              v-if="(entry as ProgressTask).status === 'error'"
              class="nw-task-dismiss"
              title="关闭"
              @click="removeProgressTask(entry.id)"
            >
              ✕
            </button>
          </div>

          <!-- Optional message -->
          <p v-if="(entry as ProgressTask).message" class="nw-task-msg">
            {{ (entry as ProgressTask).message }}
          </p>

          <!-- Progress bar (active tasks only) -->
          <div
            v-if="(entry as ProgressTask).status === 'active'"
            class="nw-task-bar"
          >
            <div
              class="nw-task-fill"
              :class="{
                'nw-task-fill--indeterminate':
                  (entry as ProgressTask).progress < 0,
              }"
              :style="
                (entry as ProgressTask).progress >= 0
                  ? { width: `${(entry as ProgressTask).progress}%` }
                  : {}
              "
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* ── Widget shell ─────────────────────────────────────────────────────────── */
.nw {
  position: fixed;
  z-index: 10001;
  width: 340px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-float);
  border: 1px solid var(--outline-ghost);
  overflow: hidden;
  user-select: none;
  pointer-events: all;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 4rem);

  /* Smooth snap/minimize transitions */
  transition:
    left 0.35s var(--ease-crystal),
    top 0.35s var(--ease-crystal),
    width 0.3s var(--ease-crystal),
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.nw--closing {
  opacity: 0;
  transform: translateY(8px);
}

/* No transition while the user is actively dragging */
.nw--dragging {
  transition: none;
  box-shadow:
    var(--shadow-float),
    0 0 0 2px var(--primary);
  cursor: grabbing;
}

/* Compact width when minimized */
.nw--min {
  width: 220px;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.nw-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--outline-ghost);
  cursor: move;
  flex-shrink: 0;
}

.nw--min .nw-header {
  border-bottom: none;
}

.nw-grip {
  color: var(--foreground-muted);
  font-size: 0.95rem;
  cursor: grab;
  flex-shrink: 0;
  line-height: 1;
}
.nw--dragging .nw-grip {
  cursor: grabbing;
}

.nw-title {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--foreground);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nw-actions {
  display: flex;
  gap: 0.15rem;
  flex-shrink: 0;
}

.nw-action {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--foreground-muted);
  width: 1.5rem;
  height: 1.5rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  transition:
    color 0.15s,
    background 0.15s;
}
.nw-action:hover {
  color: var(--foreground);
  background: var(--surface-container);
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
.nw-body {
  padding: 0.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.nw-item-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

/* ────────────────────────────────────────────────────────────────── */
/* ── Toast styles ────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────────── */

.nw-toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-sm);
  background: white;
  border: 1px solid var(--outline-ghost);
  border-left: 3px solid var(--nw-toast-accent, var(--primary));
  position: relative;
  overflow: hidden;

  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    max-height 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-width 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.nw-toast--closing {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  border-width: 0;
  overflow: hidden;
}

/* Toast accent colors */
.nw-toast--info {
  --nw-toast-accent: var(--primary);
}
.nw-toast--warn {
  --nw-toast-accent: #d97706;
}
.nw-toast--success {
  --nw-toast-accent: #16a34a;
}
.nw-toast--error {
  --nw-toast-accent: #dc2626;
}

.nw-toast-icon {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--nw-toast-accent) 12%, transparent);
  color: var(--nw-toast-accent);
}

.nw-toast-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nw-toast-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.nw-toast-message {
  font-size: 0.8rem;
  color: var(--foreground-muted);
  line-height: 1.4;
  word-break: break-word;
  max-height: 100px;
  overflow-y: auto;
}

.nw-toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--foreground-muted);
  font-size: 0.6rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  line-height: 1;
  transition:
    color 0.15s,
    background 0.15s;
}
.nw-toast-close:hover {
  color: var(--foreground);
  background: var(--surface-container);
}

.nw-toast-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--nw-toast-accent);
  transform-origin: left center;
  animation: nw-timer-shrink var(--toast-duration) linear forwards;
}

@keyframes nw-timer-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* ────────────────────────────────────────────────────────────────── */
/* ── Task card styles ─────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────────── */

.nw-task {
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-sm);
  background: var(--surface-container-low);
  border: 1px solid var(--outline-ghost);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 150px;
  overflow: auto;
  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    max-height 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-width 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.nw-task--closing {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  border-width: 0;
  overflow: hidden;
}

.nw-task--complete {
  opacity: 0.72;
}

.nw-task--error {
  border-color: rgb(220 38 38 / 0.28);
  background: rgb(220 38 38 / 0.04);
}

.nw-task-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nw-task-status-slot {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: grid;
  place-items: center;
}

.nw-task-pct {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--primary);
}

.nw-task-badge {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.nw-task-badge--ok {
  background: rgb(22 163 74 / 0.12);
  color: #16a34a;
}

.nw-task-badge--err {
  background: rgb(220 38 38 / 0.12);
  color: #dc2626;
}

.nw-task-title {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--foreground);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nw-task-dismiss {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--foreground-muted);
  font-size: 0.6rem;
  padding: 0.15rem 0.25rem;
  border-radius: 2px;
  line-height: 1;
  transition: color 0.15s;
}
.nw-task-dismiss:hover {
  color: #dc2626;
}

.nw-task-msg {
  font-size: 0.75rem;
  color: var(--foreground-muted);
  line-height: 1.4;
  padding-left: 1.75rem;
  margin: 0;
}
.nw-task--error .nw-task-msg {
  color: #dc2626;
}

/* Progress bar */
.nw-task-bar {
  height: 4px;
  background: var(--surface-container-high);
  border-radius: 99px;
  overflow: hidden;
}

.nw-task-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 99px;
  transition: width 0.4s var(--ease-crystal);
}

/* Indeterminate shimmer */
.nw-task-fill--indeterminate {
  position: relative;
  width: 100% !important;
  background: var(--surface-container-high);
}
.nw-task-fill--indeterminate::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: var(--primary);
  border-radius: 99px;
  animation: nw-indeterminate 1.5s ease-in-out infinite;
}

@keyframes nw-indeterminate {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.nw-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--surface-container-high);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: nw-spin 0.75s linear infinite;
}
.nw-spinner--sm {
  width: 0.875rem;
  height: 0.875rem;
}

@keyframes nw-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<!--
  TransitionGroup classes applied to native <div> children — must be unscoped.
-->
<style>
.nw-item-enter-active,
.nw-item-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.nw-item-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.nw-item-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.nw-item-move {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
} @keyframes spin { to { transform: rotate(360deg); } }

<!--
  TransitionGroup classes applied to native <div> children — must be unscoped.
-->
<style>
.pw-task-enter-active,
.pw-task-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.pw-task-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.pw-task-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.pw-task-move {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
