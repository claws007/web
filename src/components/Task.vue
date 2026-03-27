<template>
  <article class="task-card" role="region" :aria-label="`任务 #${task.id}`">
    <div class="task-main">
      <div class="task-content">
        <h3 class="task-title">任务 #{{ task.id }}</h3>

        <template v-if="isEditing">
          <div class="task-edit-wrap">
            <textarea
              :value="editContent"
              class="task-textarea"
              @input="onEditInput"
            />
            <div class="task-edit-actions">
              <button
                class="action-pill"
                :disabled="saving"
                @click="$emit('cancel-edit')"
              >
                取消
              </button>
              <button
                class="action-pill action-pill--primary"
                :disabled="saving"
                @click="$emit('save', task.id)"
              >
                {{ saving ? "保存中..." : "保存" }}
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="task-text" :title="task.content">
            {{ task.content }}
          </p>
        </template>
      </div>

      <div class="task-actions">
        <button
          class="action-btn"
          title="编辑"
          aria-label="编辑任务"
          :disabled="saving"
          @click="$emit('edit', task)"
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
          aria-label="删除任务"
          :disabled="saving"
          @click="$emit('delete', task.id)"
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

    <div class="task-footer">
      <div class="task-meta">
        <span class="meta-chip">ID: {{ task.id }}</span>
        <span class="meta-chip">更新时间: {{ task.updatedAt }}</span>
      </div>

      <button
        class="action-pill action-pill--primary"
        :disabled="saving"
        @click="$emit('assign', task)"
      >
        分配给Agent
      </button>
    </div>

    <div class="agent-task-wrap">
      <div v-if="agentTasks.length === 0" class="agent-task-empty">
        暂未分配 Agent
      </div>
      <div v-else class="agent-task-list">
        <div
          v-for="agentTask in agentTasks"
          :key="agentTask.id"
          class="agent-task-item"
        >
          <span class="agent-task-agent">
            {{ agentTask.agent?.name || `Agent #${agentTask.agentId}` }}
          </span>
          <span class="agent-task-state">{{
            getTaskStateText(agentTask.state)
          }}</span>
          <button
            class="agent-task-chat-link"
            type="button"
            @click="openAgentTaskChatHistory(agentTask.id)"
          >
            对话
          </button>
          <span class="agent-task-time">{{ agentTask.assignedAt }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type AgentTaskResponse, type TaskResponse } from "@/api";
import { dialogs } from "virtual:dialogs";

const props = defineProps<{
  task: TaskResponse;
  isEditing: boolean;
  editContent: string;
  saving: boolean;
}>();

const emit = defineEmits<{
  edit: [task: TaskResponse];
  delete: [taskId: number];
  assign: [task: TaskResponse];
  "cancel-edit": [];
  "update:edit-content": [content: string];
  save: [taskId: number];
}>();

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

function openAgentTaskChatHistory(agentTaskId: number) {
  if (!Number.isInteger(agentTaskId) || agentTaskId <= 0) {
    return;
  }

  const dialogMap = dialogs as unknown as {
    ManageAgentTaskChatHistoryDialog?: (props: {
      agentTaskId: number;
    }) => Promise<unknown>;
  };

  const openDialog = dialogMap.ManageAgentTaskChatHistoryDialog;
  if (!openDialog) {
    return;
  }

  void openDialog({ agentTaskId });
}

const agentTasks = computed<AgentTaskResponse[]>(() =>
  [...(props.task.agentTasks ?? [])].sort((a, b) => b.id - a.id)
);
</script>

<style scoped>
.task-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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

.task-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
  min-width: 0;
}

.task-content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.task-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--on-surface);
  line-height: 1.3;
}

.task-text {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.88rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.task-edit-wrap {
  display: grid;
  gap: 0.55rem;
}

.task-textarea {
  min-height: 5.1rem;
  resize: vertical;
  border-radius: 0.7rem;
  border: 1px solid rgb(34 211 238 / 0.24);
  background: rgb(255 255 255 / 0.95);
  padding: 0.65rem 0.7rem;
  font-size: 0.88rem;
  color: var(--on-surface);
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.task-textarea:focus {
  border-color: rgb(34 211 238 / 0.52);
  box-shadow: 0 0 0 3px rgb(34 211 238 / 0.15);
}

.task-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.action-pill {
  height: 1.95rem;
  border-radius: 999px;
  border: 1px solid rgb(34 211 238 / 0.25);
  background: transparent;
  padding: 0 0.8rem;
  font-size: 0.75rem;
  color: var(--on-surface);
  cursor: pointer;
}

.action-pill--primary {
  border-color: transparent;
  background: var(--primary);
  color: white;
  font-weight: 600;
}

.action-pill:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.task-actions {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.task-card:hover .task-actions,
.task-card:focus-within .task-actions {
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
    border-color 0.12s ease,
    opacity 0.12s ease;
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

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.task-meta {
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

.agent-task-wrap {
  display: grid;
  gap: 0.4rem;
  border-top: 1px dashed rgb(34 211 238 / 0.25);
  padding-top: 0.55rem;
}

.agent-task-empty {
  font-size: 0.78rem;
  color: var(--on-surface-variant);
}

.agent-task-empty--error {
  color: rgb(220 38 38);
}

.agent-task-list {
  display: grid;
  gap: 0.35rem;
}

.agent-task-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  font-size: 0.76rem;
  color: var(--on-surface-variant);
}

.agent-task-agent {
  color: var(--on-surface);
  font-weight: 600;
  border-radius: 999px;
  background: rgb(204 251 241 / 0.5);
  padding: 0.15rem 0.5rem;
}

.agent-task-state {
  border-radius: 999px;
  background: rgb(34 211 238 / 0.12);
  color: rgb(14 116 144);
  padding: 0.15rem 0.45rem;
}

.agent-task-time {
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-task-chat-link {
  border: 1px solid rgb(34 211 238 / 0.3);
  border-radius: 999px;
  background: rgb(34 211 238 / 0.08);
  color: rgb(14 116 144);
  font-size: 0.72rem;
  line-height: 1;
  padding: 0.18rem 0.5rem;
  cursor: pointer;
}

.agent-task-chat-link:hover {
  background: rgb(34 211 238 / 0.16);
}

@media (max-width: 640px) {
  .task-card {
    padding: 0.9rem;
  }

  .task-actions {
    opacity: 1;
  }
}
</style>
