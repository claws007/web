<template>
  <ATooltip
    :open="visible && !visibleDisableController"
    @update:open="(val) => (visible = val)"
    :placement
    :title="$slots.content ? undefined : (content ?? '')"
  >
    <!-- overlay-class-name="pointer-events-none" -->
    <!-- :visible="!!content && visibleController"
    @update:visible="(val) => (visibleController = val)" -->
    <slot></slot>
    <template #title>
      <slot name="content"></slot>
    </template>
  </ATooltip>
</template>
<script setup lang="ts">
import { type TooltipPlacement } from "@/types";

const props = defineProps<{
  content?: string;
  placement?: TooltipPlacement;
  visibleDisableController?: boolean;
}>();

const visible = ref(false);
watch(
  () => props.visibleDisableController,
  (val) => {
    if (!val) {
      visible.value = false;
    }
  },
);
</script>
