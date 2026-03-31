<template>
  <div ref="containerRef" class="overflow-y-auto" @scroll="handleScroll">
    <div ref="contentRef">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    resetKey?: unknown;
    bottomThresholdPx?: number;
  }>(),
  {
    resetKey: undefined,
    bottomThresholdPx: 16,
  },
);

const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const shouldStickToBottom = ref(true);

let resizeObserver: ResizeObserver | null = null;

function isAtBottom(element: HTMLElement): boolean {
  const distance =
    element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance <= props.bottomThresholdPx;
}

function scrollToBottom() {
  const element = containerRef.value;
  if (!element) {
    return;
  }

  element.scrollTop = element.scrollHeight;
}

function handleScroll() {
  const element = containerRef.value;
  if (!element) {
    return;
  }

  shouldStickToBottom.value = isAtBottom(element);
}

function syncBottomOnResize() {
  if (!shouldStickToBottom.value) {
    return;
  }

  void nextTick(() => {
    scrollToBottom();
  });
}

watch(
  () => props.resetKey,
  () => {
    shouldStickToBottom.value = true;
    void nextTick(() => {
      scrollToBottom();
    });
  },
);

onMounted(() => {
  const containerElement = containerRef.value;
  const contentElement = contentRef.value;
  if (!containerElement || !contentElement) {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    syncBottomOnResize();
  });

  resizeObserver.observe(containerElement);
  resizeObserver.observe(contentElement);

  void nextTick(() => {
    scrollToBottom();
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>