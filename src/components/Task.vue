<template>
  <article
    class="group relative"
    role=" region"
    :aria-label="`任务 #${task.id}`"
    :aria-selected="selected"
  >
    <div
      v-if="!isEditing"
      class="z-10 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 duration-200 transition-opacity"
    >
      <ActionBar :items="taskActionItems" />
    </div>
    <div
      :class="[
        selected
          ? 'border-cyan-500/40 bg-primary/5'
          : 'border-black/8 bg-white/50',
        isCompleted && !selected ? 'opacity-65' : '',
      ]"
      class="flex shadow flex-col gap-3.5 rounded-sm border p-4 backdrop-blur-xl outline-none transition-[background-color,border-color] duration-150 cursor-pointer"
    >
      <div class="flex items-start justify-between gap-2.4 min-w-0">
        <div class="min-w-0 flex-1 flex flex-col gap-1.8">
          <template v-if="isEditing">
            <div class="grid gap-2">
              <Textarea
                :model-value="editContent"
                class="min-h-20 resize-vertical rounded-md border border-cyan-500/24 bg-white/95 p-2.6 text-sm text-black outline-none transition-[border-color] focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/15"
                @input="onEditInput"
              />
              <div class="flex justify-end gap-2">
                <Button
                  size="small"
                  :disabled="saving"
                  @click.stop="$emit('cancel-edit')"
                >
                  取消
                </Button>
                <Button
                  size="small"
                  type="primary"
                  :disabled="saving"
                  @click.stop="$emit('save', task.id)"
                >
                  {{ saving ? "保存中..." : "保存" }}
                </Button>
              </div>
            </div>
          </template>
          <template v-else>
            <h3 class="m-0 text-sm text-black break-all">
              {{ localTask.content }}
            </h3>
          </template>
        </div>
      </div>
      <template v-if="latestAgentTask">
        <div class="border-t border-dashed border-cyan-500/25"></div>
        <div class="inline-flex items-center gap-1.5 text-xs min-w-0">
          <TaskStatusRunningIcon
            v-if="getAgentTaskVisualState(latestAgentTask) === 'running'"
            class="size-3.5 shrink-0 animate-spin text-secondary"
            aria-hidden="true"
          />
          <TaskStatusSuccessIcon
            v-else-if="getAgentTaskVisualState(latestAgentTask) === 'success'"
            class="size-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <TaskStatusFailedIcon
            v-else-if="getAgentTaskVisualState(latestAgentTask) === 'failed'"
            class="size-3.5 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <TaskStatusDefaultIcon
            v-else
            class="size-3.5 shrink-0 text-foreground-muted"
            aria-hidden="true"
          />
          <span :class="getAgentTaskStatusTextClass(latestAgentTask)">
            {{ getAgentTaskSummaryText(latestAgentTask) }}
          </span>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  readStoredActiveCompanyId,
  type AgentTaskResponse,
  type TaskResponse,
} from "@/api";
import ActionBar, { type ActionBarItem } from "@/components/ActionBar.vue";
import {
  DeleteIcon,
  EditIcon,
  TaskAssignIcon,
  TaskReassignIcon,
  TaskStatusDefaultIcon,
  TaskStatusFailedIcon,
  TaskStatusRunningIcon,
  TaskStatusSuccessIcon,
} from "@/components/icons";
import { useUserStore } from "@/store/user";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import type {
  AgentDeleteTombstone,
  AgentTaskEntityRecord,
  EntityChangePayload,
  EntityOperation,
  TaskEntityRecord,
} from "@/api/generated-ws";

const props = defineProps<{
  task: TaskResponse;
  isEditing: boolean;
  editContent: string;
  saving: boolean;
  selected?: boolean;
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
}

function startRealtime() {
  const token = userStore.token?.trim() || null;
  const companyId = readStoredActiveCompanyId();
  if (!token || !companyId) return;

  releaseSubscriptionDemand ??= requestRealtimeSubscription({
    token,
    companyId,
    events: ["entity_change"],
    entities: ["task", "agent_task"],
  });

  unsubscribeEntityChange ??= registerEntityChangeHandler(handleEntityChange, {
    entities: ["task", "agent_task"],
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

function getAgentTaskSummaryText(agentTask: AgentTaskResponse) {
  const visualState = getAgentTaskVisualState(agentTask);
  if (visualState === "running") return "进行中";
  const summary = agentTask.result?.submission?.summary;
  if (summary?.trim()) return summary.trim();
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

const agentTasks = computed<AgentTaskResponse[]>(() =>
  [...localAgentTasks.value].sort((a, b) => b.id - a.id),
);

const taskActionItems = computed<ActionBarItem[]>(() => {
  const hasAgentTask = agentTasks.value.length > 0;
  return [
    {
      key: "assign",
      title: hasAgentTask ? "重新分配给员工" : "分配给员工",
      ariaLabel: hasAgentTask ? "重新分配给员工" : "分配给员工",
      iconKey: hasAgentTask ? "reassign" : "assign",
      icon: hasAgentTask ? TaskReassignIcon : TaskAssignIcon,
      disabled: props.saving,
      onClick: () => emit("assign", localTask.value),
    },
    {
      key: "edit",
      title: "编辑",
      ariaLabel: "编辑任务",
      iconKey: "edit",
      icon: EditIcon,
      disabled: props.saving,
      onClick: () => emit("edit", localTask.value),
    },
    {
      key: "delete",
      title: "删除",
      ariaLabel: "删除任务",
      iconKey: "delete",
      icon: DeleteIcon,
      className:
        "hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600",
      disabled: props.saving,
      onClick: () => emit("delete", props.task.id),
    },
  ];
});

const latestAgentTask = computed(() => agentTasks.value[0] ?? null);

const isCompleted = computed(() => computeTaskChainStatus() === "completed");
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
