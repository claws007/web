<template>
  <div ref="containerRef" class="overflow-y-auto" @scroll="handleScroll">
    <div ref="contentRef">
      <ChatHistoryDisplay v-bind="{ ...props }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import ChatHistoryDisplay from "@/components/ChatHistoryDisplay.vue";

// defineOptions({
//   inheritAttrs: false,
// });

const props = defineProps<{
  agentTaskId: number;
  maxItems?: number;
}>();

const attrs = useAttrs();
const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const shouldStickToBottom = ref(true);

const BOTTOM_THRESHOLD_PX = 16;

let resizeObserver: ResizeObserver | null = null;

function isAtBottom(element: HTMLElement): boolean {
  const distance =
    element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance <= BOTTOM_THRESHOLD_PX;
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

watch(
  () => props.agentTaskId,
  () => {
    shouldStickToBottom.value = true;
    void nextTick(() => {
      scrollToBottom();
    });
  },
);

onMounted(() => {
  const contentElement = contentRef.value;
  if (!contentElement) {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    if (!shouldStickToBottom.value) {
      return;
    }

    void nextTick(() => {
      scrollToBottom();
    });
  });

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

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
