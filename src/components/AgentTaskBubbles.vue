<template>
  <div class="flex flex-col h-full min-w-0 v gap-4">
    <!-- Header: Task Info -->
    <div class="backdrop-blur-sm">
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0 v gap-1">
          <div
            class="text-xs text-cyan-600/70 uppercase tracking-wider font-semibold"
          >
            Task #{{ task.id }}
          </div>
          <h3 class="font-semibold text-black mt-1.5 break-all line-clamp-3">
            {{ task.content }}
          </h3>
        </div>
        <button
          class="shrink-0 w-5 cursor-pointer h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
          @click="$emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Agent Tasks List -->
    <div class="flex-1 v items-start gap-4">
      <template v-if="!sortedAgentTasks || sortedAgentTasks.length === 0">
        <div
          class="flex items-center justify-center h-full text-sm text-gray-500"
        >
          暂无 Agent 执行结果
        </div>
      </template>
      <template v-else>
        <AgentTaskBubble
          v-for="(agentTask, idx) in sortedAgentTasks"
          :key="agentTask.id"
          :agent-task="agentTask"
          :agent="getAgentForTask(agentTask)"
          :is-latest="idx === 0"
          :show-chat-histories="idx === 0"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AgentResponse, AgentTaskResponse, TaskResponse } from "@/api";
import AgentTaskBubble from "@/components/AgentTaskBubble.vue";

const props = defineProps<{
  task: TaskResponse;
  allAgents: AgentResponse[];
}>();

const emit = defineEmits<{
  close: [];
}>();

function getAgentForTask(
  agentTask: AgentTaskResponse,
): AgentResponse | undefined {
  return props.allAgents.find((a) => a.id === agentTask.agentId);
}

const sortedAgentTasks = computed(() => {
  return [...(props.task.agentTasks ?? [])].sort((a, b) => b.id - a.id);
});
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
