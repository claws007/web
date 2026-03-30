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
      v-else-if="renderedChatHistories.length === 0"
      class="text-xs text-gray-500 text-center py-2"
    >
      暂无聊天记录
    </div>
    <div v-else class="v gap-2 items-start">
      <div
        v-for="history in renderedChatHistories"
        :key="history.id"
        class="text-xs p-3 rounded-md break-all"
        :class="
          history.isStreaming
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-primary/10'
        "
      >
        <div class="flex items-center gap-1.5 mb-0.5">
          <span
            class="inline-block px-1.5 py-0.5 rounded text-xxs font-semibold uppercase"
            :class="getRoleClass(history.role)"
          >
            {{ history.role }}
          </span>
          <span
            v-if="history.isStreaming"
            class="inline-block px-1.5 py-0.5 rounded text-xxs font-semibold uppercase text-amber-700 bg-amber-100"
          >
            STREAMING
          </span>
          <span
            v-if="history.eventType"
            class="inline-block px-1.5 py-0.5 rounded text-xxs font-semibold uppercase text-gray-600 bg-gray-100"
          >
            {{ history.eventType }}
          </span>
          <TimeDisplay
            class="text-gray-500 text-xxs ml-auto"
            :timestamp="history.createdAt"
          />
        </div>
        <div
          class="text-gray-700 leading-tight break-all whitespace-pre-wrap line-clamp-5"
        >
          {{
            history.content.length > 200
              ? history.content.substring(0, 99999) + "..."
              : history.content
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { api, readStoredActiveCompanyId } from "@/api";
import type { ChatHistoryResponse } from "@/api";
import type {
  ChatHistoryEntityRecord,
  EntityChangePayload,
  ModelStreamPayload,
  WsEventType,
} from "@/api/generated-ws";
import TimeDisplay from "@/components/TimeDisplay.vue";
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

const DEFAULT_MAX_ITEMS = 9999;

const userStore = useUserStore();
const chatHistories = ref<DisplayChatHistory[]>([]);
const streamingHistory = ref<DisplayChatHistory | null>(null);
const loading = ref(false);

let syncSerial = 0;
let unsubscribeEntityChange: (() => void) | null = null;
let unsubscribeModelStream: (() => void) | null = null;
let releaseEntityChangeSubscription: (() => void) | null = null;
let releaseModelStreamSubscription: (() => void) | null = null;

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
  return [...visibleChatHistories.value].reverse();
});

function normalizeHistory(item: ChatHistoryResponse): DisplayChatHistory {
  return {
    ...item,
    role: item.role,
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

    await loadChatHistories(currentSerial);
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

function getRoleClass(role: string): string {
  const normalized = role.toUpperCase();
  if (normalized === "SYSTEM") {
    return "bg-gray-200 text-gray-800";
  }
  if (normalized === "USER") {
    return "bg-blue-200 text-blue-800";
  }
  if (normalized === "ASSISTANT") {
    return "bg-green-200 text-green-800";
  }
  return "bg-gray-200 text-gray-800";
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
