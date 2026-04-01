<template>
  <div class="flex gap-3 items-start w-full group">
    <!-- Agent Avatar -->
    <div class="shrink-0 w-10 h-10 sticky top-0">
      <div
        v-if="localAgent?.avatarFileId"
        class="w-10 h-10 rounded-md shadow bg-cyan-400 flex items-center justify-center text-white font-semibold text-sm overflow-hidden"
      >
        <img
          :src="`/api/images/${localAgent!.avatarFileId}`"
          :alt="localAgent!.name"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        v-else
        class="w-10 h-10 rounded-md shadow bg-cyan-400 flex items-center justify-center text-white font-semibold text-sm"
      >
        {{ localAgent?.name?.charAt(0)?.toUpperCase() ?? "A" }}
      </div>
    </div>

    <!-- Bubble Content -->
    <div class="stretch transition-all duration-300 v gap-1">
      <Collapse v-model="isChatExpanded">
        <template #title>
          <div
            class="sticky top-0 shadow v gap-1 p-3 backdrop-blur-md z-20 rounded-md"
            :class="
              isLatest
                ? 'bg-primary-soft/80 border border-primary/10'
                : 'bg-white/80 border border-primary/20'
            "
          >
            <button
              type="button"
              class="cursor-pointer hover:opacity-80 duration-300 w-full flex items-start gap-2 text-left"
              :aria-expanded="isChatExpanded"
              @click="isChatExpanded = !isChatExpanded"
            >
              <div class="v gap-1 flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <h4 class="text-sm font-semibold truncate">
                    {{ localAgent?.name || `Agent #${agentTask.agentId}` }}
                  </h4>
                  <div class="flex items-center gap-4 shrink-0">
                    <ActionBar :items="taskControlItems" />
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
                      class="w-4 h-4"
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
                    <TimeDisplay
                      class="text-xs whitespace-nowrap"
                      :timestamp="agentTask.assignedAt"
                    />
                  </div>
                </div>

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
            <AgentTaskComments
              ref="commentsRef"
              :agent-task-id="agentTask.id"
            />
          </div>
        </template>

        <ChatHistoryDisplay
          v-if="hasLoadedChatHistories"
          :agent-task-id="agentTask.id"
          class="py-3 px-3"
        />
      </Collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  api,
  readStoredActiveCompanyId,
  type AgentResponse,
  type AgentTaskResponse,
} from "@/api";
import AgentTaskComments from "@/components/AgentTaskComments.vue";
import ActionBar, { type ActionBarItem } from "@/components/ActionBar.vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Collapse from "@/components/Collapse.vue";
import { notify } from "@/components/notification";
import TimeDisplay from "@/components/TimeDisplay.vue";
import { dialogs } from "virtual:dialogs";
import type {
  AgentEntityRecord,
  EntityChangePayload,
} from "@/api/generated-ws";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { useUserStore } from "@/store/user";
import {
  AgentTaskCommentIcon,
  AgentTaskRestartIcon,
  AgentTaskResumeIcon,
  AgentTaskStopIcon,
} from "@/components/icons";

const userStore = useUserStore();

const props = defineProps<{
  agentTask: AgentTaskResponse;
  agent?: AgentResponse;
  isLatest?: boolean;
  showChatHistories?: boolean;
}>();

const isChatExpanded = ref(Boolean(props.isLatest));
const hasLoadedChatHistories = ref(Boolean(props.isLatest));
const commentsRef = ref<InstanceType<typeof AgentTaskComments> | null>(null);

// Local copy of agent, kept in sync with prop and updated via CUD events.
const localAgent = ref<AgentResponse | undefined>(
  props.agent ? { ...props.agent } : undefined,
);

watch(
  () => props.agent,
  (next) => {
    localAgent.value = next ? { ...next } : undefined;
  },
);

let unsubscribeAgentChange: (() => void) | null = null;
let releaseAgentSubscription: (() => void) | null = null;

function handleAgentEntityChange(payload: EntityChangePayload) {
  if (payload.entity !== "agent") return;
  const agentId = Number(payload.entityId);
  if (!localAgent.value || localAgent.value.id !== agentId) return;

  if (payload.operation === "delete") {
    localAgent.value = undefined;
    return;
  }

  const record = payload.record as AgentEntityRecord & {
    avatarFileId?: number | null;
  };
  localAgent.value = {
    ...localAgent.value,
    name: record.name,
    extraPrompt:
      (record.extraPrompt as string | null) ?? localAgent.value.extraPrompt,
    avatarFileId:
      typeof record.avatarFileId === "number"
        ? record.avatarFileId
        : localAgent.value.avatarFileId,
  };
}

function startAgentRealtime() {
  const token = userStore.token?.trim() || null;
  const companyId = readStoredActiveCompanyId();
  if (!token || !companyId) return;

  releaseAgentSubscription ??= requestRealtimeSubscription({
    token,
    companyId,
    events: ["entity_change"],
    entities: ["agent"],
  });
  unsubscribeAgentChange ??= registerEntityChangeHandler(
    handleAgentEntityChange,
    {
      entities: ["agent"],
    },
  );
}

function stopAgentRealtime() {
  unsubscribeAgentChange?.();
  unsubscribeAgentChange = null;
  releaseAgentSubscription?.();
  releaseAgentSubscription = null;
}

onMounted(startAgentRealtime);
onBeforeUnmount(stopAgentRealtime);

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

const isTaskActive = computed(
  () => (props.agentTask.state ?? "").toUpperCase() === "ACTIVE",
);

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

const taskControlItems = computed<ActionBarItem[]>(() => {
  if (isTaskActive.value) {
    return [
      {
        key: "stop",
        title: "停止任务",
        ariaLabel: "停止任务",
        iconKey: "stop",
        icon: AgentTaskStopIcon,
        className: "text-amber-700",
        onClick: stopTask,
      },
    ];
  }

  return [
    {
      key: "resume",
      title: "恢复任务",
      ariaLabel: "恢复任务",
      iconKey: "resume",
      icon: AgentTaskResumeIcon,
      onClick: resumeTask,
    },
    {
      key: "restart",
      title: "重新开始",
      ariaLabel: "重新开始",
      iconKey: "restart",
      icon: AgentTaskRestartIcon,
      onClick: restartTask,
    },
    {
      key: "comment",
      title: "添加 Comment",
      ariaLabel: "添加 Comment",
      iconKey: "comment",
      icon: AgentTaskCommentIcon,
      onClick: openCreateCommentDialog,
    },
  ];
});

async function stopTask() {
  try {
    await api.agentTask.postAgentTaskByIdStop(props.agentTask.id);
    notify.success("任务已停止");
  } catch (error) {
    notify.error(error instanceof Error ? error.message : "停止任务失败");
  }
}

async function resumeTask() {
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
    await api.agentTask.postAgentTaskByIdRetryContinue(props.agentTask.id, {
      message: result.value || undefined,
    });
    notify.success("任务已恢复");
  } catch (error) {
    notify.error(error instanceof Error ? error.message : "恢复任务失败");
  }
}

async function restartTask() {
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
        await api.agentTask.postAgentTaskByIdRetry(props.agentTask.id);
        notify.success("已重新开始任务");
      } catch (error) {
        notify.error(error instanceof Error ? error.message : "重新开始失败");
      }
    });
}

function openCreateCommentDialog() {
  return commentsRef.value?.openCreateDialog();
}

defineExpose({
  openCreateCommentDialog() {
    return openCreateCommentDialog();
  },
});
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
