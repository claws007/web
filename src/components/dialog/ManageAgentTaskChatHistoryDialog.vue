<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { api, readStoredActiveCompanyId, type AgentTaskResponse } from "@/api";
import type { ChatHistoryResponse } from "@/api/generated";
import type { EntityChangePayload } from "@/api/generated-ws";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import ChatHistoryItemCard from "@/components/dialog/ChatHistoryItemCard.vue";
import Button from "@/components/dialog/Button.vue";
import {
  isEventSubscriptionLive,
  registerEntityChangeHandler,
  registerWsCommandDispatchHandler,
  registerWsServerEventHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { useUserStore } from "@/store/user";

const props = defineProps<{
  agentTaskId: number;
}>();

const visible = ref(true);
const closing = ref(false);
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);

const agentTask = ref<AgentTaskResponse | null>(null);
const chatHistories = ref<ChatHistoryResponse[]>([]);

const userStore = useUserStore();
const { reject, resolve } = useDialogContext<void>();
defineExpose(createDialogExpose<void>());

let loadSerial = 0;
let wsReloadTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeEntityChange: (() => void) | null = null;
let unsubscribeWsCommandDispatch: (() => void) | null = null;
let unsubscribeWsServerEvent: (() => void) | null = null;
let releaseSubscriptionDemand: (() => void) | null = null;

const title = computed(() => `AgentTask #${props.agentTaskId} 对话历史`);
const subtitle = computed(() => {
  const total = chatHistories.value.length;
  const state = agentTask.value?.state?.toUpperCase() ?? "UNKNOWN";
  return `共 ${total} 条，当前状态 ${state}`;
});

const taskInfoItems = computed(() => {
  const task = agentTask.value;
  if (!task) {
    return [] as Array<{ label: string; value: string }>;
  }

  return [
    { label: "AgentTaskId", value: String(task.id) },
    { label: "AgentId", value: String(task.agentId) },
    { label: "Result", value: JSON.stringify(task.result) },
    { label: "状态", value: task.state || "-" },
    { label: "排队序", value: String(task.queueOrder) },
    { label: "分配时间", value: formatDateTime(task.assignedAt) },
    { label: "开始时间", value: formatDateTime(task.startedAt) },
    { label: "结束时间", value: formatDateTime(task.finishedAt) },
    { label: "更新时间", value: formatDateTime(task.updatedAt) },
  ];
});

const sortedHistories = computed(() => {
  return [...chatHistories.value].sort((a, b) => {
    const ta = Date.parse(a.createdAt || "") || 0;
    const tb = Date.parse(b.createdAt || "") || 0;
    if (ta !== tb) {
      return ta - tb;
    }
    return a.id - b.id;
  });
});

function close(afterLeave?: () => void) {
  if (closing.value) {
    return;
  }

  closing.value = true;
  visible.value = false;
  setTimeout(() => afterLeave?.(), 220);
}

function cancel() {
  close(() => reject("cancel"));
}

function onModelValueChange(value: boolean) {
  if (!value) {
    cancel();
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) {
    return value;
  }

  return new Date(ts).toLocaleString("zh-CN", {
    hour12: false,
  });
}

function clearWsReloadTimer() {
  if (!wsReloadTimer) {
    return;
  }
  clearTimeout(wsReloadTimer);
  wsReloadTimer = null;
}

function scheduleWsReload() {
  if (wsReloadTimer) {
    return;
  }

  wsReloadTimer = setTimeout(() => {
    wsReloadTimer = null;
    void loadData(true);
  }, 260);
}

async function loadAgentTaskInfo() {
  const taskRes = await api.agentTask.getAgentTaskById(props.agentTaskId);
  agentTask.value = taskRes.data;
}

function dedupeChatHistories(
  items: ChatHistoryResponse[],
): ChatHistoryResponse[] {
  const byId = new Map<number, ChatHistoryResponse>();

  for (const item of items) {
    const current = byId.get(item.id);
    if (!current) {
      byId.set(item.id, item);
      continue;
    }

    const currentTs = Date.parse(current.createdAt || "") || 0;
    const nextTs = Date.parse(item.createdAt || "") || 0;
    if (nextTs >= currentTs) {
      byId.set(item.id, item);
    }
  }

  return Array.from(byId.values());
}

async function loadAllChatHistories() {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const allItems: ChatHistoryResponse[] = [];

  while (page <= totalPages) {
    const res = await api.chatHistory.getChatHistoryAgentTaskByAgentTaskId(
      props.agentTaskId,
      {
        page,
        pageSize,
      },
    );

    const pageData = res.data;
    allItems.push(...(pageData.items ?? []));
    totalPages = Math.max(pageData.totalPages ?? 1, 1);
    page += 1;
  }

  chatHistories.value = dedupeChatHistories(allItems);
}

async function loadData(soft = false) {
  const currentLoad = ++loadSerial;
  if (soft) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;

  try {
    await Promise.all([loadAgentTaskInfo(), loadAllChatHistories()]);
  } catch (err) {
    if (currentLoad !== loadSerial) {
      return;
    }

    error.value =
      err instanceof Error ? err.message : "加载对话历史失败，请稍后重试";
  } finally {
    if (currentLoad === loadSerial) {
      loading.value = false;
      refreshing.value = false;
    }
  }
}

function handleEntityChange(payload: EntityChangePayload) {
  if (payload.entity === "agent_task") {
    if (Number(payload.entityId) !== props.agentTaskId) {
      return;
    }

    scheduleWsReload();
    return;
  }

  if (payload.entity !== "chat_history") {
    return;
  }

  const record = payload.record as { agentTaskId?: number };
  if (Number(record.agentTaskId) !== props.agentTaskId) {
    return;
  }

  scheduleWsReload();
}

function waitForRealtimeReady(options: {
  companyId: number;
  timeoutMs?: number;
}): Promise<void> {
  if (isEventSubscriptionLive(options.companyId, "entity_change")) {
    return Promise.resolve();
  }

  const timeoutMs = options.timeoutMs ?? 1600;

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (unsubscribeWsCommandDispatch) {
        unsubscribeWsCommandDispatch();
        unsubscribeWsCommandDispatch = null;
      }
      if (unsubscribeWsServerEvent) {
        unsubscribeWsServerEvent();
        unsubscribeWsServerEvent = null;
      }
      resolve();
    };

    unsubscribeWsServerEvent = registerWsServerEventHandler((event) => {
      if (event.event !== "subscribed") {
        return;
      }

      if (event.data.companyId !== options.companyId) {
        return;
      }

      if (!event.data.events.includes("entity_change")) {
        return;
      }

      finish();
    });

    unsubscribeWsCommandDispatch = registerWsCommandDispatchHandler(
      (payload) => {
        if (payload.command.type !== "subscribe") {
          return;
        }

        if (payload.command.companyId !== options.companyId) {
          return;
        }

        if (!payload.command.events.includes("entity_change")) {
          return;
        }

        finish();
      },
    );

    timer = setTimeout(() => {
      finish();
    }, timeoutMs);
  });
}

async function startRealtimeAndWaitReady() {
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
      entities: ["agent_task", "chat_history"],
    });
  }

  if (!unsubscribeEntityChange) {
    unsubscribeEntityChange = registerEntityChangeHandler(handleEntityChange, {
      entities: ["agent_task", "chat_history"],
    });
  }

  await waitForRealtimeReady({ companyId });
}

function stopRealtime() {
  clearWsReloadTimer();

  if (unsubscribeEntityChange) {
    unsubscribeEntityChange();
    unsubscribeEntityChange = null;
  }

  if (unsubscribeWsCommandDispatch) {
    unsubscribeWsCommandDispatch();
    unsubscribeWsCommandDispatch = null;
  }

  if (unsubscribeWsServerEvent) {
    unsubscribeWsServerEvent();
    unsubscribeWsServerEvent = null;
  }

  if (releaseSubscriptionDemand) {
    releaseSubscriptionDemand();
    releaseSubscriptionDemand = null;
  }
}

function handleClose() {
  close(() => resolve());
}

onMounted(async () => {
  await startRealtimeAndWaitReady();
  await loadData(false);
});

onUnmounted(() => {
  stopRealtime();
});
</script>

<template>
  <Dialog
    v-model="visible"
    width="72rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="header-main w-full">
          <div class="v gap-1">
            <div class="title">{{ title }}</div>
            <div class="subtitle">{{ subtitle }}</div>
          </div>
          <div v-if="taskInfoItems.length" class="task-info-grid w-full">
            <div
              v-for="item in taskInfoItems"
              :key="item.label"
              class="task-info-item"
            >
              <span class="task-info-label">{{ item.label }}</span>
              <span class="task-info-value">{{ item.value }}</span>
            </div>
          </div>
          <div v-if="agentTask?.content" class="task-content-preview">
            {{ agentTask.content }}
          </div>
        </div>
        <Button :disabled="refreshing || loading" @click="loadData(true)">
          {{ refreshing ? "刷新中..." : "刷 新" }}
        </Button>
      </div>
    </template>

    <div v-if="loading" class="state-wrap">正在加载对话历史...</div>
    <div v-else-if="error" class="state-wrap state-wrap--error">
      {{ error }}
    </div>
    <div v-else-if="sortedHistories.length === 0" class="state-wrap">
      暂无对话历史
    </div>
    <div v-else class="history-list">
      <ChatHistoryItemCard
        v-for="item in sortedHistories"
        :key="item.id"
        :item="item"
      />
    </div>

    <template #footer>
      <Button @click="handleClose">关 闭</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.header-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.header-main {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

.title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--on-surface);
}

.subtitle {
  font-size: 0.82rem;
  color: var(--on-surface-variant);
}

.task-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.35rem;
}

.task-info-item {
  display: grid;
  gap: 0.08rem;
  width: 100%;
  border: 1px solid rgb(34 211 238 / 0.2);
  border-radius: 0.55rem;
  padding: 0.25rem 0.4rem;
  background: rgb(255 255 255 / 0.75);
}

.task-info-label {
  font-size: 0.68rem;
  color: var(--on-surface-variant);
}

.task-info-value {
  font-size: 0.74rem;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-content-preview {
  border-radius: 0.55rem;
  border: 1px dashed rgb(34 211 238 / 0.24);
  background: rgb(240 249 255 / 0.55);
  color: var(--on-surface);
  font-size: 0.76rem;
  line-height: 1.35;
  padding: 0.3rem 0.45rem;
  max-height: 3.8rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.state-wrap {
  display: flex;
  min-height: 14rem;
  align-items: center;
  justify-content: center;
  color: var(--on-surface-variant);
  font-size: 0.9rem;
}

.state-wrap--error {
  color: rgb(220 38 38);
}

.history-list {
  display: grid;
  gap: 0.7rem;
  max-height: 62vh;
  overflow: auto;
  padding-right: 0.25rem;
}

@media (max-width: 720px) {
  .header-wrap {
    flex-direction: column;
    align-items: stretch;
  }

  .history-list {
    max-height: 68vh;
  }
}
</style>
