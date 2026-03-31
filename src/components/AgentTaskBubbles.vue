<template>
  <div class="flex flex-col h-full min-w-0 v [&>div]:px-5">
    <!-- Header: Task Info -->
    <div class="py-3 bg-primary/6">
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
    <AutoStickBottom class="flex-1 py-5" :reset-key="props.task.id">
      <div class="v items-start gap-6">
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
            :is-latest="idx === sortedAgentTasks.length - 1"
            :show-chat-histories="idx === sortedAgentTasks.length - 1"
          />
        </template>
      </div>
    </AutoStickBottom>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { readStoredActiveCompanyId } from "@/api";
import type { AgentResponse, AgentTaskResponse, TaskResponse } from "@/api";
import type {
  EntityChangePayload,
  AgentTaskEntityRecord,
} from "@/api/generated-ws";
import AutoStickBottom from "@/components/AutoStickBottom.vue";
import AgentTaskBubble from "@/components/AgentTaskBubble.vue";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { useUserStore } from "@/store/user";

const props = defineProps<{
  task: TaskResponse;
  allAgents: AgentResponse[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const userStore = useUserStore();
const localAgentTasks = ref<AgentTaskResponse[]>([
  ...(props.task.agentTasks ?? []),
]);

// Only reset local state when the selected task itself changes (different task ID).
// Changes to agentTasks within the same task are handled by realtime CUD events to avoid
// race conditions where a prop reset re-introduces stale data after CUD-based cleanups.
watch(
  () => props.task.id,
  () => {
    localAgentTasks.value = [...(props.task.agentTasks ?? [])];
  },
);

let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

function toAgentTaskResponse(
  record: AgentTaskEntityRecord,
  existing?: AgentTaskResponse,
): AgentTaskResponse {
  return {
    id: record.id,
    agentId: record.agentId,
    content: record.content,
    ac: (record.ac as string | null) ?? existing?.ac ?? null,
    state: record.state,
    queueOrder: record.queueOrder,
    assignedAt: record.assignedAt,
    startedAt:
      (record.startedAt as string | null) ?? existing?.startedAt ?? null,
    finishedAt:
      (record.finishedAt as string | null) ?? existing?.finishedAt ?? null,
    updatedAt: record.updatedAt,
  };
}

function handleEntityChange(payload: EntityChangePayload) {
  if (payload.entity !== "agent_task") {
    return;
  }

  if (payload.operation === "delete") {
    const deletedId = Number(
      (payload.record as { id?: unknown }).id ?? payload.entityId,
    );
    if (!Number.isFinite(deletedId) || deletedId <= 0) {
      return;
    }
    const idx = localAgentTasks.value.findIndex(
      (agentTask) => agentTask.id === deletedId,
    );
    if (idx !== -1) {
      localAgentTasks.value.splice(idx, 1);
    }
    return;
  }

  const record = payload.record as AgentTaskEntityRecord;
  if (record.taskId !== props.task.id) {
    return;
  }

  const idx = localAgentTasks.value.findIndex(
    (agentTask) => agentTask.id === record.id,
  );
  if (idx === -1) {
    localAgentTasks.value.push(toAgentTaskResponse(record));
    return;
  }

  const existing = localAgentTasks.value[idx];
  localAgentTasks.value[idx] = toAgentTaskResponse(record, existing);
}

function startRealtime() {
  const token = userStore.token?.trim() || null;
  const companyId = readStoredActiveCompanyId();
  if (!token || !companyId) {
    return;
  }

  releaseSubscriptionDemand ??= requestRealtimeSubscription({
    token,
    companyId,
    events: ["entity_change"],
    entities: ["agent_task"],
  });

  unsubscribeEntityChange ??= registerEntityChangeHandler(handleEntityChange, {
    entities: ["agent_task"],
  });
}

function stopRealtime() {
  unsubscribeEntityChange?.();
  unsubscribeEntityChange = null;
  releaseSubscriptionDemand?.();
  releaseSubscriptionDemand = null;
}

onMounted(startRealtime);
onBeforeUnmount(stopRealtime);

function getAgentForTask(
  agentTask: AgentTaskResponse,
): AgentResponse | undefined {
  return props.allAgents.find((a) => a.id === agentTask.agentId);
}

const sortedAgentTasks = computed(() => {
  return [...localAgentTasks.value].sort((a, b) => a.id - b.id);
});
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
