<template>
  <div class="flex gap-3 items-start">
    <!-- Agent Avatar -->
    <div class="shrink-0 w-10 h-10">
      <div
        v-if="agent?.avatarFileId"
        class="w-10 h-10 rounded-md shadow bg-cyan-400 flex items-center justify-center text-white font-semibold text-sm overflow-hidden"
      >
        <img
          :src="`/api/images/${agent.avatarFileId}`"
          :alt="agent.name"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        v-else
        class="w-10 h-10 rounded-md shadow bg-cyan-400 flex items-center justify-center text-white font-semibold text-sm"
      >
        {{ agent?.name?.charAt(0)?.toUpperCase() ?? "A" }}
      </div>
    </div>

    <!-- Bubble Content -->
    <div class="flex-1 min-w-0">
      <div
        class="rounded-md pt-2 [&>div]:px-3 rounded-tl-md shadow backdrop-blur-sm transition-all duration-300 v gap-1"
        :class="
          isLatest
            ? 'bg-primary/6 border border-primary/10'
            : 'bg-white/80 border border-cyan-100/30'
        "
      >
        <!-- Agent Name + Status -->
        <div class="flex items-center justify-between gap-2 mb-2">
          <h4 class="text-sm font-semibold text-gray-900 truncate">
            {{ agent?.name || `Agent #${agentTask.agentId}` }}
          </h4>
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Status Icon -->
            <svg
              v-if="visualState === 'running'"
              class="w-4 h-4 animate-spin text-secondary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <svg
              v-else-if="visualState === 'success'"
              class="w-4 h-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <svg
              v-else-if="visualState === 'failed'"
              class="w-4 h-4 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <svg
              v-else
              class="w-4 h-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            <!-- Timestamp -->
            <TimeDisplay
              class="text-xs text-gray-500 whitespace-nowrap"
              :timestamp="agentTask.assignedAt"
            />
          </div>
        </div>

        <!-- Summary Text -->
        <div
          class="text-sm leading-relaxed break-all mb-2"
          :class="statusTextClass"
        >
          {{ summaryText }}
        </div>
        <div
          v-if="isLatest && showChatHistories"
          class="max-h-72 overflow-y-auto py-3 bg-primary/5"
        >
          <!-- Chat Histories for Latest Task -->
          <ChatHistoryDisplay :agent-task-id="agentTask.id" :max-items="10" />
        </div>
        <!-- placeholder -->
        <div v-else class="h-1.5"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AgentResponse, AgentTaskResponse } from "@/api";
import ChatHistoryDisplay from "@/components/ChatHistoryDisplay.vue";
import TimeDisplay from "@/components/TimeDisplay.vue";

const props = defineProps<{
  agentTask: AgentTaskResponse;
  agent?: AgentResponse;
  isLatest?: boolean;
  showChatHistories?: boolean;
}>();

function getTaskStateText(state: string): string {
  const normalized = state.toUpperCase();
  if (normalized === "PENDING") return "排队中";
  if (normalized === "ACTIVE") return "执行中";
  if (normalized === "FINISHED") return "已完成";
  if (normalized === "FAILED") return "失败";
  if (normalized === "CANCELLED") return "已取消";
  if (normalized === "TRANSFERRED") return "已转移";
  return state;
}

function getVisualState(agentTask: AgentTaskResponse): string {
  const normalized = (agentTask.state || "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "PENDING") {
    return "running";
  }
  if (normalized === "FINISHED" || normalized === "TRANSFERRED") {
    return "success";
  }
  if (normalized === "FAILED") {
    return "failed";
  }
  return "default";
}

const visualState = computed(() => getVisualState(props.agentTask));

const summaryText = computed(() => {
  const state = getVisualState(props.agentTask);
  if (state === "running") return "进行中...";
  const summary = props.agentTask.result?.submission?.summary;
  if (summary?.trim()) return summary.trim();
  return getTaskStateText(props.agentTask.state);
});

const statusTextClass = computed(() => {
  const state = visualState.value;
  if (state === "success") {
    return " text-xs ";
  }
  if (state === "failed") {
    return "text-red-600 text-xs";
  }
  if (state === "running") {
    return "text-secondary text-xs";
  }
  return "text-xs";
});
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
