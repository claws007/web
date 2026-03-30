<template>
  <article
    class="group flex flex-col gap-3.5 rounded-sm p-4 backdrop-blur-xl shadow-sm transition-shadow duration-150 hover:shadow-md focus-within:shadow-md outline-none bg-white/50"
    role="region"
    :aria-label="`任务 #${task.id}`"
  >
    <div class="flex items-start justify-between gap-2.4 min-w-0">
      <div class="min-w-0 flex-1 flex flex-col gap-1.8">
        <template v-if="isEditing">
          <div class="grid gap-2.2">
            <textarea
              :value="editContent"
              class="min-h-20 resize-vertical rounded-md border border-cyan-500/24 bg-white/95 p-2.6 text-sm text-black outline-none transition-[border-color,box-shadow] focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/15"
              @input="onEditInput"
            />
            <div class="flex justify-end gap-1.8">
              <button
                class="h-8 rounded-full border border-cyan-500/25 bg-transparent px-3.2 text-xs text-black cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-opacity duration-150"
                :disabled="saving"
                @click="$emit('cancel-edit')"
              >
                取消
              </button>
              <button
                class="h-8 rounded-full border-transparent bg-cyan-700 px-3.2 text-xs text-white font-semibold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-opacity duration-150"
                :disabled="saving"
                @click="$emit('save', task.id)"
              >
                {{ saving ? "保存中..." : "保存" }}
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <h3
            class="m-0 text-base font-bold text-black leading-tight break-all"
          >
            {{ localTask.content }}
          </h3>
        </template>
      </div>

      <div
        class="flex gap-1.2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
      >
        <button
          class="inline-flex items-center justify-center w-7 h-7 rounded border border-transparent bg-transparent cursor-pointer text-gray-600 transition-all duration-120 hover:bg-cyan-500/12 hover:border-cyan-500/30 hover:text-cyan-700 disabled:opacity-45 disabled:cursor-not-allowed"
          title="编辑"
          aria-label="编辑任务"
          :disabled="saving"
          @click="$emit('edit', localTask)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          class="inline-flex items-center justify-center w-7 h-7 rounded border border-transparent bg-transparent cursor-pointer text-gray-600 transition-all duration-120 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 disabled:opacity-45 disabled:cursor-not-allowed"
          title="删除"
          aria-label="删除任务"
          :disabled="saving"
          @click="$emit('delete', task.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2">
      <Button
        size="small"
        :disabled="saving"
        @click="$emit('assign', localTask)"
      >
        {{ agentTasks.length > 0 ? "重新分配给员工" : "分配给员工" }}
      </Button>
    </div>
    <template
      v-if="agentTasks.length > 0 && agentTasks[0]?.state !== 'FINISHED'"
    >
      <div class="border-t border-dashed border-cyan-500/25"></div>
      <div class="v gap-5">
        <div
          v-for="agentTask in agentTasks"
          :key="agentTask.id"
          class="v items-start gap-2 min-w-0 text-gray-600 overflow-hidden"
        >
          <div
            class="flex items-center gap-2 text-gray-900 rounded-full text-sm"
          >
            <div
              class="size-9 rounded-md overflow-hidden shrink-0 inline-flex items-center justify-center border border-teal-700/20"
              aria-hidden="true"
            >
              <img
                v-if="getAgentAvatarUrl(agentTask)"
                class="w-full h-full object-cover block"
                :src="getAgentAvatarUrl(agentTask)"
                :alt="''"
              />
              <span v-else class="text-teal-700 font-bold leading-none">
                {{ getAgentAvatarText(agentTask) }}
              </span>
            </div>
            <div class="v gap-1 items-start">
              <div class="font-semibold">
                {{ getAgentName(agentTask) }}
              </div>
              <TimeDisplay
                :timestamp="agentTask.assignedAt"
                class="text-xs text-foreground-muted"
              />
            </div>
          </div>
          <div
            class="inline-flex items-center gap-1.5 text-xs leading-tight min-w-0"
          >
            <svg
              v-if="getAgentTaskVisualState(agentTask) === 'running'"
              class="size-3.5 shrink-0 animate-spin text-secondary"
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
              v-else-if="getAgentTaskVisualState(agentTask) === 'success'"
              class="size-3.5 shrink-0 text-primary"
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
              v-else-if="getAgentTaskVisualState(agentTask) === 'failed'"
              class="size-3.5 shrink-0 text-red-600"
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
              class="size-3.5 shrink-0 text-foreground-muted"
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
            <span :class="getAgentTaskStatusTextClass(agentTask)">
              {{ getAgentTaskStatusText(agentTask) }}
            </span>
          </div>
          <button
            class="relative border border-cyan-500/30 rounded-full bg-cyan-500/8 text-teal-700 text-xs leading-none px-2 py-0.72 cursor-pointer transition-colors hover:bg-cyan-500/16"
            type="button"
            @click="openAgentTaskChatHistory(agentTask.id)"
          >
            对话
            <span
              v-if="newChatAgentTaskIds.includes(agentTask.id)"
              class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-secondary"
            />
          </button>
        </div>
      </div>
    </template>
    <div
      v-else-if="
        agentTasks.length > 0 &&
        getAgentTaskVisualState(agentTasks[0]!) === 'success'
      "
      class="bg-black/2 shadow p-5 rounded-sm overflow-y-auto max-h-60 text-full"
    >
      <MarkdownPreviewer
        class="text-xs!"
        :content="agentTasks[0]?.result?.submission?.output ?? ''"
      ></MarkdownPreviewer>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  getImageUrlByFileId,
  readStoredActiveCompanyId,
  type AgentTaskResponse,
  type AgentTaskResult,
  type TaskResponse,
} from "@/api";
import { useUserStore } from "@/store/user";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import type {
  AgentDeleteTombstone,
  AgentTaskEntityRecord,
  ChatHistoryEntityRecord,
  EntityChangePayload,
  EntityOperation,
  TaskEntityRecord,
} from "@/api/generated-ws";
import { dialogs } from "virtual:dialogs";
import TimeDisplay from "@/components/TimeDisplay.vue";

const props = defineProps<{
  task: TaskResponse;
  isEditing: boolean;
  editContent: string;
  saving: boolean;
}>();

type TaskChainStatus = "completed" | "incompleteOrFailed";

const emit = defineEmits<{
  edit: [task: TaskResponse];
  delete: [taskId: number];
  assign: [task: TaskResponse];
  "cancel-edit": [];
  "update:edit-content": [content: string];
  save: [taskId: number];
  "realtime-deleted": [taskId: number];
  "realtime-agent-task-state": [
    payload: {
      taskId: number;
      agentTaskId: number;
      operation: EntityOperation | "delete";
      state: string;
      taskChainStatus: TaskChainStatus;
    },
  ];
}>();

const userStore = useUserStore();

const localTask = ref<TaskResponse>({ ...props.task });
const localAgentTasks = ref<AgentTaskResponse[]>([
  ...(props.task.agentTasks ?? []),
]);
const newChatAgentTaskIds = ref<number[]>([]);

watch(
  () => props.task,
  (next) => {
    localTask.value = { ...next };
    localAgentTasks.value = [...(next.agentTasks ?? [])];
  },
  { deep: true },
);

let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

function computeTaskChainStatus(): TaskChainStatus {
  const finishedStates = new Set(["FINISHED", "CANCELLED", "TRANSFERRED"]);
  const allDone =
    localAgentTasks.value.length > 0 &&
    localAgentTasks.value.every((at) =>
      finishedStates.has((at.state ?? "").toUpperCase()),
    );
  return allDone ? "completed" : "incompleteOrFailed";
}

function handleEntityChange(payload: EntityChangePayload) {
  const taskId = localTask.value.id;
  if (!taskId) return;

  const entity = String(payload.entity);

  if (entity === "task") {
    if (Number(payload.entityId) !== taskId) return;
    if (payload.operation === "delete") {
      emit("realtime-deleted", taskId);
      return;
    }
    const rec = payload.record as TaskEntityRecord;
    localTask.value = { ...localTask.value, content: rec.content };
    return;
  }

  if (entity === "agent_task") {
    if (payload.operation === "delete") {
      const tombstone = payload.record as AgentDeleteTombstone;
      const idx = localAgentTasks.value.findIndex(
        (at) => at.id === tombstone.id,
      );
      if (idx === -1) return;
      const deletedAt = localAgentTasks.value[idx]!;
      const deletedId = deletedAt.id;
      localAgentTasks.value.splice(idx, 1);
      newChatAgentTaskIds.value = newChatAgentTaskIds.value.filter(
        (id) => id !== deletedId,
      );
      emit("realtime-agent-task-state", {
        taskId,
        agentTaskId: deletedId,
        operation: "delete",
        state: "deleted",
        taskChainStatus: computeTaskChainStatus(),
      });
      return;
    }

    const rec = payload.record as AgentTaskEntityRecord;
    if (rec.taskId !== taskId) return;

    if (payload.operation === "create") {
      const newAt: AgentTaskResponse = {
        id: rec.id,
        agentId: rec.agentId,
        content: rec.content,
        ac: rec.ac as string | null,
        state: rec.state,
        queueOrder: rec.queueOrder,
        assignedAt: rec.assignedAt,
        startedAt: (rec.startedAt as string | null) ?? null,
        finishedAt: (rec.finishedAt as string | null) ?? null,
        updatedAt: rec.updatedAt,
      };
      localAgentTasks.value.push(newAt);
    } else {
      const idx = localAgentTasks.value.findIndex((at) => at.id === rec.id);
      if (idx !== -1) {
        const existing = localAgentTasks.value[idx]!;
        localAgentTasks.value[idx] = {
          ...existing,
          state: rec.state,
          content: rec.content,
          updatedAt: rec.updatedAt,
          startedAt: (rec.startedAt as string | null) ?? existing.startedAt,
          finishedAt: (rec.finishedAt as string | null) ?? existing.finishedAt,
        };
      }
    }

    emit("realtime-agent-task-state", {
      taskId,
      agentTaskId: rec.id,
      operation: payload.operation,
      state: rec.state,
      taskChainStatus: computeTaskChainStatus(),
    });
    return;
  }

  if (entity === "chat_history") {
    if (payload.operation !== "create") return;
    const rec = payload.record as ChatHistoryEntityRecord;
    const matchedAt = localAgentTasks.value.find(
      (at) => at.id === rec.agentTaskId,
    );
    if (!matchedAt) return;
    if (!newChatAgentTaskIds.value.includes(rec.agentTaskId)) {
      newChatAgentTaskIds.value.push(rec.agentTaskId);
    }
  }
}

function startRealtime() {
  const token = userStore.token?.trim() || null;
  const companyId = readStoredActiveCompanyId();
  if (!token || !companyId) return;

  releaseSubscriptionDemand ??= requestRealtimeSubscription({
    token,
    companyId,
    events: ["entity_change"],
    entities: ["task", "agent_task", "chat_history"],
  });

  unsubscribeEntityChange ??= registerEntityChangeHandler(handleEntityChange, {
    entities: ["task", "agent_task", "chat_history"],
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

function onEditInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit("update:edit-content", target.value);
}

function getTaskStateText(state: string) {
  const normalized = state.toUpperCase();
  if (normalized === "PENDING") return "排队中";
  if (normalized === "ACTIVE") return "执行中";
  if (normalized === "FINISHED") return "已完成";
  if (normalized === "FAILED") return "失败";
  if (normalized === "CANCELLED") return "已取消";
  if (normalized === "TRANSFERRED") return "已转移";
  return state;
}

function getAgentTaskVisualState(agentTask: AgentTaskResponse) {
  const normalized = (agentTask.state || "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "PENDING") {
    return "running" as const;
  }
  if (normalized === "FINISHED" || normalized === "TRANSFERRED") {
    return "success" as const;
  }
  if (normalized === "FAILED") {
    return "failed" as const;
  }
  return "default" as const;
}

function getAgentTaskResultText(result?: AgentTaskResult | null) {
  const candidates = [
    result?.submission?.summary,
    result?.submission?.output,
    result?.failure?.message,
    result?.validation?.stderr,
    result?.validation?.stdout,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

function getAgentTaskStatusText(agentTask: AgentTaskResponse) {
  const visualState = getAgentTaskVisualState(agentTask);
  if (visualState === "running") {
    return "进行中";
  }

  if (visualState === "success" || visualState === "failed") {
    return (
      getAgentTaskResultText(agentTask.result) ||
      getTaskStateText(agentTask.state)
    );
  }

  return getTaskStateText(agentTask.state);
}

function getAgentTaskStatusTextClass(agentTask: AgentTaskResponse) {
  const visualState = getAgentTaskVisualState(agentTask);
  if (visualState === "success") {
    return "text-primary";
  }
  if (visualState === "failed") {
    return "text-red-600";
  }
  if (visualState === "running") {
    return "text-secondary";
  }
  return "text-foreground-muted";
}

function getAgentName(agentTask: AgentTaskResponse) {
  return agentTask.agent?.name || `Agent #${agentTask.agentId}`;
}

function getAgentAvatarText(agentTask: AgentTaskResponse) {
  const name = getAgentName(agentTask).trim();
  if (!name) {
    return "A";
  }
  return name.slice(0, 1).toUpperCase();
}

function getAgentAvatarUrl(agentTask: AgentTaskResponse) {
  return (
    getImageUrlByFileId(agentTask.agent?.avatarFileId ?? null) ?? undefined
  );
}

function openAgentTaskChatHistory(agentTaskId: number) {
  if (!Number.isInteger(agentTaskId) || agentTaskId <= 0) {
    return;
  }

  newChatAgentTaskIds.value = newChatAgentTaskIds.value.filter(
    (id) => id !== agentTaskId,
  );

  const dialogMap = dialogs as unknown as {
    ManageAgentTaskChatHistoryDialog?: (props: {
      agentTaskId: number;
    }) => Promise<unknown>;
  };

  const openDialog = dialogMap.ManageAgentTaskChatHistoryDialog;
  if (!openDialog) {
    return;
  }

  void openDialog({ agentTaskId });
}

const agentTasks = computed<AgentTaskResponse[]>(() =>
  [...localAgentTasks.value].sort((a, b) => b.id - a.id),
);
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
