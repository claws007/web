<template>
  <div class="v *:px-5">
    <!-- Header: Task Info -->
    <div class="">
      <div class="p-3 bg-primary/6 rounded-md shadow">
        <div class="flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0 v gap-1">
            <div
              class="text-xs text-cyan-600/70 uppercase tracking-wider font-semibold"
            >
              Task #{{ task.id }}
            </div>
            <h3 class="line-clamp-9 mt-1.5 break-all">
              {{ task.content }}
            </h3>
          </div>
          <ActionBar
            class="shrink-0"
            :items="headerActionItems"
            container-class="h gap-1 p-0 bg-transparent shadow-none rounded-none"
            button-class="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          />
        </div>
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
import { api, readStoredActiveCompanyId } from "@/api";
import type { AgentResponse, AgentTaskResponse, TaskResponse } from "@/api";
import type {
  EntityChangePayload,
  AgentTaskEntityRecord,
} from "@/api/generated-ws";
import ActionBar, { type ActionBarItem } from "@/components/ActionBar.vue";
import AutoStickBottom from "@/components/AutoStickBottom.vue";
import AgentTaskBubble from "@/components/AgentTaskBubble.vue";
import { notify } from "@/components/notification";
import {
  AgentTaskRestartIcon,
  AgentTaskResumeIcon,
  AgentTaskStopIcon,
  CloseIcon,
} from "@/components/icons";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { useUserStore } from "@/store/user";
import { dialogs } from "virtual:dialogs";

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

const latestAgentTask = computed<AgentTaskResponse | null>(() => {
  if (sortedAgentTasks.value.length === 0) {
    return null;
  }
  return sortedAgentTasks.value[sortedAgentTasks.value.length - 1];
});

const isLatestTaskActive = computed(
  () => (latestAgentTask.value?.state ?? "").toUpperCase() === "ACTIVE",
);

const isLatestTaskCompleted = computed(() => {
  const state = (latestAgentTask.value?.state ?? "").toUpperCase();
  return state === "FINISHED" || state === "TRANSFERRED";
});

const headerActionItems = computed<ActionBarItem[]>(() => {
  const items: ActionBarItem[] = [];
  if (latestAgentTask.value) {
    if (isLatestTaskActive.value) {
      items.push({
        key: "pause-latest",
        title: "暂停最新任务",
        ariaLabel: "暂停最新任务",
        iconKey: "pause-latest",
        icon: AgentTaskStopIcon,
        className: "text-amber-700",
        onClick: stopLatestTask,
      });
    } else if (isLatestTaskCompleted.value) {
      items.push({
        key: "replay-latest",
        title: "重新开始最新任务",
        ariaLabel: "重新开始最新任务",
        iconKey: "replay-latest",
        icon: AgentTaskRestartIcon,
        onClick: restartLatestTask,
      });
    } else {
      items.push({
        key: "play-latest",
        title: "恢复最新任务",
        ariaLabel: "恢复最新任务",
        iconKey: "play-latest",
        icon: AgentTaskResumeIcon,
        onClick: resumeLatestTask,
      });
    }
  }

  items.push({
    key: "close",
    title: "关闭",
    ariaLabel: "关闭",
    iconKey: "close",
    icon: CloseIcon,
    onClick: () => emit("close"),
  });

  return items;
});

async function stopLatestTask() {
  const latest = latestAgentTask.value;
  if (!latest) {
    return;
  }
  try {
    await api.agentTask.postAgentTaskByIdStop(latest.id);
    notify.success("任务已停止");
  } catch (error) {
    notify.error(error instanceof Error ? error.message : "停止任务失败");
  }
}

async function resumeLatestTask() {
  const latest = latestAgentTask.value;
  if (!latest) {
    return;
  }

  dialogs
    .ConfirmDialog({
      title: "恢复任务",
      content:
        "恢复任务会删除该任务后续的所有子任务，再从当前 AgentTask 继续执行，是否继续？",
      confirmText: "恢 复 任 务",
      confirmType: "warning",
    })
    .resolve(async () => {
      const result = await dialogs.TextPromptDialog({
        title: "恢复任务",
        description: "可以补充说明，也可以留空直接恢复。",
        placeholder: "输入额外信息（可选）",
        confirmText: "恢 复",
        required: false,
        rows: 4,
      });
      if (result.type !== "resolve") {
        return;
      }

      try {
        await api.agentTask.postAgentTaskByIdRetryContinue(latest.id, {
          message: result.value || undefined,
        });
        notify.success("任务已恢复");
      } catch (error) {
        notify.error(error instanceof Error ? error.message : "恢复任务失败");
      }
    });
}

async function restartLatestTask() {
  const latest = latestAgentTask.value;
  if (!latest) {
    return;
  }

  dialogs
    .ConfirmDialog({
      title: "重新开始",
      content:
        "重新开始会删除该对话后的所有内容，再从当前 AgentTask 重新开始，是否继续？",
      confirmText: "重 新 开 始",
      confirmType: "danger",
    })
    .resolve(async () => {
      try {
        await api.agentTask.postAgentTaskByIdRetry(latest.id);
        notify.success("已重新开始任务");
      } catch (error) {
        notify.error(error instanceof Error ? error.message : "重新开始失败");
      }
    });
}
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
