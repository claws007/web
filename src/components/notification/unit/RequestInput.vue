<script setup lang="ts">
import { api, getImageUrlByFileId } from "@/api";
import { notify } from "@/components/notification";
import { setNotificationResolved } from "@/services/notification-realtime";
import { computed, ref, watch } from "vue";
import type { RequestInputItem } from "../types";

type SelectionOption = { value: string; label: string };

type ResolvedRequestContext = {
  prompt: string;
  options: SelectionOption[];
  allowCustomInput: boolean;
  flow: string;
  scheduleTargetAgentId: number | null;
};

type AgentMeta = {
  name: string;
  avatarFileId: number | null;
};

type AgentTaskMeta = {
  content: string;
};

const agentMetaCache = new Map<number, AgentMeta>();
const taskMetaCache = new Map<number, AgentTaskMeta>();

const props = defineProps<{
  entry: RequestInputItem;
  closing: boolean;
}>();

const inputDraft = ref("");
const singleDraft = ref("");
const multiDraft = ref<string[]>([]);
const submitting = ref(false);
const sourceAgentName = ref("");
const sourceAgentAvatarUrl = ref<string | null>(null);
const sourceTaskContent = ref("");

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  return null;
}

function resolveRequestContext(
  source: RequestInputItem["source"],
): ResolvedRequestContext {
  const extra = asObject(source.extraParams);
  const originalRequest = asObject(extra.originalRequest);
  const prompt =
    asString(originalRequest.prompt) ||
    asString(source.title) ||
    asString(source.content) ||
    "请处理该请求";

  const optionsSource = originalRequest.options;
  const options: SelectionOption[] = Array.isArray(optionsSource)
    ? optionsSource
        .map((item) => {
          const obj = asObject(item);
          const value = asString(obj.value);
          const label = asString(obj.label) || value;
          if (!value) return null;
          return { value, label };
        })
        .filter((item): item is SelectionOption => !!item)
    : [];

  return {
    prompt,
    options,
    allowCustomInput: asBoolean(originalRequest.allow_custom_input),
    flow: asString(originalRequest.flow),
    scheduleTargetAgentId: asNumber(
      asObject(originalRequest.scheduleIntent).targetAgentId,
    ),
  };
}

function getTypeLabel(type: RequestInputItem["requestType"]): string {
  if (type === "REQUEST_INPUT") return "输入请求";
  if (type === "REQUEST_SELECT_SINGLE") return "单选请求";
  if (type === "REQUEST_SELECT_MULTI") return "多选请求";
  return "确认请求";
}

function onToggleMulti(value: string, checked: boolean) {
  multiDraft.value = checked
    ? multiDraft.value.includes(value)
      ? multiDraft.value
      : [...multiDraft.value, value]
    : multiDraft.value.filter((item) => item !== value);
}

const extraParams = computed(() => asObject(props.entry.source.extraParams));
const requestContext = computed(() =>
  resolveRequestContext(props.entry.source),
);
const sourceAgentId = computed(() => asNumber(extraParams.value.sourceAgentId));
const sourceAgentTaskId = computed(() =>
  asNumber(extraParams.value.sourceAgentTaskId),
);
const isTopLevelPeerScheduleFlow = computed(
  () => requestContext.value.flow === "SCHEDULE_TOP_LEVEL_PEER_CONFIRM",
);
const showSourceMeta = computed(
  () => sourceAgentId.value !== null || sourceAgentTaskId.value !== null,
);
const sourceAgentInitials = computed(() => {
  const text = sourceAgentName.value.trim();
  if (!text) return "AG";
  const first = Array.from(text)[0] ?? "A";
  return first.toUpperCase();
});
const sourceTaskSummary = computed(() => {
  const raw = sourceTaskContent.value.trim();
  if (!raw) return "";
  return raw.length > 72 ? `${raw.slice(0, 72)}...` : raw;
});

async function loadSourceMeta() {
  const agentId = sourceAgentId.value;
  if (agentId) {
    try {
      const cached = agentMetaCache.get(agentId);
      if (cached) {
        sourceAgentName.value = cached.name;
        sourceAgentAvatarUrl.value = getImageUrlByFileId(cached.avatarFileId);
      } else {
        const res = await api.agent.getAgentById(agentId);
        const meta: AgentMeta = {
          name: res.data.name?.trim() || `Agent-${agentId}`,
          avatarFileId:
            typeof res.data.avatarFileId === "number"
              ? res.data.avatarFileId
              : null,
        };
        agentMetaCache.set(agentId, meta);
        sourceAgentName.value = meta.name;
        sourceAgentAvatarUrl.value = getImageUrlByFileId(meta.avatarFileId);
      }
    } catch {
      sourceAgentName.value = `Agent-${agentId}`;
      sourceAgentAvatarUrl.value = null;
    }
  } else {
    sourceAgentName.value = "";
    sourceAgentAvatarUrl.value = null;
  }

  const agentTaskId = sourceAgentTaskId.value;
  if (agentTaskId) {
    try {
      const cached = taskMetaCache.get(agentTaskId);
      if (cached) {
        sourceTaskContent.value = cached.content;
      } else {
        const res = await api.agentTask.getAgentTaskById(agentTaskId);
        const meta: AgentTaskMeta = {
          content: typeof res.data.content === "string" ? res.data.content : "",
        };
        taskMetaCache.set(agentTaskId, meta);
        sourceTaskContent.value = meta.content;
      }
    } catch {
      sourceTaskContent.value = "";
    }
  } else {
    sourceTaskContent.value = "";
  }
}

watch(
  () => [
    props.entry.notificationId,
    sourceAgentId.value,
    sourceAgentTaskId.value,
  ],
  () => {
    void loadSourceMeta();
  },
  { immediate: true },
);

watch(inputDraft, (val) => {
  if (val) singleDraft.value = "";
});

watch(singleDraft, (val) => {
  if (val) inputDraft.value = "";
});

async function onReject() {
  submitting.value = true;
  try {
    await api.notification.resolveNotification(props.entry.notificationId, {
      type: "REQUEST_CONFIRM",
      value: false,
    });
    setNotificationResolved(props.entry.notificationId);
    notify.info("请求已取消");
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "操作失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function onSubmitInput() {
  const value = inputDraft.value.trim();
  if (!value) {
    notify.info("请输入内容后再提交");
    return;
  }

  submitting.value = true;
  try {
    await api.notification.resolveNotification(props.entry.notificationId, {
      type: "REQUEST_INPUT",
      value,
    });
    setNotificationResolved(props.entry.notificationId);
    notify.info("输入请求已提交");
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "提交失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function onSubmitSingle() {
  const context = requestContext.value;
  const value =
    singleDraft.value ||
    (context.allowCustomInput ? inputDraft.value.trim() : "");
  if (!value) {
    notify.info("请选择或输入一个选项");
    return;
  }

  submitting.value = true;
  try {
    await api.notification.resolveNotification(props.entry.notificationId, {
      type: "REQUEST_SELECT_SINGLE",
      value,
    });
    setNotificationResolved(props.entry.notificationId);
    notify.info("单选请求已提交");
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "提交失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function onSubmitMulti() {
  if (multiDraft.value.length === 0) {
    notify.info("请至少选择一个选项");
    return;
  }

  submitting.value = true;
  try {
    await api.notification.resolveNotification(props.entry.notificationId, {
      type: "REQUEST_SELECT_MULTI",
      value: multiDraft.value,
    });
    setNotificationResolved(props.entry.notificationId);
    notify.info("多选请求已提交");
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "提交失败，请重试");
  } finally {
    submitting.value = false;
  }
}

async function onConfirm() {
  submitting.value = true;
  try {
    await api.notification.resolveNotification(props.entry.notificationId, {
      type: "REQUEST_CONFIRM",
      value: true,
    });
    setNotificationResolved(props.entry.notificationId);
    notify.info("确认请求已通过");
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : "操作失败，请重试");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="nw-request"
    :class="[
      `nw-request--${entry.requestType.toLowerCase()}`,
      { 'nw-request--closing': closing },
    ]"
  >
    <div class="nw-request-top">
      <div class="nw-request-source" v-if="showSourceMeta">
        <span class="nw-request-avatar">
          <img
            v-if="sourceAgentAvatarUrl"
            :src="sourceAgentAvatarUrl"
            :alt="sourceAgentName || 'Agent avatar'"
            class="nw-request-avatar-img"
          />
          <span v-else class="nw-request-avatar-fallback">{{
            sourceAgentInitials
          }}</span>
        </span>
      </div>

      <div class="nw-request-main">
        <div class="nw-request-headline">
          <span class="nw-request-title">{{
            entry.source.title || "待处理请求"
          }}</span>
          <span class="nw-request-badge">{{
            getTypeLabel(entry.requestType)
          }}</span>
        </div>

        <div v-if="showSourceMeta" class="nw-request-meta">
          <span v-if="sourceAgentName" class="nw-request-meta-item"
            >来源: {{ sourceAgentName }}</span
          >
          <span v-if="sourceAgentTaskId" class="nw-request-meta-item"
            >Task #{{ sourceAgentTaskId }}</span
          >
          <span v-if="isTopLevelPeerScheduleFlow" class="nw-request-meta-item">
            顶层同级委派
          </span>
          <span
            v-if="requestContext.scheduleTargetAgentId"
            class="nw-request-meta-item"
            >目标 Agent #{{ requestContext.scheduleTargetAgentId }}</span
          >
        </div>
        <MarkdownPreviewer
          :content="sourceTaskSummary"
          v-if="sourceTaskSummary"
          class="text-xs!"
        ></MarkdownPreviewer>
      </div>
    </div>

    <p class="nw-request-prompt">
      <MarkdownPreviewer
        :content="requestContext.prompt"
        class="text-xs!"
      ></MarkdownPreviewer>
    </p>
    <template v-if="entry.requestType === 'REQUEST_INPUT'">
      <Input v-model="inputDraft" placeholder="请输入应答内容" icon="none" />
      <div class="nw-request-actions">
        <PrimaryButton
          type="button"
          :disabled="submitting"
          size="small"
          @click="onSubmitInput"
          >提交</PrimaryButton
        >
        <DefaultButton
          type="button"
          :disabled="submitting"
          @click="onReject"
          size="small"
          >取消</DefaultButton
        >
      </div>
    </template>

    <template v-else-if="entry.requestType === 'REQUEST_SELECT_SINGLE'">
      <div class="nw-request-options">
        <Radiobox
          v-for="option in requestContext.options"
          :key="option.value"
          v-model="singleDraft"
          :value="option.value"
          :name="`request-single-${entry.notificationId}`"
          :label="option.label"
        />
      </div>
      <Input
        v-if="requestContext.allowCustomInput"
        v-model="inputDraft"
        placeholder="可选：手动输入"
        icon="none"
      />
      <div class="nw-request-actions">
        <PrimaryButton
          type="button"
          size="small"
          :disabled="submitting"
          @click="onSubmitSingle"
          >提交</PrimaryButton
        >
        <DefaultButton
          type="button"
          :disabled="submitting"
          @click="onReject"
          size="small"
          >取消</DefaultButton
        >
      </div>
    </template>

    <template v-else-if="entry.requestType === 'REQUEST_SELECT_MULTI'">
      <div class="nw-request-options">
        <Checkbox
          v-for="option in requestContext.options"
          :key="option.value"
          :model-value="multiDraft.includes(option.value)"
          :label="option.label"
          @update:model-value="
            (checked) => onToggleMulti(option.value, checked)
          "
        />
      </div>
      <div class="nw-request-actions">
        <PrimaryButton
          type="button"
          size="small"
          :disabled="submitting"
          @click="onSubmitMulti"
          >提交</PrimaryButton
        >
        <DefaultButton
          size="small"
          type="button"
          :disabled="submitting"
          @click="onReject"
          >取消</DefaultButton
        >
      </div>
    </template>

    <template v-else>
      <div class="nw-request-actions">
        <PrimaryButton
          size="small"
          type="button"
          :disabled="submitting"
          @click="onConfirm"
          >确认</PrimaryButton
        >
        <DefaultButton
          size="small"
          type="button"
          :disabled="submitting"
          @click="onReject"
          >取消</DefaultButton
        >
      </div>
    </template>
  </div>
</template>

<style scoped>
.nw-request {
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-sm);
  background: var(--surface-container-low);
  border: 1px solid var(--outline-ghost);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    max-height 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-width 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.nw-request--closing {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  border-width: 0;
  overflow: hidden;
}

.nw-request-top {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.nw-request-source {
  flex-shrink: 0;
}

.nw-request-avatar {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 1px solid var(--outline-ghost);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.nw-request-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nw-request-avatar-fallback {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--primary);
}

.nw-request-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nw-request-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.nw-request-title {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nw-request-badge {
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgb(0 104 119 / 0.18);
  background: rgb(0 104 119 / 0.06);
  color: var(--primary);
  font-size: 0.65rem;
  padding: 0.05rem 0.42rem;
}

.nw-request-prompt {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--foreground-muted);
  white-space: pre-wrap;
}

.nw-request-meta {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.nw-request-meta-item {
  font-size: 0.64rem;
  color: var(--foreground-muted);
  border: 1px solid var(--outline-ghost);
  background: color-mix(
    in srgb,
    var(--surface-container-high) 88%,
    transparent
  );
  border-radius: 999px;
  padding: 0.02rem 0.34rem;
}

.nw-request-task-summary {
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.3;
  color: var(--foreground-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nw-request-options {
  display: grid;
  gap: 0.35rem;
}

.nw-request-actions {
  display: flex;
  justify-content: end;
  flex-wrap: wrap;
  gap: 0.4rem;
}
</style>
