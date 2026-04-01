<script setup lang="ts">
import ActionBar, { type ActionBarItem } from "@/components/ActionBar.vue";

export type AgentCardActionItem = ActionBarItem;

const props = defineProps<{
  items: AgentCardActionItem[];
  containerClass?: string;
  buttonClass?: string;
}>();
</script>

<template>
  <ActionBar
    :items="props.items"
    :container-class="props.containerClass"
    :button-class="props.buttonClass"
  />
</template>
