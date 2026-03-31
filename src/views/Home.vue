<template>
  <div class="px-10 p-5 h size-full items-stretch gap-5">
    <!-- 头部：标题 + 新建按钮 -->
    <section class="flex flex-col gap-6 flex-1 shrink">
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

    <section class="h-full flex-[1.5] min-w-0 v gap-3">
      <Textarea
        v-model="newTaskContent"
        placeholder="创建任务"
        @enter="handleCreateTask"
      />
      <div
        v-if="taskError"
        class="mt-4 rounded-xl border border-[rgb(192_57_43/0.35)] bg-[rgb(192_57_43/0.08)] px-3 py-2 text-sm text-[#c0392b]"
      >
        {{ taskError }}
      </div>

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
          v-for="task in sortedTasks"
          :key="task.id"
          :task="task"
          :is-editing="editingTaskId === task.id"
          :edit-content="editTaskContent"
          :saving="taskSaving"
          :selected="selectedTaskId === task.id"
          class="cursor-pointer"
          :class="{
            'opacity-70':
              isTaskCompleted(task.id) && selectedTaskId !== task.id,
          }"
          @click="handleTaskClick(task)"
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
    </section>
    <div class="flex-5 shrink flex flex-col min-w-0">
      <AgentTaskBubbles
        v-if="selectedTaskId && tasks.find((t) => t.id === selectedTaskId)"
        :task="tasks.find((t) => t.id === selectedTaskId)!"
        :all-agents="agents"
        @close="selectedTaskId = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  api,
  readStoredActiveCompanyId,
  type AgentResponse,
  type TaskResponse,
} from "@/api";
import type {
  AgentTaskEntityRecord,
  EntityChangePayload,
  TaskEntityRecord,
} from "@/api/generated-ws";
import AgentCard from "@/components/AgentCard.vue";
import Task from "@/components/Task.vue";
import AgentTaskBubbles from "@/components/AgentTaskBubbles.vue";
import { dialogs } from "virtual:dialogs";
import {
  registerEntityChangeHandler,
  requestRealtimeSubscription,
} from "@/services/events-realtime";
import { useUserStore } from "@/store/user";
import { notify } from "@/components/notification";

const userStore = useUserStore();

const agents = ref<AgentResponse[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const taskLoading = ref(false);
const taskSaving = ref(false);
const taskError = ref<string | null>(null);
const tasks = ref<TaskResponse[]>([]);

type TaskChainStatus = "completed" | "incompleteOrFailed";
const finishedStates = new Set(["FINISHED", "CANCELLED", "TRANSFERRED"]);

function getTaskChainStatus(task: TaskResponse): TaskChainStatus {
  const agentTasks = task.agentTasks ?? [];
  const allDone =
    agentTasks.length > 0 &&
    agentTasks.every((at) =>
      finishedStates.has((at.state ?? "").toUpperCase()),
    );
  return allDone ? "completed" : "incompleteOrFailed";
}

const taskChainStatusMap = ref<Map<number, TaskChainStatus>>(new Map());

const sortedTasks = computed(() =>
  [...tasks.value].sort((a, b) => {
    const sa = taskChainStatusMap.value.get(a.id) ?? "incompleteOrFailed";
    const sb = taskChainStatusMap.value.get(b.id) ?? "incompleteOrFailed";
    if (sa === "incompleteOrFailed" && sb === "completed") return -1;
    if (sa === "completed" && sb === "incompleteOrFailed") return 1;
    return b.id - a.id;
  }),
);

function isTaskCompleted(taskId: number): boolean {
  return (
    (taskChainStatusMap.value.get(taskId) ?? "incompleteOrFailed") ===
    "completed"
  );
}

const newTaskContent = ref("");

const editingTaskId = ref<number | null>(null);
const editTaskContent = ref("");
const selectedTaskId = ref<number | null>(null);

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
      query: { page: 1, pageSize: 30 },
    } as any);
    tasks.value = res.data.items ?? [];
    taskChainStatusMap.value = new Map(
      tasks.value.map((t) => [t.id, getTaskChainStatus(t)]),
    );
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
    selectedTaskId.value = task.id;
    await fetchTasks();
    notify.success(`Task #${task.id} 已分配给 Agent #${agentId}`);
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

function handleTaskClick(task: TaskResponse) {
  selectedTaskId.value = task.id;
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
  taskChainStatusMap.value = new Map(
    taskChainStatusMap.value.set(payload.taskId, payload.taskChainStatus),
  );
}

// ---------- Realtime ----------

function handleEntityChange(payload: EntityChangePayload) {
  const companyId = readStoredActiveCompanyId();
  if (payload.companyId !== companyId) return;

  if (payload.entity === "task") {
    handleTaskEntityChange(payload);
  } else if (payload.entity === "agent_task") {
    handleAgentTaskEntityChange(payload);
  }
}

function handleTaskEntityChange(payload: EntityChangePayload) {
  const taskId = Number(payload.entityId);

  if (payload.operation === "delete") {
    tasks.value = tasks.value.filter((t) => t.id !== taskId);
    const next = new Map(taskChainStatusMap.value);
    next.delete(taskId);
    taskChainStatusMap.value = next;
    if (selectedTaskId.value === taskId) selectedTaskId.value = null;
    if (editingTaskId.value === taskId) cancelEditTask();
    return;
  }

  const record = payload.record as TaskEntityRecord;

  if (payload.operation === "create") {
    if (!tasks.value.some((t) => t.id === taskId)) {
      const newTask: TaskResponse = {
        id: taskId,
        companyId: payload.companyId,
        content: record.content,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        agentTasks: [],
      };
      tasks.value.unshift(newTask);
      taskChainStatusMap.value = new Map(
        taskChainStatusMap.value.set(taskId, getTaskChainStatus(newTask)),
      );
    }
    return;
  }

  if (payload.operation === "update") {
    const idx = tasks.value.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks.value[idx] = {
        ...tasks.value[idx]!,
        content: record.content,
        updatedAt: record.updatedAt,
      };
    }
  }
}

function handleAgentTaskEntityChange(payload: EntityChangePayload) {
  const record = payload.record as AgentTaskEntityRecord;
  const taskId = record.taskId;
  const agentTaskId = Number(payload.entityId);

  const taskIdx = tasks.value.findIndex((t) => t.id === taskId);
  if (taskIdx === -1) return;

  const task = tasks.value[taskIdx]!;
  const agentTasks = [...(task.agentTasks ?? [])];

  if (payload.operation === "delete") {
    tasks.value[taskIdx] = {
      ...task,
      agentTasks: agentTasks.filter((at) => at.id !== agentTaskId),
    };
  } else if (payload.operation === "create") {
    if (!agentTasks.some((at) => at.id === agentTaskId)) {
      agentTasks.push({
        id: agentTaskId,
        agentId: record.agentId,
        content: record.content,
        ac: record.ac as string | null,
        state: record.state,
        queueOrder: record.queueOrder,
        assignedAt: record.assignedAt,
        startedAt: record.startedAt as string | null,
        finishedAt: record.finishedAt as string | null,
        updatedAt: record.updatedAt,
      });
      tasks.value[taskIdx] = { ...task, agentTasks };
    }
  } else if (payload.operation === "update") {
    const atIdx = agentTasks.findIndex((at) => at.id === agentTaskId);
    if (atIdx !== -1) {
      agentTasks[atIdx] = {
        ...agentTasks[atIdx]!,
        state: record.state,
        startedAt: record.startedAt as string | null,
        finishedAt: record.finishedAt as string | null,
        updatedAt: record.updatedAt,
      };
    } else {
      agentTasks.push({
        id: agentTaskId,
        agentId: record.agentId,
        content: record.content,
        ac: record.ac as string | null,
        state: record.state,
        queueOrder: record.queueOrder,
        assignedAt: record.assignedAt,
        startedAt: record.startedAt as string | null,
        finishedAt: record.finishedAt as string | null,
        updatedAt: record.updatedAt,
      });
    }
    tasks.value[taskIdx] = { ...task, agentTasks };
  }

  const updatedTask = tasks.value[taskIdx]!;
  taskChainStatusMap.value = new Map(
    taskChainStatusMap.value.set(taskId, getTaskChainStatus(updatedTask)),
  );
}

let cleanupRealtime: (() => void) | null = null;

function setupRealtime() {
  const companyId = readStoredActiveCompanyId();
  if (!companyId) return;

  const releaseSubscription = requestRealtimeSubscription({
    token: userStore.token,
    companyId,
    events: ["entity_change"],
    entities: ["task", "agent_task"],
  });

  const unregister = registerEntityChangeHandler(handleEntityChange, {
    entities: ["task", "agent_task"],
  });

  cleanupRealtime = () => {
    releaseSubscription();
    unregister();
  };
}

onMounted(async () => {
  await fetchAgents();
  setupRealtime();
});

onUnmounted(() => {
  cleanupRealtime?.();
});
</script>
