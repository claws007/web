<script setup lang="ts">
import { api, type NotificationResponse } from "@/api";
import { msg } from "@/utils/message";
import { setNotificationResolved } from "@/services/notification-realtime";
import { ref } from "vue";

const props = defineProps<{
  entry: NotificationResponse;
  closing: boolean;
}>();

const retrying = ref(false);
const confirming = ref(false);

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function extractAgentTaskId(item: NotificationResponse): number | null {
  const extra = asObject(item.extraParams);
  return asNumber(extra.agentTaskId);
}

function isCompleted(item: NotificationResponse): boolean {
  const extra = asObject(item.extraParams);
  return extra.isCompleted === true;
}

const isFailed = () => !isCompleted(props.entry);

async function confirmResult() {
  confirming.value = true;
  try {
    await api.notification.resolveNotification(props.entry.id, {
      type: "AGENT_TASK_RESULT",
      value: true,
    });
    setNotificationResolved(props.entry.id);
    await msg.success("已确认");
  } catch (err: unknown) {
    msg.error(err instanceof Error ? err.message : "确认失败，请稍后再试");
  } finally {
    confirming.value = false;
  }
}

async function retryTask() {
  const agentTaskId = extractAgentTaskId(props.entry);
  if (!agentTaskId) {
    await msg.error("无法重试：缺少 AgentTaskId");
    return;
  }

  retrying.value = true;
  try {
    await api.agentTask.postAgentTaskByIdRetry(agentTaskId);
    await msg.success("已发起重试");
  } catch (err: unknown) {
    msg.error(err instanceof Error ? err.message : "重试失败，请稍后再试");
  } finally {
    retrying.value = false;
  }
}
</script>

<template>
  <div
    class="nw-task-result"
    :class="[
      {
        'nw-task-result--failed': isFailed(),
        'nw-task-result--closing': closing,
      },
    ]"
  >
    <div class="nw-task-result-top">
      <span class="nw-task-result-title">{{ entry.title || "任务结果" }}</span>
      <span class="nw-task-result-badge">{{
        isFailed() ? "失败" : "完成"
      }}</span>
    </div>

    <p class="nw-task-result-content">{{ entry.content }}</p>

    <div class="nw-task-result-actions">
      <button
        class="nw-task-result-confirm"
        :disabled="confirming || retrying"
        @click="confirmResult"
      >
        {{ confirming ? "确认中..." : "确认" }}
      </button>
      <button
        v-if="isFailed()"
        class="nw-task-result-retry"
        :disabled="retrying || confirming"
        @click="retryTask"
      >
        {{ retrying ? "重试中..." : "重试" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.nw-task-result {
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

.nw-task-result--closing {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  border-width: 0;
  overflow: hidden;
}

.nw-task-result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.nw-task-result-title {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nw-task-result-badge {
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgb(0 104 119 / 0.18);
  background: rgb(0 104 119 / 0.06);
  color: var(--primary);
  font-size: 0.65rem;
  padding: 0.05rem 0.42rem;
}

.nw-task-result--failed .nw-task-result-badge {
  border-color: rgb(200 55 70 / 0.22);
  background: rgb(200 55 70 / 0.08);
  color: rgb(200 55 70);
}

.nw-task-result-content {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--foreground-muted);
  white-space: pre-wrap;
}

.nw-task-result-actions {
  display: flex;
  gap: 0.45rem;
  justify-content: flex-end;
}

.nw-task-result-confirm {
  border: 1px solid var(--outline-strong);
  border-radius: 999px;
  padding: 0.28rem 0.68rem;
  font-size: 0.74rem;
  background: color-mix(
    in srgb,
    var(--surface-container) 70%,
    var(--primary) 30%
  );
  color: var(--foreground);
  cursor: pointer;
}

.nw-task-result-confirm:hover:enabled {
  background: color-mix(
    in srgb,
    var(--surface-container) 56%,
    var(--primary) 44%
  );
}

.nw-task-result-retry {
  border: 1px solid var(--outline-strong);
  border-radius: 999px;
  padding: 0.28rem 0.68rem;
  font-size: 0.74rem;
  background: var(--surface-container);
  color: var(--foreground);
  cursor: pointer;
}

.nw-task-result-retry:hover:enabled {
  background: color-mix(
    in srgb,
    var(--surface-container) 72%,
    var(--primary) 28%
  );
}

.nw-task-result-confirm:disabled,
.nw-task-result-retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
