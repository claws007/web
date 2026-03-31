<template>
  <div>
    <div
      v-if="loading"
      class="flex items-center justify-center py-3 text-sm text-gray-500"
    >
      <span
        class="size-1.5 animate-pulse rounded-full bg-primary inline-block mr-2"
      />
      加载中...
    </div>
    <div
      v-else-if="renderRows.length === 0"
      class="text-xs text-gray-500 text-center py-2"
    >
      暂无聊天记录
    </div>
    <div v-else class="v gap-2 items-start">
      <div v-for="row in renderRows" :key="row.id" class="w-full">
        <div
          v-if="row.kind === 'item'"
          class="text-xs p-3 rounded-md break-all v gap-2"
          :class="
            row.item.isStreaming
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-primary/10'
          "
        >
          <div class="flex items-center gap-1.5 mb-0.5">
            <span
              v-if="useActorAvatar(row.item.role)"
              class="inline-flex items-end gap-2"
            >
              <span
                class="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700"
              >
                <img
                  v-if="resolveActorAvatar(row.item.role)"
                  :src="resolveActorAvatar(row.item.role) ?? undefined"
                  :alt="resolveActorLabel(row.item.role)"
                  class="size-full object-cover"
                />
                <span v-else>{{ resolveActorFallback(row.item.role) }}</span>
              </span>
              <span class="font-semibold text-slate-700 text-sm">
                {{ resolveActorLabel(row.item.role) }}
              </span>
              <span
                v-if="row.item.isStreaming"
                class="inline-block px-1.5 py-0.5 rounded text-xxs font-semibold uppercase text-amber-700 bg-amber-100"
              >
                输出中
              </span>
            </span>
            <span
              v-else
              class="inline-flex size-4 items-center justify-center rounded bg-white/70 text-xs"
              :title="row.item.eventType ?? row.item.role"
            >
              {{ row.item.icon }}
            </span>
          </div>
          <MarkdownPreviewer
            :content="row.item.displayContent"
            class="leading-tight break-all text-xs!"
            :class="
              row.item.condensed
                ? 'text-gray-600 italic line-clamp-3'
                : 'text-gray-700'
            "
          />
        </div>

        <div v-else class="px-3 py-2 text-xs break-all">
          <!-- <div class="flex items-center gap-1.5 text-slate-600">
            <span class="inline-flex size-4 items-center justify-center"
              >⋯</span
            >
            <span class="font-medium">{{ row.summary }}</span>
          </div> -->
          <div class="v gap-1 border-l border-slate-300/80 pl-2.5 break-all">
            <div
              v-for="item in row.items"
              :key="`group-${item.id}`"
              class="flex items-start gap-1.5 text-foreground-muted"
            >
              <span
                v-if="useActorAvatar(item.role)"
                class="inline-flex size-4 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[9px] font-semibold text-slate-700"
              >
                <img
                  v-if="resolveActorAvatar(item.role)"
                  :src="resolveActorAvatar(item.role) ?? undefined"
                  :alt="resolveActorLabel(item.role)"
                  class="size-full object-cover"
                />
                <span v-else>{{ resolveActorFallback(item.role) }}</span>
              </span>
              <span
                v-else
                class="inline-flex size-4 items-center justify-center"
                >{{ item.icon }}</span
              >
              <MarkdownPreviewer
                :content="item.displayContent"
                class="min-w-0 flex-1 text-slate-600 text-xs! line-clamp-3"
              />
              <!-- <TimeDisplay
                class="text-slate-500 text-xxs"
                :timestamp="item.createdAt"
              /> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { api, getImageUrlByFileId, readStoredActiveCompanyId } from "@/api";
import type { AgentResponse, ChatHistoryResponse } from "@/api";
import type {
  ChatHistoryEntityRecord,
  EntityChangePayload,
  ModelStreamPayload,
  WsEventType,
} from "@/api/generated-ws";
import {
  isEventSubscriptionLive,
  isTaskEventSubscriptionLive,
  registerEntityChangeHandler,
  registerModelStreamHandler,
  registerWsCommandDispatchHandler,
  registerWsServerEventHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { useUserStore } from "@/store/user";

const props = defineProps<{
  agentTaskId: number;
  maxItems?: number;
}>();

type DisplayChatHistory = Omit<ChatHistoryResponse, "role"> & {
  role: string;
  isStreaming?: boolean;
};

type RenderedChatHistory = DisplayChatHistory & {
  displayContent: string;
  icon: string;
  condensed: boolean;
};

type RenderRow =
  | {
      kind: "item";
      id: string;
      item: RenderedChatHistory;
    }
  | {
      kind: "group";
      id: string;
      items: RenderedChatHistory[];
      summary: string;
    };

const DEFAULT_MAX_ITEMS = 9999;

const userStore = useUserStore();
const chatHistories = ref<DisplayChatHistory[]>([]);
const streamingHistory = ref<DisplayChatHistory | null>(null);
const taskAgent = ref<AgentResponse | null>(null);
const loading = ref(false);

let syncSerial = 0;
let unsubscribeEntityChange: (() => void) | null = null;
let unsubscribeModelStream: (() => void) | null = null;
let releaseEntityChangeSubscription: (() => void) | null = null;
let releaseModelStreamSubscription: (() => void) | null = null;

const activeCompany = computed(() => {
  const activeCompanyId = readStoredActiveCompanyId();
  if (!activeCompanyId) {
    return null;
  }
  return (
    userStore.companies.find((company) => company.id === activeCompanyId) ??
    null
  );
});

const companyAvatarUrl = computed(() =>
  getImageUrlByFileId(activeCompany.value?.brandFileId ?? null),
);

const agentAvatarUrl = computed(() =>
  getImageUrlByFileId(taskAgent.value?.avatarFileId ?? null),
);

const maxHistoryItems = computed(() => {
  if (typeof props.maxItems === "number" && props.maxItems > 0) {
    return props.maxItems;
  }
  return DEFAULT_MAX_ITEMS;
});

const visibleChatHistories = computed(() => {
  const items = streamingHistory.value
    ? [streamingHistory.value, ...chatHistories.value]
    : chatHistories.value;

  return items.slice(0, maxHistoryItems.value);
});

const renderedChatHistories = computed(() => {
  return [...visibleChatHistories.value]
    .reverse()
    .map((history) => buildRenderedHistory(history))
    .filter((history) => history.displayContent.trim().length > 0);
});

const renderRows = computed<RenderRow[]>(() => {
  const rows: RenderRow[] = [];
  let groupBuffer: RenderedChatHistory[] = [];

  const flushGroup = () => {
    if (groupBuffer.length === 0) {
      return;
    }

    const first = groupBuffer[0]!;
    const last = groupBuffer[groupBuffer.length - 1]!;
    rows.push({
      kind: "group",
      id: `group-${first.id}-${last.id}`,
      items: [...groupBuffer],
      summary: buildCondensedGroupSummary(groupBuffer),
    });

    groupBuffer = [];
  };

  for (const history of renderedChatHistories.value) {
    if (history.condensed) {
      groupBuffer.push(history);
      continue;
    }

    flushGroup();
    rows.push({
      kind: "item",
      id: `item-${history.id}`,
      item: history,
    });
  }

  flushGroup();
  return rows;
});

function normalizeHistory(item: ChatHistoryResponse): DisplayChatHistory {
  return {
    ...item,
    role: item.role,
  };
}

function useActorAvatar(role: string): boolean {
  const normalized = role.toUpperCase();
  return normalized === "ASSISTANT" || normalized === "USER";
}

function resolveActorLabel(role: string): string {
  const normalized = role.toUpperCase();
  if (normalized === "ASSISTANT") {
    const name = taskAgent.value?.name?.trim();
    return name || "Agent";
  }
  if (normalized === "USER") {
    const companyName = activeCompany.value?.name?.trim();
    return companyName || "Company";
  }
  return normalized;
}

function resolveActorFallback(role: string): string {
  return resolveActorLabel(role).charAt(0).toUpperCase() || "?";
}

function resolveActorAvatar(role: string): string | null {
  const normalized = role.toUpperCase();
  if (normalized === "ASSISTANT") {
    return agentAvatarUrl.value;
  }
  if (normalized === "USER") {
    return companyAvatarUrl.value;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim();
  return text ? text : null;
}

function asRecord(value: unknown): Record<string, any> {
  return isRecord(value) ? value : {};
}

function summarizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length}]`;
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return "{}";
    }
    return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", ..." : ""}}`;
  }
  return String(value);
}

function summarizeArguments(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }

  const entries = Object.entries(payload)
    .filter(([, value]) => value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${summarizeValue(value)}`);

  return entries.join(" | ");
}

function isModelStreamHistory(item: DisplayChatHistory): boolean {
  const eventTypeName = item.eventTypeName?.toLowerCase();
  if (eventTypeName === "model_stream" || eventTypeName === "model-stream") {
    return true;
  }

  const logs = asRecord(item.extraLogs);
  const execution = asRecord(logs.execution);
  const step = getString(execution.step)?.toLowerCase();
  return step === "model_stream" || step === "model-stream";
}

function shouldKeepOriginalContent(item: DisplayChatHistory): boolean {
  if (item.isStreaming) {
    return true;
  }

  if (isModelStreamHistory(item)) {
    return true;
  }

  const role = item.role.toUpperCase();
  if (role === "USER" || role === "ASSISTANT") {
    return true;
  }

  return false;
}

function mapHistoryIcon(item: DisplayChatHistory): string {
  if (item.isStreaming || isModelStreamHistory(item)) {
    return "⚡";
  }

  const role = item.role.toUpperCase();
  if (role === "USER") {
    return "👤";
  }
  if (role === "ASSISTANT") {
    return "🤖";
  }
  if (role === "TOOL") {
    return "🛠";
  }

  if (item.eventType === "MCP_CALL") {
    return "🔌";
  }
  if (item.eventType === "MCP_RESULT") {
    return "📥";
  }
  if (item.eventType === "TOOL_CALL") {
    return "🧰";
  }
  if (item.eventType === "SKILL_CALL") {
    return "🧠";
  }
  if (item.eventType === "EXECUTION") {
    return "⏱";
  }
  if (item.eventType === "MESSAGE") {
    return "💬";
  }
  return "ℹ";
}

function condensedTypeLabel(
  eventType?: ChatHistoryResponse["eventType"],
): string {
  if (eventType === "MCP_CALL") {
    return "MCP 调用";
  }
  if (eventType === "MCP_RESULT") {
    return "MCP 结果";
  }
  if (eventType === "TOOL_CALL") {
    return "工具调用";
  }
  if (eventType === "SKILL_CALL") {
    return "技能调用";
  }
  if (eventType === "EXECUTION") {
    return "执行状态";
  }
  if (eventType === "MESSAGE") {
    return "系统消息";
  }
  return "系统事件";
}

function buildCondensedGroupSummary(items: RenderedChatHistory[]): string {
  const counters = new Map<string, number>();
  for (const item of items) {
    const key =
      item.isStreaming || isModelStreamHistory(item)
        ? "模型流输出"
        : condensedTypeLabel(item.eventType);
    counters.set(key, (counters.get(key) ?? 0) + 1);
  }

  const chunks = Array.from(counters.entries())
    .slice(0, 3)
    .map(([label, count]) => `${label} ${count} 条`);

  return `已浓缩 ${items.length} 条记录${chunks.length ? ` (${chunks.join("，")})` : ""}`;
}

function buildCondensedTip(item: DisplayChatHistory): string {
  const logs = asRecord(item.extraLogs);
  const execution = asRecord(logs.execution);
  const tool = asRecord(logs.tool);
  const mcp = asRecord(logs.mcp);
  const mcpCall = asRecord(mcp.call);
  const mcpResult = asRecord(mcp.result);
  const skill = asRecord(logs.skill);

  if (item.isStreaming || isModelStreamHistory(item)) {
    return `模型流输出：${item.content || "(empty)"}`;
  }

  if (item.eventType === "MCP_CALL") {
    const toolName =
      getString(item.eventTypeName) ||
      getString(mcp.toolName) ||
      getString(mcpCall.toolName) ||
      "unknown";
    const args =
      summarizeArguments(mcpCall.toolArguments) ||
      summarizeArguments(mcpCall.arguments) ||
      summarizeArguments(mcpCall.input);
    return args
      ? `调用 MCP 工具 ${toolName} (${args})`
      : `调用 MCP 工具 ${toolName}`;
  }

  if (item.eventType === "MCP_RESULT") {
    const toolName =
      getString(mcp.toolName) || getString(item.eventTypeName) || "unknown";
    const status =
      getString(mcpResult.status) || getString(execution.status) || "UNKNOWN";
    return `MCP 工具 ${toolName} 返回结果，状态 ${status}`;
  }

  if (item.eventType === "TOOL_CALL") {
    const toolName =
      getString(item.eventTypeName) ||
      getString(tool.toolName) ||
      getString(tool.name) ||
      getString(mcp.toolName) ||
      "unknown";
    const args =
      summarizeArguments(tool.arguments) ||
      summarizeArguments(mcpCall.toolArguments) ||
      summarizeArguments(mcpCall.arguments);
    const status = getString(tool.status) || getString(execution.status);
    const suffix = status ? `，状态 ${status}` : "";
    return args
      ? `调用工具 ${toolName} (${args})${suffix}`
      : `调用工具 ${toolName}${suffix}`;
  }

  if (item.eventType === "SKILL_CALL") {
    const skillId = summarizeValue(skill.skillId);
    const refPath = getString(skill.referencePath);
    return refPath
      ? `调用技能 ${skillId}，引用 ${refPath}`
      : `调用技能 ${skillId}`;
  }

  if (item.eventType === "EXECUTION") {
    const step = getString(execution.step) || "execution";
    const status = getString(execution.status) || "RUNNING";
    return `执行步骤 ${step}，状态 ${status}`;
  }

  if (item.eventType === "MESSAGE" && item.role.toUpperCase() === "SYSTEM") {
    return "系统消息";
  }

  return item.content || "系统事件";
}

function buildRenderedHistory(item: DisplayChatHistory): RenderedChatHistory {
  const displayRole = isModelStreamHistory(item) ? "ASSISTANT" : item.role;
  const keepOriginal = shouldKeepOriginalContent(item);
  return {
    ...item,
    role: displayRole,
    displayContent: keepOriginal ? item.content : buildCondensedTip(item),
    icon: mapHistoryIcon(item),
    condensed: !keepOriginal,
  };
}

function toDisplayChatHistory(
  record: ChatHistoryEntityRecord,
): DisplayChatHistory {
  return {
    id: record.id,
    role: record.role,
    eventType: record.eventType as ChatHistoryResponse["eventType"],
    eventTypeName:
      typeof record.eventTypeName === "string" ? record.eventTypeName : null,
    durationMs:
      typeof record.durationMs === "number" ? record.durationMs : null,
    extraLogs: isRecord(record.extraLogs) ? record.extraLogs : undefined,
    content: record.content,
    agentTaskId: record.agentTaskId,
    createdAt: record.createdAt,
  };
}

function compareHistories(
  a: DisplayChatHistory,
  b: DisplayChatHistory,
): number {
  const leftTs = Date.parse(a.createdAt || "") || 0;
  const rightTs = Date.parse(b.createdAt || "") || 0;
  if (leftTs !== rightTs) {
    return rightTs - leftTs;
  }
  return b.id - a.id;
}

function mergeChatHistories(
  ...groups: DisplayChatHistory[][]
): DisplayChatHistory[] {
  const byId = new Map<number, DisplayChatHistory>();

  for (const group of groups) {
    for (const item of group) {
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
  }

  return Array.from(byId.values())
    .sort(compareHistories)
    .slice(0, maxHistoryItems.value);
}

async function loadChatHistories(serial = syncSerial) {
  const companyId = readStoredActiveCompanyId();
  if (!companyId) {
    console.error("No company ID found");
    chatHistories.value = [];
    return;
  }

  const res = await api.chatHistory.getChatHistoryAgentTaskByAgentTaskId(
    props.agentTaskId,
    {
      page: 1,
      pageSize: maxHistoryItems.value,
      reverse: true,
    },
  );

  if (serial !== syncSerial) {
    return;
  }

  const snapshot = (res.data?.items ?? []).map(normalizeHistory);
  chatHistories.value = mergeChatHistories(chatHistories.value, snapshot);
}

async function loadTaskAgent(serial = syncSerial) {
  try {
    const res = await api.agentTask.getAgentTaskById(props.agentTaskId);
    if (serial !== syncSerial) {
      return;
    }
    taskAgent.value = res.data?.agent ?? null;
  } catch {
    if (serial !== syncSerial) {
      return;
    }
    taskAgent.value = null;
  }
}

function clearStreamingHistory() {
  streamingHistory.value = null;
}

function upsertStreamingHistory(delta: string) {
  const current = streamingHistory.value;
  const nextContent = `${current?.content ?? ""}${delta}`;

  streamingHistory.value = {
    id: -props.agentTaskId,
    role: "ASSISTANT",
    eventType: "MESSAGE",
    eventTypeName: null,
    durationMs: null,
    extraLogs: undefined,
    content: nextContent,
    agentTaskId: props.agentTaskId,
    createdAt: current?.createdAt ?? new Date().toISOString(),
    isStreaming: true,
  };
}

function handleEntityChange(payload: EntityChangePayload) {
  if (payload.entity !== "chat_history") {
    return;
  }

  const record = payload.record as Partial<ChatHistoryEntityRecord>;
  if (Number(record.agentTaskId) !== props.agentTaskId) {
    return;
  }

  if (payload.operation === "delete") {
    const targetId = Number(payload.entityId);
    if (!Number.isFinite(targetId)) {
      return;
    }

    chatHistories.value = chatHistories.value.filter(
      (history) => history.id !== targetId,
    );
    return;
  }

  chatHistories.value = mergeChatHistories(chatHistories.value, [
    toDisplayChatHistory(payload.record as ChatHistoryEntityRecord),
  ]);
  clearStreamingHistory();
}

function handleModelStream(payload: ModelStreamPayload) {
  if (payload.agentTaskId !== props.agentTaskId) {
    return;
  }

  if (payload.delta) {
    upsertStreamingHistory(payload.delta);
  }

  if (payload.finishReason) {
    clearStreamingHistory();
  }
}

function waitForRealtimeSubscription(options: {
  event: WsEventType;
  companyId?: number | null;
  agentTaskId?: number | null;
  timeoutMs?: number;
}): Promise<void> {
  if (
    options.event === "entity_change" &&
    options.companyId &&
    isEventSubscriptionLive(options.companyId, "entity_change")
  ) {
    return Promise.resolve();
  }

  if (
    options.event === "model_stream" &&
    options.agentTaskId &&
    isTaskEventSubscriptionLive(options.agentTaskId, "model_stream")
  ) {
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
      unsubscribeWsCommandDispatch();
      unsubscribeWsServerEvent();
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      resolve();
    };

    const matchesScope = (payload: {
      companyId?: number;
      agentTaskId?: number;
      events?: WsEventType[];
    }) => {
      if (!payload.events?.includes(options.event)) {
        return false;
      }
      if (
        typeof options.companyId === "number" &&
        payload.companyId !== options.companyId
      ) {
        return false;
      }
      if (
        typeof options.agentTaskId === "number" &&
        payload.agentTaskId !== options.agentTaskId
      ) {
        return false;
      }
      return true;
    };

    const unsubscribeWsServerEvent = registerWsServerEventHandler((event) => {
      if (event.event !== "subscribed") {
        return;
      }

      if (matchesScope(event.data)) {
        finish();
      }
    });

    const unsubscribeWsCommandDispatch = registerWsCommandDispatchHandler(
      (payload) => {
        if (payload.command.type !== "subscribe") {
          return;
        }

        if (matchesScope(payload.command)) {
          finish();
        }
      },
    );

    timer = setTimeout(() => {
      finish();
    }, timeoutMs);
  });
}

function stopRealtime() {
  unsubscribeEntityChange?.();
  unsubscribeEntityChange = null;

  unsubscribeModelStream?.();
  unsubscribeModelStream = null;

  releaseEntityChangeSubscription?.();
  releaseEntityChangeSubscription = null;

  releaseModelStreamSubscription?.();
  releaseModelStreamSubscription = null;
}

async function syncRealtimeAndHistories() {
  const currentSerial = ++syncSerial;
  stopRealtime();
  clearStreamingHistory();
  chatHistories.value = [];
  loading.value = true;

  try {
    const token = userStore.token?.trim() || null;
    const companyId = readStoredActiveCompanyId();
    if (!token || !companyId || props.agentTaskId <= 0) {
      return;
    }

    unsubscribeEntityChange = registerEntityChangeHandler(handleEntityChange, {
      entities: ["chat_history"],
    });
    unsubscribeModelStream = registerModelStreamHandler(handleModelStream);

    releaseEntityChangeSubscription = requestRealtimeSubscription({
      token,
      companyId,
      events: ["entity_change"],
      entities: ["chat_history"],
    });
    releaseModelStreamSubscription = requestRealtimeSubscription({
      token,
      companyId,
      agentTaskId: props.agentTaskId,
      events: ["model_stream"],
    });

    await Promise.all([
      waitForRealtimeSubscription({
        event: "entity_change",
        companyId,
      }),
      waitForRealtimeSubscription({
        event: "model_stream",
        agentTaskId: props.agentTaskId,
      }),
    ]);

    if (currentSerial !== syncSerial) {
      return;
    }

    await Promise.all([
      loadTaskAgent(currentSerial),
      loadChatHistories(currentSerial),
    ]);
  } catch (error) {
    if (currentSerial !== syncSerial) {
      return;
    }

    console.error("Failed to sync chat histories:", error);
    chatHistories.value = [];
    clearStreamingHistory();
  } finally {
    if (currentSerial === syncSerial) {
      loading.value = false;
    }
  }
}

watch(
  () => props.agentTaskId,
  () => {
    void syncRealtimeAndHistories();
  },
  { immediate: true },
);

watch(
  () => props.maxItems,
  (next, previous) => {
    if (next === previous) {
      return;
    }

    chatHistories.value = mergeChatHistories(chatHistories.value);
    void loadChatHistories(syncSerial);
  },
);

onBeforeUnmount(() => {
  syncSerial += 1;
  stopRealtime();
});
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
