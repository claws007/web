<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { getNotificationRealtimeState } from "@/services/notification-realtime";
import type { NotificationResponse } from "@/api";
import {
  notificationState,
  removeProgressTask,
  pauseTimer,
  resumeTimer,
  getPausableIds,
} from "./store";
import Notification from "./unit/Notification.vue";
import type {
  ProgressTask,
  NotificationEntry,
  RequestInputItem,
} from "./types";
import { useTimerPause } from "./composables/useTimerPause";
import { useDraggableSnapOverlay } from "./composables/useFloatingLayer";

const widgetEl = ref<HTMLElement | null>(null);
const realtimeState = getNotificationRealtimeState();

const { isDragging, startDrag, pushToSnapEdge } = useDraggableSnapOverlay(
  widgetEl,
  notificationState,
);

function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

type WidgetRequestNotification = NotificationResponse & {
  state: "PENDING";
  type: RequestInputItem["requestType"];
};

function isWidgetRequest(
  item: NotificationResponse,
): item is WidgetRequestNotification {
  if (item.state !== "PENDING") return false;
  return item.type !== "COMMAND_PROGRESS";
}

const requestEntries = computed<RequestInputItem[]>(() =>
  realtimeState.items.filter(isWidgetRequest).map((item) => ({
    kind: "request",
    id: `req-${item.id}`,
    notificationId: item.id,
    requestType: item.type,
    insertedAt: toTimestamp(item.updatedAt || item.createdAt),
    source: item,
  })),
);

// Sort all widget entries by insertion time
const sortedEntries = computed<(NotificationEntry & { _closing?: boolean })[]>(
  () => {
    return [...notificationState.entries, ...requestEntries.value].sort(
      (a, b) => a.insertedAt - b.insertedAt,
    );
  },
);

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
  const total = sortedEntries.value.length;
  if (total === 0) return "消息";

  const toasts = sortedEntries.value.filter((e) => e.kind === "toast").length;
  const tasks = sortedEntries.value.filter((e) => e.kind === "progress").length;
  const requests = sortedEntries.value.filter(
    (e) => e.kind === "request",
  ).length;

  const parts = [] as string[];
  if (toasts > 0) parts.push(`${toasts} 条通知`);
  if (tasks > 0) parts.push(`${tasks} 个任务`);
  if (requests > 0) parts.push(`${requests} 个请求`);

  return parts.join(" / ");
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

function isEntryClosing(
  entry: NotificationEntry & { _closing?: boolean },
): boolean {
  if (entry.kind === "request") return false;
  return Boolean(entry._closing);
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
        <Notification
          v-for="entry in sortedEntries"
          :key="entry.id"
          :entry="entry"
          :closing="isEntryClosing(entry)"
        />
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

/* ── Spinner (used in minimized header) ──────────────────────────────────── */
.nw-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--surface-container-high);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: nw-spin 0.75s linear infinite;
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
