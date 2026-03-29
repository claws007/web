<script setup lang="ts">
import { dismissToast } from "../store";
import type { ToastItem } from "../types";

const props = defineProps<{
  entry: ToastItem;
  closing: boolean;
}>();

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
    class="nw-toast"
    :class="[`nw-toast--${entry.type}`, { 'nw-toast--closing': closing }]"
  >
    <div class="nw-toast-icon">
      {{ iconMap[entry.type] }}
    </div>

    <div class="nw-toast-body">
      <div class="nw-toast-label">
        {{ labelMap[entry.type] }}
      </div>
      <div class="nw-toast-message">
        {{ entry.message }}
      </div>
    </div>

    <button
      class="nw-toast-close"
      :title="`关闭${labelMap[entry.type]}`"
      @click="dismissToast(entry.id)"
    >
      ✕
    </button>

    <!-- Countdown bar for auto-dismiss toasts -->
    <div
      v-if="entry.duration > 0"
      class="nw-toast-timer"
      :style="
        {
          '--toast-duration': `${entry.duration}ms`,
          '--toast-accent': getToastAccentColor(entry.type),
        } as any
      "
    />
  </div>
</template>

<style scoped>
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
</style>
