<script setup lang="ts">
import { dismissToast } from "../store";
import type { ToastItem } from "../types";

defineProps<{
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

// Accent color values for timer bar inline style
const accentColorMap: Record<string, string> = {
  info: "var(--color-primary)",
  warn: "#d97706",
  success: "#16a34a",
  error: "#dc2626",
};

// Tailwind classes per type for icon circle
const iconBgMap: Record<string, string> = {
  info: "bg-primary/10 text-primary",
  warn: "bg-amber-600/10 text-amber-600",
  success: "bg-green-600/10 text-green-600",
  error: "bg-red-600/10 text-red-600",
};
</script>

<template>
  <div
    class="toast-base flex items-start gap-3 px-3.5 py-3 rounded-sm bg-black/5 relative overflow-hidden"
    :class="{ 'toast-closing': closing }"
  >
    <!-- Type icon -->
    <div
      class="size-[1.4rem] rounded-full grid place-items-center text-[0.7rem] font-bold shrink-0"
      :class="iconBgMap[entry.type]"
    >
      {{ iconMap[entry.type] }}
    </div>

    <!-- Body -->
    <div class="flex-1 min-w-0 flex flex-col gap-[0.2rem]">
      <div class="text-xs font-bold text-foreground tracking-[0.01em]">
        {{ labelMap[entry.type] }}
      </div>
      <div
        class="text-[0.8rem] text-foreground-muted leading-[1.4] break-words max-h-[100px] overflow-y-auto"
      >
        {{ entry.message }}
      </div>
    </div>

    <!-- Close button -->
    <button
      class="shrink-0 bg-transparent border-0 cursor-pointer text-foreground-muted text-[0.6rem] p-1 rounded-sm leading-none transition-[color,background] duration-150 hover:text-foreground hover:bg-surface-container"
      :title="`关闭${labelMap[entry.type]}`"
      @click="dismissToast(entry.id)"
    >
      ✕
    </button>

    <!-- Countdown bar for auto-dismiss toasts -->
    <div
      v-if="entry.duration > 0"
      class="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
      :style="
        {
          background: accentColorMap[entry.type],
          animation: `toast-timer-shrink ${entry.duration}ms linear forwards`,
        } as any
      "
    />
  </div>
</template>

<style scoped>
.toast-base {
  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    max-height 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-width 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-closing {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  border-width: 0;
  overflow: hidden;
}
</style>

<!-- Global keyframe so inline-style animation references can resolve the name -->
<style>
@keyframes toast-timer-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
