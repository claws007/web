<script setup lang="ts">
import { api } from "@/api";
import { notify } from "@/components/notification";
import { setNotificationResolved } from "@/services/notification-realtime";
import { ref } from "vue";
import type { RequestInputItem } from "../types";

type SelectionOption = { value: string; label: string };

const props = defineProps<{
  entry: RequestInputItem;
  closing: boolean;
}>();

const inputDraft = ref("");
const singleDraft = ref("");
const multiDraft = ref<string[]>([]);
const submitting = ref(false);

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

function resolveRequestContext() {
  const source = props.entry.source;
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
  const context = resolveRequestContext();
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
      <span class="nw-request-title">{{
        entry.source.title || "待处理请求"
      }}</span>
      <span class="nw-request-badge">{{
        getTypeLabel(entry.requestType)
      }}</span>
    </div>

    <p class="nw-request-prompt">{{ resolveRequestContext().prompt }}</p>

    <template v-if="entry.requestType === 'REQUEST_INPUT'">
      <Input v-model="inputDraft" placeholder="请输入应答内容" icon="none" />
      <div class="nw-request-actions">
        <PrimaryButton
          type="button"
          :disabled="submitting"
          @click="onSubmitInput"
          >提交</PrimaryButton
        >
        <DefaultButton type="button" :disabled="submitting" @click="onReject"
          >取消</DefaultButton
        >
      </div>
    </template>

    <template v-else-if="entry.requestType === 'REQUEST_SELECT_SINGLE'">
      <div class="nw-request-options">
        <Radiobox
          v-for="option in resolveRequestContext().options"
          :key="option.value"
          v-model="singleDraft"
          :value="option.value"
          :name="`request-single-${entry.notificationId}`"
          :label="option.label"
        />
      </div>
      <Input
        v-if="resolveRequestContext().allowCustomInput"
        v-model="inputDraft"
        placeholder="可选：手动输入"
        icon="none"
      />
      <div class="nw-request-actions">
        <PrimaryButton
          type="button"
          :disabled="submitting"
          @click="onSubmitSingle"
          >提交</PrimaryButton
        >
        <DefaultButton type="button" :disabled="submitting" @click="onReject"
          >取消</DefaultButton
        >
      </div>
    </template>

    <template v-else-if="entry.requestType === 'REQUEST_SELECT_MULTI'">
      <div class="nw-request-options">
        <Checkbox
          v-for="option in resolveRequestContext().options"
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
          :disabled="submitting"
          @click="onSubmitMulti"
          >提交</PrimaryButton
        >
        <DefaultButton type="button" :disabled="submitting" @click="onReject"
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
