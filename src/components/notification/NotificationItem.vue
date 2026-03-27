<script setup lang="ts">
import { ref, onMounted, computed, inject, Ref } from "vue";
import type { ToastItem } from "./types";
import { dismissToast as storeRemoveToast, pauseToastTimer, resumeToastTimer } from "./store";
import { useTimerPause } from "./composables/useTimerPause";

const props = defineProps<{ item: ToastItem }>();

// Inject position state from parent container
const positionState = inject<Ref<{ vertical: "top" | "bottom"; horizontal: "left" | "right" }>>("notificationPosition", ref({ vertical: "bottom", horizontal: "right" }));

// Trigger enter animation after mount
const entered = ref(false);
onMounted(() =>
  requestAnimationFrame(() => {
    entered.value = true;
  }),
);

const durationMs = computed(() => `${props.item.duration}ms`);

// Compute position classes for animation direction
const positionClasses = computed(() => ({
  "pos-right": positionState.value.horizontal === "right",
  "pos-left": positionState.value.horizontal === "left",
}));

const iconMap = { info: "ℹ", warn: "⚠", success: "✓", error: "✕" } as const;
const labelMap = {
  info: "提示",
  warn: "警告",
  success: "成功",
  error: "错误",
} as const;

// Handle dismiss with leave animation
const dismissToast = (id: string) => {
  // First trigger leave animation
  entered.value = false;
  // Wait for leave animation to complete (250ms) before removing from DOM
  setTimeout(() => {
    storeRemoveToast(id);
  }, 250);
};

// Use composable for timer pause/resume - only pause if toast has auto-dismiss enabled
const { handleMouseEnter, handleMouseLeave } = useTimerPause({
  onPause: (ids) => {
    if (props.item.duration > 0) {
      ids.forEach((id) => pauseToastTimer(id));
    }
  },
  onResume: (ids) => {
    if (props.item.duration > 0) {
      ids.forEach((id) => resumeToastTimer(id));
    }
  },
  ids: computed(() => [props.item.id]),
});
</script>

<template>
  <div
    class="toast"
    :class="[`toast--${item.type}`, { 'toast--in': entered }, positionClasses]"
    role="alert"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="toast-icon">{{ iconMap[item.type] }}</div>

    <div class="toast-body">
      <div class="toast-label">{{ labelMap[item.type] }}</div>
      <div class="toast-message">{{ item.message }}</div>
    </div>

    <button
      class="toast-close"
      :aria-label="`关闭${labelMap[item.type]}`"
      @click="dismissToast(item.id)"
    >
      ✕
    </button>

    <!-- Countdown bar — only for auto-dismissing toasts -->
    <div v-if="item.duration > 0" class="toast-timer" />
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  width: 22rem;
  max-width: calc(100vw - 2.5rem);
  max-height: calc(100vh - 2.5rem);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-float);
  border-left: 3px solid var(--toast-accent, var(--primary));
  position: relative;
  overflow: hidden;
  pointer-events: all;

  /* Default: Slide in from right */
  transform: translateX(calc(100% + 1.5rem));
  opacity: 0;
  transition:
    transform 0.35s var(--ease-crystal),
    opacity 0.35s var(--ease-crystal),
    max-height 0.3s var(--ease-crystal),
    padding 0.3s var(--ease-crystal);
}

/* When positioned on the left, slide from left instead */
.toast.pos-left {
  transform: translateX(calc(-100% - 1.5rem));
  border-left: none;
  border-right: 3px solid var(--toast-accent, var(--primary));
}

.toast--in {
  transform: translateX(0);
  opacity: 1;
}

/* Accent colour per type */
.toast--info {
  --toast-accent: var(--primary);
}
.toast--warn {
  --toast-accent: #d97706;
}
.toast--success {
  --toast-accent: #16a34a;
}
.toast--error {
  --toast-accent: #dc2626;
}

/* Icon bubble */
.toast-icon {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--toast-accent) 12%, transparent);
  color: var(--toast-accent);
}

/* Text */
.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.toast-message {
  font-size: 0.85rem;
  color: var(--foreground-muted);
  line-height: 1.5;
  word-break: break-word;
  margin-top: 0.1rem;
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
}

/* Close button */
.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--foreground-muted);
  font-size: 0.65rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  line-height: 1;
  transition:
    color 0.15s,
    background 0.15s;
}
.toast-close:hover {
  color: var(--foreground);
  background: var(--surface-container);
}

/* Countdown bar */
.toast-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--toast-accent);
  transform-origin: left center;
  animation: timer-shrink v-bind(durationMs) linear forwards;
}

@keyframes timer-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
