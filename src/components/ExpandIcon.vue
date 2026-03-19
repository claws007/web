<template>
  <CaretRightOutlined
    :class="[
      'transition-transform duration-300',
      isExpand ? 'rotate-90' : '',
      noChildren ? 'opacity-0' : '',
    ]"
  ></CaretRightOutlined>
</template>
<script setup lang="ts">
import { CaretRightOutlined } from "@ant-design/icons-vue";

defineProps<{
  isExpand: boolean;
  noChildren?: boolean;
}>();
</script>
