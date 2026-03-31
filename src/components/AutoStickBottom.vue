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
let mutationObserver: MutationObserver | null = null;
let scrollScheduled = false;

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

// 确保滚动完成的增强版本，使用多个异步时机确保所有渲染完成
async function scrollToBottomWithRetry() {
  if (!shouldStickToBottom.value) {
    return;
  }

  // 第一次尝试：nextTick 后
  await nextTick();
  scrollToBottom();

  // 第二次尝试：Promise 微任务后（更晚）
  await Promise.resolve();
  scrollToBottom();

  // 第三次尝试：延迟一帧后（确保浏览器重排完成）
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      scrollToBottom();
      resolve();
    });
  });
}

function syncBottomOnResize() {
  if (!shouldStickToBottom.value || scrollScheduled) {
    return;
  }

  scrollScheduled = true;
  void scrollToBottomWithRetry().then(() => {
    scrollScheduled = false;
  });
}

function syncBottomOnMutation() {
  if (!shouldStickToBottom.value || scrollScheduled) {
    return;
  }

  scrollScheduled = true;
  // MutationObserver 回调在 DOM 更新后立即触发
  // 使用更早的异步时机确保不会错过内容更新
  void nextTick(() => {
    scrollToBottomWithRetry().then(() => {
      scrollScheduled = false;
    });
  });
}

watch(
  () => props.resetKey,
  () => {
    shouldStickToBottom.value = true;
    void scrollToBottomWithRetry();
  },
);

onMounted(() => {
  const containerElement = containerRef.value;
  const contentElement = contentRef.value;
  if (!containerElement || !contentElement) {
    return;
  }

  // ResizeObserver: 监听大小变化
  resizeObserver = new ResizeObserver(() => {
    syncBottomOnResize();
  });

  resizeObserver.observe(containerElement);
  resizeObserver.observe(contentElement);

  // MutationObserver: 监听 DOM 内容变化（子节点、属性等）
  mutationObserver = new MutationObserver(() => {
    syncBottomOnMutation();
  });

  mutationObserver.observe(contentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: false,
  });

  void scrollToBottomWithRetry();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  mutationObserver?.disconnect();
  mutationObserver = null;
});
</script>