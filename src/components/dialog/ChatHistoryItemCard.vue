<script setup lang="ts">
import { computed } from "vue";
import Tooltip from "@/components/Tooltip.vue";
import type { ChatHistoryResponse } from "@/api/generated";

const props = defineProps<{
  item: ChatHistoryResponse;
}>();

type InfoItem = {
  label: string;
  value: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pickInfoItem(label: string, value: unknown): InfoItem | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = toDisplay(value);
  if (!text || text === "-") {
    return null;
  }
  return { label, value: text };
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

function roleText(role: ChatHistoryResponse["role"]): string {
  if (role === "SYSTEM") {
    return "系统";
  }
  if (role === "USER") {
    return "用户";
  }
  return "助手";
}

function roleClass(role: ChatHistoryResponse["role"]): string {
  if (role === "SYSTEM") {
    return "role-chip role-chip--system";
  }
  if (role === "USER") {
    return "role-chip role-chip--user";
  }
  return "role-chip role-chip--assistant";
}

const debugContent = computed(() => {
  try {
    return JSON.stringify(props.item, null, 2);
  } catch {
    return String(props.item);
  }
});

const typedInfoItems = computed<InfoItem[]>(() => {
  const logs = isRecord(props.item.extraLogs) ? props.item.extraLogs : {};
  const execution = isRecord(logs.execution) ? logs.execution : {};
  const model = isRecord(logs.model) ? logs.model : {};
  const mcp = isRecord(logs.mcp) ? logs.mcp : {};
  const mcpCall = isRecord(mcp.call) ? mcp.call : {};
  const mcpResult = isRecord(mcp.result) ? mcp.result : {};
  const skill = isRecord(logs.skill) ? logs.skill : {};
  const tool = isRecord(logs.tool) ? logs.tool : {};
  const handoff = isRecord(logs.handoff) ? logs.handoff : {};
  const failure = isRecord(logs.failure) ? logs.failure : {};
  const result = isRecord(logs.result) ? logs.result : {};
  const ac = isRecord(logs.ac) ? logs.ac : {};

  const items: Array<InfoItem | null> = [
    pickInfoItem("步骤", execution.step),
    pickInfoItem("状态", execution.status),
  ];

  if (props.item.eventType === "MESSAGE") {
    const toolCalls = Array.isArray(model.toolCalls) ? model.toolCalls : [];
    items.push(pickInfoItem("完成原因", model.finishReason));
    items.push(pickInfoItem("Tool Calls", toolCalls.length));
  }

  if (props.item.eventType === "MCP_CALL") {
    items.push(pickInfoItem("MCP Tool", mcp.toolName));
    items.push(pickInfoItem("调用ID", mcpCall.toolCallId));
    items.push(pickInfoItem("调用参数", mcp.call));
  }

  if (props.item.eventType === "MCP_RESULT") {
    items.push(pickInfoItem("MCP Tool", mcp.toolName));
    items.push(pickInfoItem("结果状态", mcpResult.status));
    items.push(pickInfoItem("结果输出", mcpResult.rawOutput));
  }

  if (props.item.eventType === "TOOL_CALL") {
    const resolvedToolName =
      props.item.eventTypeName ||
      (typeof mcpCall.toolName === "string" ? mcpCall.toolName : null) ||
      (typeof tool.toolName === "string" ? tool.toolName : null);
    items.push(pickInfoItem("Tool", resolvedToolName));
    items.push(pickInfoItem("调用ID", mcpCall.toolCallId));
    items.push(pickInfoItem("Tool 状态", tool.status));
  }

  if (props.item.eventType === "SKILL_CALL") {
    items.push(pickInfoItem("Skill ID", skill.skillId));
    items.push(pickInfoItem("引用路径", skill.referencePath));
    items.push(pickInfoItem("调用ID", skill.toolCallId));
  }

  if (props.item.eventType === "EXECUTION") {
    items.push(pickInfoItem("切换请求", handoff.requestType));
    items.push(pickInfoItem("目标任务", handoff.createdTaskId));
    items.push(pickInfoItem("目标", handoff.target));
    items.push(pickInfoItem("失败码", failure.code));
    items.push(pickInfoItem("失败信息", failure.message));
    items.push(pickInfoItem("AC 检查", ac.passed));
    items.push(
      pickInfoItem(
        "任务结果状态",
        isRecord(result.taskResult) ? result.taskResult.status : null,
      ),
    );
  }

  if (props.item.eventTypeName) {
    items.push(pickInfoItem("事件名称", props.item.eventTypeName));
  }

  return items.filter((item): item is InfoItem => Boolean(item));
});
</script>

<template>
  <article class="history-card">
    <header class="history-head">
      <span :class="roleClass(item.role)">{{ roleText(item.role) }}</span>
      <span v-if="item.eventType" class="event-chip">{{ item.eventType }}</span>
      <span
        v-if="item.durationMs !== null && item.durationMs !== undefined"
        class="event-chip"
      >
        {{ item.durationMs }}ms
      </span>

      <div class="history-head-right">
        <time class="history-time">{{ formatDateTime(item.createdAt) }}</time>
        <Tooltip :content="debugContent" placement="left">
          <button
            class="history-debug-btn"
            type="button"
            aria-label="查看完整历史调试信息"
          >
            i
          </button>
        </Tooltip>
      </div>
    </header>

    <pre class="history-content">{{ item.content }}</pre>

    <div v-if="typedInfoItems.length > 0" class="typed-info-grid">
      <div
        v-for="meta in typedInfoItems"
        :key="meta.label"
        class="typed-info-item"
      >
        <span class="typed-info-label">{{ meta.label }}</span>
        <span class="typed-info-value">{{ meta.value }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.history-card {
  border: 1px solid rgb(34 211 238 / 0.22);
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: rgb(255 255 255 / 0.86);
}

.history-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.45rem;
}

.history-head-right {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.role-chip--system {
  color: rgb(146 64 14);
  background: rgb(254 243 199 / 0.7);
}

.role-chip--user {
  color: rgb(22 101 52);
  background: rgb(220 252 231 / 0.7);
}

.role-chip--assistant {
  color: rgb(30 64 175);
  background: rgb(219 234 254 / 0.7);
}

.event-chip {
  border-radius: 999px;
  border: 1px solid rgb(34 211 238 / 0.3);
  color: rgb(14 116 144);
  background: rgb(34 211 238 / 0.1);
  padding: 0.1rem 0.45rem;
  font-size: 0.7rem;
}

.history-time {
  color: var(--on-surface-variant);
  font-size: 0.72rem;
  white-space: nowrap;
}

.history-debug-btn {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgb(34 211 238 / 0.34);
  background: rgb(240 249 255 / 0.8);
  color: rgb(14 116 144);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}

.history-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--on-surface);
}

.typed-info-grid {
  margin-top: 0.45rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.35rem;
}

.typed-info-item {
  display: grid;
  gap: 0.08rem;
  border: 1px solid rgb(34 211 238 / 0.2);
  border-radius: 0.55rem;
  padding: 0.25rem 0.4rem;
  background: rgb(240 249 255 / 0.5);
  min-width: 0;
}

.typed-info-label {
  font-size: 0.68rem;
  color: var(--on-surface-variant);
}

.typed-info-value {
  font-size: 0.74rem;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .history-card {
    padding: 0.6rem;
  }

  .history-head {
    flex-wrap: wrap;
  }

  .history-head-right {
    margin-left: 0;
  }
}
</style>
