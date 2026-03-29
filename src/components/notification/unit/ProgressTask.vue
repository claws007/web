<script setup lang="ts">
import { removeProgressTask } from "../store";
import type { ProgressTask } from "../types";

defineProps<{
  entry: ProgressTask;
  closing: boolean;
}>();
</script>

<template>
  <div
    class="nw-task"
    :class="[`nw-task--${entry.status}`, { 'nw-task--closing': closing }]"
  >
    <div class="nw-task-top">
      <!-- Status indicator -->
      <span class="nw-task-status-slot">
        <span
          v-if="entry.status === 'active' && entry.progress === -1"
          class="nw-spinner nw-spinner--sm"
        />
        <span v-else-if="entry.status === 'active'" class="nw-task-pct"
          >{{ entry.progress }}%</span
        >
        <span
          v-else-if="entry.status === 'complete'"
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

      <span class="nw-task-title">{{ entry.title }}</span>

      <!-- Dismiss button for errored tasks -->
      <button
        v-if="entry.status === 'error'"
        class="nw-task-dismiss"
        title="关闭"
        @click="removeProgressTask(entry.id)"
      >
        ✕
      </button>
    </div>

    <!-- Optional message -->
    <p v-if="entry.message" class="nw-task-msg">
      {{ entry.message }}
    </p>

    <!-- Progress bar (active tasks only) -->
    <div v-if="entry.status === 'active'" class="nw-task-bar">
      <div
        class="nw-task-fill"
        :class="{ 'nw-task-fill--indeterminate': entry.progress < 0 }"
        :style="entry.progress >= 0 ? { width: `${entry.progress}%` } : {}"
      />
    </div>
  </div>
</template>

<style scoped>
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

/* Spinner */
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
