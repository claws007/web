<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  api,
  getImageUrlByFileId,
  readStoredActiveCompanyId,
  type AgentResponse,
} from "@/api";
import { useUserStore } from "@/store/user";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import DropdownMenu, {
  type DropdownMenuItem,
} from "@/components/DropdownMenu.vue";
import { dialogs } from "virtual:dialogs";
import type {
  AgentEntityRecord,
  AgentTaskEntityRecord,
  AgentDeleteTombstone,
  EntityChangePayload,
  EntityOperation,
  TaskEntityRecord,
} from "@/api/generated-ws";

const props = defineProps<{
  agent: AgentResponse;
}>();

const emit = defineEmits<{
  edit: [agent: AgentResponse];
  delete: [agent: AgentResponse];
  removeById: [agentId: number];
  "task-change": [
    payload: {
      taskId: number;
      operation: EntityOperation;
      source: "task" | "agent_task";
      content: string | null;
    },
  ];
}>();

const avatarLoadFailed = ref(false);
const userStore = useUserStore();

type LatestTaskSummary = {
  id: number;
  agentId: number;
  taskId: number | null;
  state: string;
  content: string | null;
  taskContent: string | null;
  updatedAt: string | null;
};

const liveAgent = ref<AgentResponse>(props.agent);
const latestTask = ref<LatestTaskSummary | null>(null);
let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

function asPositiveInt(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

function getTaskContentFromAgentTask(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as {
    taskContent?: unknown;
    task?: { content?: unknown };
  };

  if (typeof data.taskContent === "string") {
    return data.taskContent;
  }

  if (typeof data.task?.content === "string") {
    return data.task.content;
  }

  return null;
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toLatestTaskSummary(task: {
  id: number;
  agentId: number;
  taskId?: number | null;
  state: string;
  content?: string | null;
  taskContent?: string | null;
  updatedAt?: string | null;
}): LatestTaskSummary {
  return {
    id: task.id,
    agentId: task.agentId,
    taskId: task.taskId ?? null,
    state: task.state,
    content: task.content ?? null,
    taskContent: task.taskContent ?? null,
    updatedAt: task.updatedAt ?? null,
  };
}

function shouldReplaceLatestTask(nextTask: LatestTaskSummary): boolean {
  if (!latestTask.value) {
    return true;
  }

  const currentUpdatedAt = toTimestamp(latestTask.value.updatedAt);
  const nextUpdatedAt = toTimestamp(nextTask.updatedAt);
  if (nextUpdatedAt !== currentUpdatedAt) {
    return nextUpdatedAt > currentUpdatedAt;
  }

  return nextTask.id >= latestTask.value.id;
}

async function refreshLatestTask() {
  const agentId = liveAgent.value.id;
  if (!agentId) {
    latestTask.value = null;
    return;
  }

  try {
    const firstPage = await api.agent.getAgentByIdTasks(agentId, {
      query: { page: 1, pageSize: 1 },
    } as any);

    const firstPageItems = firstPage.data.items ?? [];
    if (firstPageItems.length === 0 || firstPage.data.totalPages <= 0) {
      latestTask.value = null;
      return;
    }

    const targetPage = firstPage.data.totalPages;
    const targetItems =
      targetPage <= 1
        ? firstPageItems
        : ((
            await api.agent.getAgentByIdTasks(agentId, {
              query: { page: targetPage, pageSize: 1 },
            } as any)
          ).data.items ?? []);

    const newest = targetItems[0];
    if (!newest) {
      latestTask.value = null;
      return;
    }

    const nextLatestTask = toLatestTaskSummary({
      id: newest.id,
      agentId: newest.agentId,
      taskId: asPositiveInt((newest as { taskId?: unknown }).taskId),
      state: newest.state,
      content: newest.content ?? null,
      taskContent: getTaskContentFromAgentTask(newest),
      updatedAt: newest.updatedAt ?? null,
    });
    latestTask.value = nextLatestTask;
  } catch {
    // Ignore transient errors for per-card status refresh.
  }
}

function applyAgentRecordPatch(record: AgentEntityRecord) {
  const avatarFileId = (record as { avatarFileId?: number | null })
    .avatarFileId;

  liveAgent.value = {
    ...liveAgent.value,
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    description: (record.description as string | null) ?? null,
    capacity: (record.capacity as string | null) ?? null,
    model: (record.model as string | null) ?? null,
    sandboxType: record.sandboxType,
    containerImage: (record.containerImage as string | null) ?? null,
    avatarFileId: typeof avatarFileId === "number" ? avatarFileId : null,
    modelConnectorId: record.modelConnectorId,
    // Entity change payload does not include nested modelConnector detail.
    modelConnector:
      liveAgent.value.modelConnectorId === record.modelConnectorId
        ? liveAgent.value.modelConnector
        : undefined,
  };
}

function handleEntityChange(payload: EntityChangePayload) {
  const agentId = liveAgent.value.id;
  if (!agentId) {
    return;
  }

  const entity = String(payload.entity);

  if (entity === "agent") {
    if (Number(payload.entityId) !== agentId) {
      return;
    }

    if (payload.operation === "delete") {
      emit("removeById", agentId);
      return;
    }

    applyAgentRecordPatch(payload.record as AgentEntityRecord);
    return;
  }

  if (entity === "task") {
    const changedTaskId =
      asPositiveInt(payload.entityId) ??
      asPositiveInt((payload.record as { id?: unknown }).id);
    if (!changedTaskId || latestTask.value?.taskId !== changedTaskId) {
      return;
    }

    if (payload.operation === "delete") {
      latestTask.value = {
        ...latestTask.value,
        taskContent: null,
      };
      emit("task-change", {
        taskId: changedTaskId,
        operation: payload.operation,
        source: "task",
        content: null,
      });
      return;
    }

    const taskRecord = payload.record as TaskEntityRecord;
    const taskContent = taskRecord.content;
    latestTask.value = {
      ...latestTask.value,
      taskContent,
    };
    emit("task-change", {
      taskId: changedTaskId,
      operation: payload.operation,
      source: "task",
      content: taskContent,
    });
    return;
  }

  if (entity !== "agent_task") {
    return;
  }

  const record = payload.record as AgentTaskEntityRecord;
  const recordAgentId = Number(record?.agentId);
  const recordTaskId = asPositiveInt(record.taskId);
  if (recordAgentId !== agentId) {
    return;
  }

  if (payload.operation === "delete") {
    const deletedTask = payload.record as AgentDeleteTombstone;
    if (latestTask.value && latestTask.value.id === deletedTask.id) {
      const deletedTaskId = latestTask.value.taskId;
      latestTask.value = null;
      if (deletedTaskId) {
        emit("task-change", {
          taskId: deletedTaskId,
          operation: "update",
          source: "agent_task",
          content: null,
        });
      }
    }
    return;
  }

  const incoming = toLatestTaskSummary({
    id: Number(payload.entityId),
    agentId: recordAgentId,
    taskId: recordTaskId,
    state: record.state,
    content: (record as any).content ?? null,
    taskContent:
      getTaskContentFromAgentTask(record) ??
      (latestTask.value?.taskId === recordTaskId
        ? latestTask.value.taskContent
        : null),
    updatedAt: record.updatedAt,
  });

  if (shouldReplaceLatestTask(incoming)) {
    latestTask.value = incoming;
  }

  if (recordTaskId) {
    emit("task-change", {
      taskId: recordTaskId,
      operation: payload.operation,
      source: "agent_task",
      content: getTaskContentFromAgentTask(record),
    });
  }
}

async function startCardRealtime() {
  const token = userStore.token?.trim() || null;
  const companyId = readStoredActiveCompanyId();
  if (!token || !companyId) {
    return;
  }

  if (!releaseSubscriptionDemand) {
    releaseSubscriptionDemand = requestRealtimeSubscription({
      token,
      companyId,
      events: ["entity_change"],
      entities: ["agent", "agent_task", "task"],
    });
  }

  if (!unsubscribeEntityChange) {
    unsubscribeEntityChange = registerEntityChangeHandler(handleEntityChange, {
      entities: ["agent", "agent_task", "task"],
    });
  }
}

watch(
  () => props.agent,
  (nextAgent) => {
    liveAgent.value = nextAgent;
  },
  { immediate: true },
);

watch(
  () => props.agent.avatarFileId,
  () => {
    avatarLoadFailed.value = false;
  },
);

const avatarUrl = computed(() => {
  if (avatarLoadFailed.value) {
    return null;
  }

  return getImageUrlByFileId(liveAgent.value.avatarFileId);
});

const avatarText = computed(() => {
  const name = liveAgent.value.name?.trim();
  if (!name) {
    return "AG";
  }

  return name.slice(0, 2).toUpperCase();
});

const agentName = computed(() => liveAgent.value.name || "未命名 Agent");

const abilityIntro = computed(() => {
  return (
    liveAgent.value.capacity?.trim() ||
    liveAgent.value.description?.trim() ||
    "暂无能力简介"
  );
});

const modelConnectorName = computed(() => {
  return (
    liveAgent.value.modelConnector?.name?.trim() ||
    liveAgent.value.model?.trim() ||
    "-"
  );
});
const modelName = computed(() => {
  return liveAgent.value.model?.trim() || "-";
});

const sandboxLabel = computed(() => {
  if (!liveAgent.value.sandboxType || liveAgent.value.sandboxType === "NONE") {
    return "无沙箱";
  }

  if (liveAgent.value.sandboxType === "DOCKER") {
    return "Docker";
  }

  return liveAgent.value.sandboxType;
});

const isSandboxMode = computed(() => {
  const sandboxType = (liveAgent.value.sandboxType || "NONE").toUpperCase();
  return sandboxType !== "NONE";
});

const settingMenus = computed<DropdownMenuItem[]>(() => [
  { key: "mcp-server", label: "MCPServer" },
  {
    key: "file-permission",
    label: "FilePermission",
    disabled: !isSandboxMode.value,
    description: !isSandboxMode.value ? "仅沙盒模式可用" : undefined,
  },
  { key: "skill", label: "Skill" },
]);

async function handleSettingMenuSelect(menu: DropdownMenuItem) {
  const agentId = liveAgent.value.id;
  if (!agentId) {
    return;
  }

  if (menu.key === "mcp-server") {
    await dialogs.ManageAgentMcpServerDialog({
      agentId,
      agentName: agentName.value,
    });
    return;
  }

  if (menu.key === "file-permission") {
    if (!isSandboxMode.value) {
      return;
    }
    await dialogs.ManageAgentFilePermissionDialog({
      agentId,
      agentName: agentName.value,
    });
    return;
  }

  if (menu.key === "skill") {
    await dialogs.ManageAgentSkillDialog({
      agentId,
      agentName: agentName.value,
    });
  }
}

const latestTaskStateInfo = computed(() => {
  const state = latestTask.value?.state;
  const content = latestTask.value?.content;
  // Helper function to get truncated content summary
  const getContentSummary = () => {
    if (!content || !content.trim()) {
      return null;
    }
    // Try to parse JSON if it's a JSON string
    try {
      const parsed = JSON.parse(content);
      const text =
        parsed.text ||
        parsed.content ||
        parsed.message ||
        JSON.stringify(parsed).substring(0, 1024);
      return typeof text === "string" ? text.substring(0, 1024) : null;
    } catch {
      // If not JSON, just return the content
      return content.substring(0, 1024);
    }
  };

  if (!state) {
    return {
      text: "暂无任务",
      icon: "none",
      color: "task-state-muted",
    };
  }

  const normalized = state.toUpperCase();
  const contentSummary = getContentSummary();

  if (normalized === "PENDING") {
    return {
      text: contentSummary || "排队中",
      icon: "pending",
      color: "task-state-secondary",
    };
  }
  if (normalized === "ACTIVE") {
    return {
      text: contentSummary || "执行中",
      icon: "loading",
      color: "task-state-secondary",
    };
  }
  if (normalized === "FINISHED") {
    return {
      text: contentSummary || "已完成",
      icon: "check",
      color: "task-state-primary",
    };
  }
  if (normalized === "FAILED") {
    return {
      text: contentSummary || "失败",
      icon: "error",
      color: "task-state-danger",
    };
  }
  if (normalized === "CANCELLED") {
    return {
      text: contentSummary || "已取消",
      icon: "cancelled",
      color: "task-state-muted",
    };
  }
  if (normalized === "TRANSFERRED") {
    return {
      text: contentSummary || "已转移",
      icon: "transfer",
      color: "task-state-secondary",
    };
  }

  return {
    text: contentSummary || state,
    icon: "default",
    color: "task-state-muted",
  };
});

const shouldShowLatestTaskInfo = computed(() => {
  return (latestTask.value?.state || "").toUpperCase() === "ACTIVE";
});

onMounted(async () => {
  await startCardRealtime();
  await refreshLatestTask();
});

onBeforeUnmount(() => {
  if (unsubscribeEntityChange) {
    unsubscribeEntityChange();
    unsubscribeEntityChange = null;
  }

  if (releaseSubscriptionDemand) {
    releaseSubscriptionDemand();
    releaseSubscriptionDemand = null;
  }
});
</script>

<template>
  <article
    class="flex flex-col gap-3.5 rounded-lg p-4 sm:p-3.5 bg-linear-to-br from-surface-container-lowest to-surface-container border border-primary/10 shadow-ambient backdrop-blur-xl"
    role="region"
    :aria-label="agentName"
  >
    <div class="flex items-start gap-3 min-w-0">
      <div class="shrink-0 w-12 h-12">
        <img
          v-if="avatarUrl"
          class="w-full h-full rounded-md block object-cover border border-primary/15"
          :src="avatarUrl"
          :alt="`${agentName} 头像`"
          @error="avatarLoadFailed = true"
        />
        <div
          v-else
          class="w-full h-full rounded-md flex items-center justify-center font-bold text-sm tracking-wide text-white avatar-gradient"
          aria-hidden="true"
        >
          {{ avatarText }}
        </div>
      </div>

      <div class="min-w-0 flex flex-col gap-3 items-start">
        <div class="v items-start gap-1">
          <h3
            class="text-base break-all font-bold text-on-surface leading-relaxed"
            :title="agentName"
          >
            {{ agentName }}
          </h3>
          <div class="h items-center gap-2">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs truncate chip-primary"
              :title="`${modelConnectorName} ${modelName}`"
            >
              {{ modelConnectorName }} : {{ modelName }}
            </span>
            <span
              class="inline-flex items-center max-w-full rounded-full px-2.5 py-0.5 text-xs truncate chip-tertiary"
            >
              {{ sandboxLabel }}
            </span>
          </div>
          <p
            class="text-on-surface-variant text-xs leading-relaxed overflow-hidden line-clamp-2"
            :title="abilityIntro"
          >
            {{ abilityIntro }}
          </p>
        </div>
        <span
          v-if="shouldShowLatestTaskInfo"
          class="v gap-1 max-w-full text-xs break-all items-start"
          :class="latestTaskStateInfo.color"
          :title="latestTask?.content || latestTaskStateInfo.text"
        >
          <div class="h items-center gap-1 text-foreground">
            <svg
              class="w-3.5 h-3.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 11l3 3L22 4" />
              <path
                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
              />
            </svg>
            <div>
              {{ latestTask?.taskContent || "暂无关联任务内容" }}
            </div>
          </div>
          <div class="h items-start gap-1 pl-4">
            <!-- Loading icon for ACTIVE -->
            <svg
              v-if="latestTaskStateInfo.icon === 'loading'"
              class="w-3.5 h-3.5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <!-- Check icon for FINISHED -->
            <svg
              v-else-if="latestTaskStateInfo.icon === 'check'"
              class="w-3.5 h-3.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <!-- Error icon for FAILED -->
            <svg
              v-else-if="latestTaskStateInfo.icon === 'error'"
              class="w-3.5 h-3.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {{ latestTaskStateInfo.text }}
          </div>
        </span>
      </div>
    </div>

    <div
      class="flex gap-1 shrink-0 action-button-group bg-white rounded-md shadow-md p-1 absolute right-2 top-2"
    >
      <button
        class="inline-flex items-center justify-center w-7 h-7 rounded-md border border-transparent bg-transparent cursor-pointer text-on-surface-variant transition-all duration-120 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
        title="编辑"
        aria-label="编辑 Agent"
        @click.stop="emit('edit', liveAgent)"
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
      <DropdownMenu
        placement="bottom"
        :menus="settingMenus"
        @select="handleSettingMenuSelect"
      >
        <template #trigger="{ open }">
          <button
            class="inline-flex items-center justify-center w-7 h-7 rounded-md border border-transparent bg-transparent cursor-pointer text-on-surface-variant transition-all duration-120 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
            title="设置"
            aria-label="设置 Agent"
            :aria-expanded="open"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="transition-transform duration-200"
              :class="{ 'rotate-90': open }"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 7.2a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.25V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
          </button>
        </template>
      </DropdownMenu>

      <button
        class="inline-flex items-center justify-center w-7 h-7 rounded-md border border-transparent bg-transparent cursor-pointer text-on-surface-variant transition-all duration-120 danger-btn"
        title="删除"
        aria-label="删除 Agent"
        @click.stop="emit('delete', liveAgent)"
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
  </article>
</template>

<style scoped>
:root {
  --primary: #006877;
  --secondary: #7825ea;
  --tertiary: #a43073;
  --primary-soft: #a2eeff;
  --tertiary-soft: #ffd7eb;
  --foreground-muted: #5a666d;
  --on-surface: rgb(16, 16, 16);
  --on-surface-variant: rgb(70, 70, 70);
}

/* Avatar gradient using theme colors */
.avatar-gradient {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

/* Chip styles using theme colors */
.chip-primary {
  color: var(--primary);
  background-color: rgb(162 238 255 / 0.2);
  border: 1px solid rgb(0 104 119 / 0.2);
}

.chip-tertiary {
  color: var(--tertiary);
  background-color: rgb(255 215 235 / 0.2);
  border: 1px solid rgb(164 48 115 / 0.2);
}

/* Task state color utilities */
.task-state-primary {
  color: var(--primary);
}

.task-state-secondary {
  color: var(--secondary);
}

.task-state-tertiary {
  color: var(--tertiary);
}

.task-state-danger {
  color: #d32f2f;
}

.task-state-muted {
  color: var(--foreground-muted);
}

/* Button hover states with primary color */
button:hover {
  background-color: rgb(0 104 119 / 0.1);
  border-color: rgb(0 104 119 / 0.3);
  color: var(--primary);
}

button.danger-btn:hover {
  background-color: rgb(211 47 47 / 0.1);
  border-color: rgb(211 47 47 / 0.3);
  color: #d32f2f;
}

article:hover .action-button-group,
article:focus-within .action-button-group {
  opacity: 1;
}

.action-button-group {
  opacity: 0;
  transition: opacity 150ms ease;
}
</style>
