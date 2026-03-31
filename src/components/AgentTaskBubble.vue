<template>
  <div class="flex gap-3 items-start w-full">
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
    <div
      class="stretch rounded-md rounded-tl-md shadow backdrop-blur-sm transition-all duration-300 v gap-1"
      :class="
        isLatest
          ? 'bg-primary/6 border border-primary/10'
          : 'bg-white/80 border border-cyan-100/30'
      "
    >
      <Collapse v-model="isChatExpanded">
        <template #title>
          <button
            type="button"
            class="cursor-pointer hover:opacity-80 duration-300 w-full px-3 pt-2 pb-1 flex items-start gap-2 text-left"
            :aria-expanded="isChatExpanded"
            @click="isChatExpanded = !isChatExpanded"
          >
            <div class="v gap-1 flex-1 min-w-0">
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
            </div>

            <svg
              class="w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 mt-1"
              :class="isChatExpanded ? 'rotate-90' : ''"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M7.22 4.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L11.94 10 7.22 5.28a.75.75 0 010-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </template>

        <ChatHistoryContainer
          v-if="hasLoadedChatHistories"
          :agent-task-id="agentTask.id"
          class="py-3 bg-primary/5 px-3"
        />
      </Collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { AgentResponse, AgentTaskResponse } from "@/api";
import ChatHistoryContainer from "@/components/ChatHistoryContainer.vue";
import Collapse from "@/components/Collapse.vue";
import TimeDisplay from "@/components/TimeDisplay.vue";

const props = defineProps<{
  agentTask: AgentTaskResponse;
  agent?: AgentResponse;
  isLatest?: boolean;
  showChatHistories?: boolean;
}>();

const isChatExpanded = ref(Boolean(props.isLatest));
const hasLoadedChatHistories = ref(Boolean(props.isLatest));

watch(isChatExpanded, (expanded) => {
  if (expanded) {
    hasLoadedChatHistories.value = true;
  }
});

watch(
  () => props.isLatest,
  (latest) => {
    if (latest) {
      isChatExpanded.value = true;
      hasLoadedChatHistories.value = true;
    }
  },
);

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
