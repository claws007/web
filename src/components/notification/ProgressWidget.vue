<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  progressState,
  removeProgressTask,
  pauseProgressTaskTimer,
  resumeProgressTaskTimer,
} from "./store";
import { useTimerPause } from "./composables/useTimerPause";
import { useDraggableSnapOverlay } from "./composables/useFloatingLayer";

const widgetEl = ref<HTMLElement | null>(null);
const { isDragging, startDrag, pushToSnapEdge } = useDraggableSnapOverlay(
  widgetEl,
  progressState,
);

async function toggleMinimize() {
  progressState.minimized = !progressState.minimized;
  if (progressState.minimized) {
    await nextTick();
    pushToSnapEdge();
  }
}

function dismissDone() {
  progressState.tasks
    .filter((t) => t.status !== "active")
    .forEach((t) => removeProgressTask(t.id));
}

const completedTaskIds = computed(() =>
  progressState.tasks.filter((t) => t.status !== "active").map((t) => t.id),
);

const {
  handleMouseEnter: handleWidgetMouseEnter,
  handleMouseLeave: handleWidgetMouseLeave,
} = useTimerPause({
  onPause: (ids) => ids.forEach((id) => pauseProgressTaskTimer(id)),
  onResume: (ids) => ids.forEach((id) => resumeProgressTaskTimer(id)),
  ids: completedTaskIds,
});

const activeTasks = computed(() =>
  progressState.tasks.filter((t) => t.status === "active"),
);
const hasDone = computed(() =>
  progressState.tasks.some((t) => t.status !== "active"),
);
</script>

<template>
  <div
    ref="widgetEl"
    class="pw"
    :class="{
      'pw--min': progressState.minimized,
      'pw--dragging': isDragging,
      [`pw--snap-${progressState.snapEdge}`]: true,
    }"
    :style="{
      left: `${progressState.pos.x}px`,
      top: `${progressState.pos.y}px`,
    }"
    @mouseenter="handleWidgetMouseEnter"
    @mouseleave="handleWidgetMouseLeave"
  >
    <!-- ── Header / drag-handle ── -->
    <div class="pw-header" @mousedown="startDrag">
      <span class="pw-grip" title="拖动">⠿</span>

      <span class="pw-title">
        <template v-if="progressState.minimized">
          <span v-if="activeTasks.length > 0" class="pw-spinner" />
          {{ progressState.tasks.length }} 个任务
        </template>
        <template v-else>进度任务</template>
      </span>

      <div class="pw-actions" @mousedown.stop>
        <!-- Clear completed tasks button -->
        <button
          v-if="!progressState.minimized && hasDone"
          class="pw-action"
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
          class="pw-action"
          :title="progressState.minimized ? '展开' : '最小化'"
          @click="toggleMinimize"
        >
          <svg
            v-if="progressState.minimized"
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

    <!-- ── Task list ── -->
    <div v-show="!progressState.minimized" class="pw-body">
      <TransitionGroup tag="div" name="pw-task" class="pw-task-list">
        <div
          v-for="task in progressState.tasks"
          :key="task.id"
          class="pw-task"
          :class="`pw-task--${task.status}`"
        >
          <div class="pw-task-top">
            <!-- Status indicator -->
            <span class="pw-task-status-slot">
              <span
                v-if="task.status === 'active' && task.progress === -1"
                class="pw-spinner pw-spinner--sm"
              />
              <span v-else-if="task.status === 'active'" class="pw-task-pct"
                >{{ task.progress }}%</span
              >
              <span
                v-else-if="task.status === 'complete'"
                class="pw-task-badge pw-task-badge--ok"
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
              <span v-else class="pw-task-badge pw-task-badge--err">
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

            <span class="pw-task-title">{{ task.title }}</span>

            <!-- Dismiss button for errored tasks -->
            <button
              v-if="task.status === 'error'"
              class="pw-task-dismiss"
              title="关闭"
              @click="removeProgressTask(task.id)"
            >
              ✕
            </button>
          </div>

          <!-- Optional message -->
          <p v-if="task.message" class="pw-task-msg">{{ task.message }}</p>

          <!-- Progress bar (active tasks only) -->
          <div v-if="task.status === 'active'" class="pw-task-bar">
            <div
              class="pw-task-fill"
              :class="{ 'pw-task-fill--indeterminate': task.progress < 0 }"
              :style="task.progress >= 0 ? { width: `${task.progress}%` } : {}"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* ── Widget shell ─────────────────────────────────────────────────────────── */
.pw {
  position: fixed;
  z-index: 10001;
  width: 300px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-float);
  border: 1px solid var(--outline-ghost);
  overflow: hidden;
  user-select: none;
  pointer-events: all;

  /* Smooth snap/minimize transitions */
  transition:
    left 0.35s var(--ease-crystal),
    top 0.35s var(--ease-crystal),
    width 0.3s var(--ease-crystal);
}

/* No transition while the user is actively dragging */
.pw--dragging {
  transition: none;
  box-shadow:
    var(--shadow-float),
    0 0 0 2px var(--primary);
  cursor: grabbing;
}

/* Compact width when minimized */
.pw--min {
  width: 220px;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.pw-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--outline-ghost);
  cursor: move;
}

.pw--min .pw-header {
  border-bottom: none;
}

.pw-grip {
  color: var(--foreground-muted);
  font-size: 0.95rem;
  cursor: grab;
  flex-shrink: 0;
  line-height: 1;
}
.pw--dragging .pw-grip {
  cursor: grabbing;
}

.pw-title {
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

.pw-actions {
  display: flex;
  gap: 0.15rem;
  flex-shrink: 0;
}

.pw-action {
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
.pw-action:hover {
  color: var(--foreground);
  background: var(--surface-container);
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
.pw-body {
  padding: 0.5rem;
}

.pw-task-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* ── Task card ───────────────────────────────────────────────────────────── */
.pw-task {
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-sm);
  background: var(--surface-container-low);
  border: 1px solid var(--outline-ghost);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 150px;
  overflow: auto;
}

.pw-task--complete {
  opacity: 0.72;
}

.pw-task--error {
  border-color: rgb(220 38 38 / 0.28);
  background: rgb(220 38 38 / 0.04);
}

/* Task row */
.pw-task-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pw-task-status-slot {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: grid;
  place-items: center;
}

.pw-task-pct {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--primary);
}

/* Status badge (complete / error) */
.pw-task-badge {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.pw-task-badge--ok {
  background: rgb(22 163 74 / 0.12);
  color: #16a34a;
}

.pw-task-badge--err {
  background: rgb(220 38 38 / 0.12);
  color: #dc2626;
}

/* Title */
.pw-task-title {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--foreground);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dismiss button */
.pw-task-dismiss {
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
.pw-task-dismiss:hover {
  color: #dc2626;
}

/* Optional subtitle */
.pw-task-msg {
  font-size: 0.75rem;
  color: var(--foreground-muted);
  line-height: 1.4;
  padding-left: 1.75rem;
}
.pw-task--error .pw-task-msg {
  color: #dc2626;
}

/* ── Progress bar ─────────────────────────────────────────────────────────── */
.pw-task-bar {
  height: 4px;
  background: var(--surface-container-high);
  border-radius: 99px;
  overflow: hidden;
}

.pw-task-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 99px;
  transition: width 0.4s var(--ease-crystal);
}

/* Indeterminate shimmer */
.pw-task-fill--indeterminate {
  position: relative;
  width: 100% !important;
  background: var(--surface-container-high);
}
.pw-task-fill--indeterminate::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: var(--primary);
  border-radius: 99px;
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.pw-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--surface-container-high);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
.pw-spinner--sm {
  width: 0.875rem;
  height: 0.875rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

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
