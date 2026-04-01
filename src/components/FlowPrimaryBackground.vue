<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  isHovered?: boolean;
}>();

const bgRef = ref<HTMLDivElement | null>(null);

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

  const speed = props.isHovered ? SPEED_HOVER : SPEED_NORMAL;
  pos = (pos + speed * delta * 0.0025) % 600;

  if (bgRef.value) {
    bgRef.value.style.backgroundPosition = `${pos.toFixed(3)}% 50%`;
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
  <div ref="bgRef" class="flow-primary-bg">
    <slot></slot>
  </div>
</template>

<style scoped>
.flow-primary-bg {
  /*
   * Gradient repeats twice within background-size: 600%.
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
  color: white;
}
</style>
