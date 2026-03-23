<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    size?: "default" | "medium";
  }>(),
  {
    size: "default",
  },
);

const btnRef = ref<HTMLButtonElement | null>(null);
const isHovered = ref(false);

let pos = 0;
let raf = 0;
let lastTs = 0;

// Speed in % per second (frame-rate independent via delta time)
// Normal: 12 %/s -> full cycle in ~8.3s
// Hover: 36 %/s -> 3x faster
const SPEED_NORMAL = 12;
const SPEED_HOVER = 36;

function tick(ts: DOMHighResTimeStamp) {
  const delta = lastTs === 0 ? 0 : ts - lastTs;
  lastTs = ts;

  const speed = isHovered.value ? SPEED_HOVER : SPEED_NORMAL;
  pos = (pos + speed * delta * 0.0025) % 600;

  if (btnRef.value) {
    btnRef.value.style.backgroundPosition = `${pos.toFixed(3)}% 50%`;
  }
  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  raf = requestAnimationFrame(tick);
});
onUnmounted(() => {
  cancelAnimationFrame(raf);
});
</script>

<template>
  <button
    ref="btnRef"
    class="primary-btn"
    :class="`primary-btn--${size}`"
    :disabled="disabled || loading"
    v-bind="$attrs"
    @mouseenter="isHovered = !props.disabled && true"
    @mouseleave="isHovered = false"
  >
    <span v-if="loading" class="spinner" />
    <slot />
  </button>
</template>

<style scoped>
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem 1.75rem;
  border: none;
  border-radius: var(--radius-pill);

  /*
   * Gradient repeats twice within background-size: 200%.
   * Each half (0→50%, 50→100%) is identical: cyan→purple→pink→cyan.
   * When JS pos wraps 100→0, the visible slice shifts from second half
   * back to first half — both identical, so zero visual jump.
   */
  background: linear-gradient(
    110deg,
    #0ea5a0 0%,
    #7825ea 16.7%,
    #a43073 33.3%,
    #0ea5a0 50%,
    #7825ea 66.7%,
    #a43073 83.3%,
    #0ea5a0 100%
  );
  background-size: 600% 100%;
  background-position: 0% 50%;

  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 8px 28px rgb(120 37 234 / 0.22);
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal);
  user-select: none;
}

.primary-btn--medium {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 36px rgb(120 37 234 / 0.32);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
  opacity: 0.85;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid rgb(255 255 255 / 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
