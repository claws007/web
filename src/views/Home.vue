<template>
  <div class="p-10 h size-full items-stretch gap-10">
    <!-- 头部：标题 + 新建按钮 -->
    <section class="flex flex-col gap-6 flex-2 sticky top-0">
      <div class="flex items-center justify-between">
        <div class="v gap-1">
          <div class="text-xl font-bold">员工列表</div>
          <div class="text-sm text-(--on-surface-variant)">Agents</div>
        </div>
        <button
          class="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border-0 bg-linear-to-br from-primary to-secondary px-4 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
          title="新建 Agent"
          aria-label="新建 Agent"
          @click="
            dialogs.EditOrCreateAgentDialog().resolve((created) => {
              if (created) agents.unshift(created);
            })
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>新建</span>
        </button>
      </div>

      <!-- 加载中 -->
      <div
        v-if="loading"
        class="flex min-h-48 items-center justify-center gap-2 text-sm text-(--on-surface-variant)"
      >
        <span class="size-2.5 animate-pulse rounded-full bg-primary" />
        <span
          class="size-2.5 animate-pulse rounded-full bg-primary [animation-delay:0.2s]"
        />
        <span
          class="size-2.5 animate-pulse rounded-full bg-primary [animation-delay:0.4s]"
        />
      </div>

      <!-- 错误 -->
      <div
        v-else-if="error"
        class="flex min-h-48 items-center justify-center gap-2 text-sm text-[#c0392b]"
      >
        {{ error }}
      </div>

      <!-- 空列表 -->
      <div
        v-else-if="agents.length === 0"
        class="flex min-h-48 flex-col items-center justify-center gap-2 text-sm text-(--on-surface-variant)"
      >
        暂无员工，点击「新建」创建第一个 Agent
      </div>

      <!-- Agent 卡片列表 -->
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4"
      >
        <AgentCard
          v-for="agent in agents"
          :key="agent.id"
          :agent="agent"
          @edit="handleEdit"
          @delete="handleDelete"
          @remove-by-id="handleRemoveById"
        />
      </div>
    </section>

    <section class="h-full flex-3 min-w-0 v gap-5">
      <div
        v-if="taskError"
        class="mt-4 rounded-xl border border-[rgb(192_57_43/0.35)] bg-[rgb(192_57_43/0.08)] px-3 py-2 text-sm text-[#c0392b]"
      >
        {{ taskError }}
      </div>

      <Tabs v-model="activeTaskTab" :items="taskTabs" />

      <div
        v-if="taskLoading"
        class="stretch mt-4 flex min-h-36 items-center justify-center text-sm text-(--on-surface-variant)"
      >
        正在加载任务...
      </div>

      <div
        v-else-if="tasks.length === 0"
        class="stretch mt-4 flex min-h-36 items-center justify-center rounded-md border border-dashed border-[rgb(0_104_119/0.2)] text-sm text-(--on-surface-variant)"
      >
        暂无任务，先创建一个吧
      </div>

      <div v-else class="v gap-5 stretch overflow-y-auto">
        <Task
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :is-editing="editingTaskId === task.id"
          :edit-content="editTaskContent"
          :saving="taskSaving"
          @edit="startEditTask"
          @delete="handleDeleteTask"
          @assign="handleAssignTask"
          @cancel-edit="cancelEditTask"
          @save="handleSaveTask"
          @update:edit-content="editTaskContent = $event"
          @realtime-deleted="handleTaskRealtimeDeleted"
          @realtime-agent-task-state="handleTaskRealtimeAgentTaskState"
        />
      </div>
      <Textarea
        v-model="newTaskContent"
        placeholder="创建任务"
        @enter="handleCreateTask"
      />
    </section>
    <div class="flex-5">hello world</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  api,
  readStoredActiveCompanyId,
  type AgentResponse,
  type TaskResponse,
} from "@/api";
import AgentCard from "@/components/AgentCard.vue";
import Task from "@/components/Task.vue";
import Tabs from "@/components/Tabs.vue";
import { dialogs } from "virtual:dialogs";

const agents = ref<AgentResponse[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const taskLoading = ref(false);
const taskSaving = ref(false);
const taskError = ref<string | null>(null);
const tasks = ref<TaskResponse[]>([]);

type TaskTabValue = "incompleteOrFailed" | "completed";
const activeTaskTab = ref<TaskTabValue>("incompleteOrFailed");
const taskTabs = computed(() => [
  { id: "incompleteOrFailed", label: "未完成" },
  { id: "completed", label: "已完成" },
]);

const newTaskContent = ref("");

const editingTaskId = ref<number | null>(null);
const editTaskContent = ref("");
type TaskChainStatus = "completed" | "incompleteOrFailed";

async function fetchAgents() {
  loading.value = true;
  error.value = null;

  try {
    const res = await api.agent.getAgent({ subAgents: false });
    agents.value = res.data?.items ?? [];
    await fetchTasks();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "获取员工列表失败，请重试";
  } finally {
    loading.value = false;
  }
}

async function fetchTasks() {
  const companyId = readStoredActiveCompanyId();
  if (!companyId) {
    taskError.value = "未选择公司，无法加载 Task 列表";
    tasks.value = [];
    return;
  }

  taskLoading.value = true;
  taskError.value = null;
  try {
    const res = await api.company.getCompanyByCompanyIdTask(companyId, {
      query: {
        page: 1,
        pageSize: 30,
        agentTaskChainStatus: activeTaskTab.value,
      },
    } as any);
    tasks.value = (res.data.items ?? []).sort((a, b) => b.id - a.id);
  } catch (e) {
    taskError.value = e instanceof Error ? e.message : "获取 Task 列表失败";
  } finally {
    taskLoading.value = false;
  }
}

async function handleCreateTask() {
  const companyId = readStoredActiveCompanyId();
  if (!companyId) {
    dialogs.MessageDialog({
      type: "error",
      content: "未选择公司，无法创建 Task",
    });
    return;
  }

  const content = newTaskContent.value.trim();
  if (!content) {
    dialogs.MessageDialog({ type: "error", content: "请输入任务内容" });
    return;
  }

  taskSaving.value = true;
  try {
    await api.company.postCompanyByCompanyIdTask(companyId, {
      content,
    });
    newTaskContent.value = "";
    await fetchTasks();
  } catch (e) {
    dialogs.MessageDialog({
      type: "error",
      content: e instanceof Error ? e.message : "创建 Task 失败",
    });
  } finally {
    taskSaving.value = false;
  }
}

function startEditTask(task: TaskResponse) {
  editingTaskId.value = task.id;
  editTaskContent.value = task.content || "";
}

function cancelEditTask() {
  editingTaskId.value = null;
  editTaskContent.value = "";
}

async function handleSaveTask(taskId: number) {
  const companyId = readStoredActiveCompanyId();
  if (!companyId) {
    dialogs.MessageDialog({
      type: "error",
      content: "未选择公司，无法保存 Task",
    });
    return;
  }

  const content = editTaskContent.value.trim();
  if (!content) {
    dialogs.MessageDialog({ type: "error", content: "任务内容不能为空" });
    return;
  }

  taskSaving.value = true;
  try {
    await api.company.putCompanyByCompanyIdTaskById(companyId, taskId, {
      content,
    });
    cancelEditTask();
    await fetchTasks();
  } catch (e) {
    dialogs.MessageDialog({
      type: "error",
      content: e instanceof Error ? e.message : "保存任务失败",
    });
  } finally {
    taskSaving.value = false;
  }
}

async function handleDeleteTask(taskId: number) {
  const companyId = readStoredActiveCompanyId();
  if (!companyId) {
    dialogs.MessageDialog({
      type: "error",
      content: "未选择公司，无法删除 Task",
    });
    return;
  }

  dialogs
    .ConfirmDialog({
      title: "删除 Task",
      content: `确定要删除 Task #${taskId} 吗？此操作不可恢复。`,
      confirmText: "删 除",
      confirmType: "danger",
    })
    .resolve(async () => {
      taskSaving.value = true;
      try {
        await api.company.deleteCompanyByCompanyIdTaskById(companyId, taskId);
        if (editingTaskId.value === taskId) {
          cancelEditTask();
        }
        await fetchTasks();
      } catch (e) {
        dialogs.MessageDialog({
          type: "error",
          content: e instanceof Error ? e.message : "删除任务失败",
        });
      } finally {
        taskSaving.value = false;
      }
    });
}

async function handleAssignTask(task: TaskResponse) {
  let allAgents: AgentResponse[] = [];
  try {
    const res = await api.agent.getAgent({ subAgents: false } as any);
    allAgents = res.data.items ?? [];
  } catch (err) {
    dialogs.MessageDialog({
      type: "error",
      content: err instanceof Error ? err.message : "获取 Agent 列表失败",
    });
    return;
  }

  if (!allAgents.length) {
    dialogs.MessageDialog({
      type: "error",
      content: "暂无可分配 Agent，请先创建 Agent",
    });
    return;
  }

  const result = await dialogs.SelectOptionDialog({
    title: "选择 Agent",
    description: `将 Task #${task.id} 分配给一个 Agent`,
    modelValue: null,
    pageSize: 10,
    searchPlaceholder: "按名称搜索 Agent",
    emptyText: "暂无可选 Agent",
    loadingText: "正在加载 Agent...",
    fetchOptions: async ({ keyword, page, pageSize }) => {
      const kw = keyword?.trim().toLowerCase() ?? "";
      const filtered = kw
        ? allAgents.filter((agent) => {
            const name = (agent.name ?? "").toLowerCase();
            const description = (agent.description ?? "").toLowerCase();
            return name.includes(kw) || description.includes(kw);
          })
        : allAgents;

      const start = (page - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);
      return {
        items: pageItems.map((agent) => ({
          id: agent.id,
          label: agent.name || `Agent #${agent.id}`,
          description: agent.description || "-",
          keywords: [agent.name ?? "", agent.description ?? ""],
        })),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    normalizeKeyword: (value) => value.trim(),
    allowEmptyKeyword: true,
    searchOnInput: true,
    debounceMs: 160,
  });

  if (result.type !== "resolve" || !result.value) {
    return;
  }

  const agentId = Number(result.value.id);
  if (!agentId) {
    return;
  }

  taskSaving.value = true;
  try {
    await api.agent.postAgentByIdTasks(agentId, {
      taskId: task.id,
      content: task.content,
    } as any);
    await fetchTasks();
    dialogs.MessageDialog({
      type: "success",
      content: `Task #${task.id} 已分配给 Agent #${agentId}`,
    });
  } catch (err) {
    dialogs.MessageDialog({
      type: "error",
      content: err instanceof Error ? err.message : "分配 Agent 失败",
    });
  } finally {
    taskSaving.value = false;
  }
}

async function handleEdit(agent: AgentResponse) {
  dialogs.EditOrCreateAgentDialog({ id: agent.id }).resolve((updated) => {
    if (updated) {
      const idx = agents.value.findIndex((a) => a.id === updated.id);
      if (idx !== -1) {
        agents.value[idx] = updated;
      }
    }
  });
}

async function handleDelete(agent: AgentResponse) {
  dialogs
    .ConfirmDialog({
      title: "删除员工",
      content: `确定要删除「${agent.name || "未命名 Agent"}」吗？此操作不可恢复。`,
      confirmText: "删 除",
      confirmType: "danger",
    })
    .resolve(async () => {
      try {
        await api.agent.deleteAgentById(agent.id!);
        agents.value = agents.value.filter((a) => a.id !== agent.id);
      } catch (e) {
        dialogs.MessageDialog({
          type: "error",
          content: e instanceof Error ? e.message : "删除失败，请重试",
        });
      }
    });
}

function handleRemoveById(agentId: number) {
  agents.value = agents.value.filter((agent) => agent.id !== agentId);
}

function handleTaskRealtimeDeleted(taskId: number) {
  tasks.value = tasks.value.filter((t) => t.id !== taskId);
  if (editingTaskId.value === taskId) {
    cancelEditTask();
  }
}

function handleTaskRealtimeAgentTaskState(payload: {
  taskId: number;
  taskChainStatus: TaskChainStatus;
}) {
  if (payload.taskChainStatus !== activeTaskTab.value) {
    tasks.value = tasks.value.filter((t) => t.id !== payload.taskId);
  }
}

watch(activeTaskTab, async () => {
  await fetchTasks();
});

onMounted(fetchAgents);
</script>
