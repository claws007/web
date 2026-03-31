<template>
  <AutoStickBottom :reset-key="props.agentTaskId">
    <ChatHistoryDisplay v-bind="{ ...props }" />
  </AutoStickBottom>
</template>

<script setup lang="ts">
import AutoStickBottom from "@/components/AutoStickBottom.vue";
import ChatHistoryDisplay from "@/components/ChatHistoryDisplay.vue";

const props = defineProps<{
  agentTaskId: number;
  maxItems?: number;
}>();
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
