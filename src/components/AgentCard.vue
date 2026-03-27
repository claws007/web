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
} from "@/api/generated-ws";

const props = defineProps<{
  agent: AgentResponse;
}>();

const emit = defineEmits<{
  edit: [agent: AgentResponse];
  delete: [agent: AgentResponse];
  removeById: [agentId: number];
}>();

const avatarLoadFailed = ref(false);
const userStore = useUserStore();

type LatestTaskSummary = {
  id: number;
  agentId: number;
  state: string;
  updatedAt: string | null;
};

const liveAgent = ref<AgentResponse>(props.agent);
const latestTask = ref<LatestTaskSummary | null>(null);
let unsubscribeEntityChange: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

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
  state: string;
  updatedAt?: string | null;
}): LatestTaskSummary {
  return {
    id: task.id,
    agentId: task.agentId,
    state: task.state,
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
    latestTask.value = newest ? toLatestTaskSummary(newest) : null;
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

  if (payload.entity === "agent") {
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

  if (payload.entity !== "agent_task") {
    return;
  }

  const record = payload.record as AgentTaskEntityRecord;
  const recordAgentId = Number(record?.agentId);
  if (recordAgentId !== agentId) {
    return;
  }

  if (payload.operation === "delete") {
    const deletedTask = payload.record as AgentDeleteTombstone;
    if (latestTask.value && latestTask.value.id === deletedTask.id) {
      latestTask.value = null;
    }
    return;
  }

  const incoming = toLatestTaskSummary({
    id: Number(payload.entityId),
    agentId: recordAgentId,
    state: record.state,
    updatedAt: record.updatedAt,
  });

  if (shouldReplaceLatestTask(incoming)) {
    latestTask.value = incoming;
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
      entities: ["agent", "agent_task"],
    });
  }

  if (!unsubscribeEntityChange) {
    unsubscribeEntityChange = registerEntityChangeHandler(handleEntityChange, {
      entities: ["agent", "agent_task"],
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

const modelName = computed(() => {
  return (
    liveAgent.value.modelConnector?.name?.trim() ||
    liveAgent.value.model?.trim() ||
    "-"
  );
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

const latestTaskStateText = computed(() => {
  const state = latestTask.value?.state;
  if (!state) {
    return "最近任务: 暂无";
  }

  const normalized = state.toUpperCase();
  if (normalized === "PENDING") {
    return "最近任务: 排队中";
  }
  if (normalized === "ACTIVE") {
    return "最近任务: 执行中";
  }
  if (normalized === "FINISHED") {
    return "最近任务: 已完成";
  }
  if (normalized === "FAILED") {
    return "最近任务: 失败";
  }
  if (normalized === "CANCELLED") {
    return "最近任务: 已取消";
  }
  if (normalized === "TRANSFERRED") {
    return "最近任务: 已转移";
  }

  return `最近任务: ${state}`;
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
  <article class="agent-card" role="region" :aria-label="agentName">
    <div class="agent-main">
      <div class="agent-avatar-wrap">
        <img
          v-if="avatarUrl"
          class="agent-avatar-image"
          :src="avatarUrl"
          :alt="`${agentName} 头像`"
          @error="avatarLoadFailed = true"
        />
        <div v-else class="agent-avatar" aria-hidden="true">
          {{ avatarText }}
        </div>
      </div>

      <div class="agent-content">
        <h3 class="agent-name" :title="agentName">{{ agentName }}</h3>
        <p class="agent-intro" :title="abilityIntro">{{ abilityIntro }}</p>
      </div>
    </div>

    <div class="agent-footer">
      <div class="agent-meta">
        <span class="meta-chip" :title="`模型: ${modelName}`"
          >模型: {{ modelName }}</span
        >
        <span class="meta-chip">{{ latestTaskStateText }}</span>
        <span class="meta-chip">{{ sandboxLabel }}</span>
      </div>

      <div class="agent-actions">
        <DropdownMenu
          placement="bottom"
          :menus="settingMenus"
          @select="handleSettingMenuSelect"
        >
          <template #trigger="{ open }">
            <button
              class="action-btn"
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
          class="action-btn"
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
        <button
          class="action-btn action-btn--danger"
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
    </div>
  </article>
</template>

<style scoped>
.agent-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  border-radius: 1rem;
  padding: 1rem;
  background: linear-gradient(
    160deg,
    rgb(255 255 255 / 0.9),
    rgb(242 250 252 / 0.88)
  );
  border: 1px solid rgb(34 211 238 / 0.2);
  box-shadow: 0 14px 36px -26px rgb(0 104 119 / 0.55);
  backdrop-filter: blur(8px);
}

.agent-main {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  min-width: 0;
}

.agent-avatar-wrap {
  flex-shrink: 0;
  width: 2.7rem;
  height: 2.7rem;
}

.agent-avatar,
.agent-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 999px;
}

.agent-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.agent-avatar-image {
  display: block;
  object-fit: cover;
  border: 1px solid rgb(34 211 238 / 0.25);
}

.agent-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.agent-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--on-surface);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-intro {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.86rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.agent-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.agent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  min-width: 0;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
  color: rgb(16 67 77);
  background: rgb(224 248 253 / 0.95);
  border: 1px solid rgb(164 48 115 / 0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .agent-card {
    padding: 0.9rem;
  }

  .agent-avatar-wrap {
    width: 2.4rem;
    height: 2.4rem;
  }
}

.agent-actions {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.agent-card:hover .agent-actions,
.agent-card:focus-within .agent-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.4rem;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--on-surface-variant);
  transition:
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}

.action-btn:hover {
  background: rgb(34 211 238 / 0.12);
  border-color: rgb(34 211 238 / 0.3);
  color: var(--primary);
}

.action-btn--danger:hover {
  background: rgb(220 38 38 / 0.1);
  border-color: rgb(220 38 38 / 0.3);
  color: rgb(220 38 38);
}
</style>
