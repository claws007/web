<template>
  <div class="size-full h items-stretch bg-light">
    <div
      class="w-75 bg-light-2 border-r border-light-4 v [&>div]:px-4 py-4 gap-4"
    >
      <div class="h justify-between items-center">
        <div>Agents</div>
        <div class="h items-center gap-2">
          <Button type="primary" @click="openCreateAgent">
            <PlusOutlined /> New Agent
          </Button>
          <Button @click="dialogs.SettingsDialog()">
            <SettingOutlined />
          </Button>
        </div>
      </div>
      <div
        v-if="errorMessage"
        class="mx-4 rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
      >
        {{ errorMessage }}
      </div>
      <div v-if="isLoading" class="mx-4 text-light text-sm">
        Loading agents...
      </div>
      <div v-else-if="agents.length === 0" class="mx-4 text-light text-sm">
        No agent found.
      </div>
      <div v-else class="stretch gap-2 v">
        <SelectableTag
          v-for="agent in agents"
          :key="agent.id"
          :title="agent.name"
          :content="agent.description ?? `[Cap] ${agent.capacity}`"
          :menus="getAgentMenus(agent)"
          :selected="finalAgentId === agent.id"
          background="3"
          @click="currentAgentId = agent.id"
        ></SelectableTag>
      </div>
    </div>
    <div class="stretch overflow-y-auto v gap-2 p-4" v-if="finalAgent">
      <!-- <AgentDetail :agent="finalAgent"></AgentDetail> -->
      <div class="h justify-end">
        <Button type="primary" @click="openCreateTask">创建任务</Button>
      </div>
      <div
        v-if="taskErrorMessage"
        class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
      >
        {{ taskErrorMessage }}
      </div>
      <div v-if="isTaskLoading" class="text-light text-sm">
        Loading tasks...
      </div>
      <div v-else-if="tasks.length === 0" class="text-light text-sm">
        No tasks found.
      </div>
      <div v-else class="v gap-2">
        <div v-for="task in tasks" :key="task.id" class="v gap-1">
          <SelectableTag
            :title="`#${task.id} [${getTaskStateLabel(task.state)}]`"
            :content="
              task.ac ? `${task.content}\n[AC] ${task.ac}` : task.content
            "
            :menus="getTaskMenus(task)"
            background="2"
          >
            <template #title-prefix>
              <div
                class="cursor-pointer rounded bg-light-4 px-1 py-0.5 text-xs text-light hover:text-primary"
                @click.stop="toggleTaskChatHistories(task.id)"
              >
                {{
                  isTaskChatHistoriesExpanded(task.id) ? "收起Chat" : "展开Chat"
                }}
              </div>
            </template>
            <template #title-suffix>
              <Tooltip v-if="getToolCount(task) > 0">
                <Badge :value="`Tools: ${getToolCount(task)}`" />
                <template #content>
                  <div
                    class="max-h-[50vh] overflow-y-auto max-w-100 whitespace-pre-wrap break-all text-xs"
                  >
                    {{ getToolListTooltip(task) }}
                  </div>
                </template>
              </Tooltip>
            </template>
            <template #dropdown-prefix>
              <div class="h items-center gap-1" @click.stop>
                <Button
                  :disabled="!canStartTask(task) || actionTaskId === task.id"
                  :is-loading="isTaskStarting(task.id)"
                  @click="startTask(task)"
                >
                  <template
                    v-if="
                      ['FAILED', 'FINISHED'].includes(getTaskState(task.state))
                    "
                  >
                    <ReloadOutlined />
                  </template>
                  <template v-else>
                    <PlayCircleOutlined />
                  </template>
                </Button>
                <Button
                  v-if="getTaskState(task.state) === 'ACTIVE'"
                  danger
                  :disabled="!canStopTask(task) || actionTaskId === task.id"
                  :is-loading="isTaskStopping(task.id)"
                  @click="stopTask(task)"
                >
                  停止
                </Button>
              </div>
            </template>
          </SelectableTag>

          <div
            v-if="isTaskChatHistoriesExpanded(task.id)"
            class="ml-2 rounded bg-light-1 p-2"
          >
            <div class="v gap-1">
              <div class="text-light text-xs font-semibold">Chat History</div>

              <div
                v-if="isTaskChatHistoryLoading(task.id)"
                class="text-light text-xs"
              >
                Loading chat history...
              </div>
              <div
                v-else-if="getTaskChatHistoryError(task.id)"
                class="text-danger text-xs"
              >
                {{ getTaskChatHistoryError(task.id) }}
              </div>
              <div
                v-else-if="getTaskChatHistories(task.id).length === 0"
                class="text-light text-xs"
              >
                No chat history.
              </div>
              <div v-else class="v gap-1 overflow-y-auto">
                <div
                  v-for="history in getTaskChatHistories(task.id)"
                  :key="history.id"
                  class="v rounded bg-light group"
                >
                  <!-- <div
                    class="h items-center justify-between gap-2 group-hover:opacity-100 opacity-0"
                  >
                    <div class="h items-center gap-2 text-xs text-light-3">
                      {{ history.role }}
                      {{ history.eventType }}
                    </div>
                    <div class="h items-center gap-2 text-xs">
                      <div class="text-light">
                        {{ formatDateTime(history.createdAt) }}
                      </div>
                    </div>
                  </div> -->
                  <div :class="['text-sm h items-end gap-2']">
                    <template v-if="history.content">
                      <MarkdownPreviewer
                        class="stretch bg-light-2! p-2 rounded"
                        :model-value="history.content"
                        v-if="history.eventType === 'MESSAGE'"
                      ></MarkdownPreviewer>
                      <span
                        v-else
                        class="stretch text-xs text-light-2 truncate"
                      >
                        {{ history.content }}
                      </span>
                    </template>
                    <div v-else class="text-light-2 text-xs stretch">
                      <!-- message 为空，但模型返回了function called -->
                      tool called decided
                    </div>
                    <!-- <span class="text-xs text-light-2">
                      {{ formatDateTime(history.createdAt) }}
                    </span> -->
                    <Tooltip v-if="hasChatHistoryDetails(history)">
                      <InfoOutlined
                        class="cursor-pointer text-light hover:text-primary group-hover:opacity-100 opacity-0"
                      />
                      <template #content>
                        <div
                          class="v gap-1 max-w-100 max-h-[50vh] text-xs overflow-y-auto"
                        >
                          <div
                            v-for="(item, index) in getChatHistoryDetailItems(
                              history,
                            )"
                            :key="`${history.id}-${item.label}-${index}`"
                            class="v gap-0.5"
                          >
                            <div class="font-semibold">{{ item.label }}</div>
                            <div class="whitespace-pre-wrap break-all">
                              {{ item.value }}
                            </div>
                          </div>
                        </div>
                      </template>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { api } from "@/api";
import { dialogs } from "@/components/dialog";
import type {
  AgentResponse,
  AgentTaskResponse,
  ChatHistoryResponse,
  ToolListItem,
  ToolMetadata,
} from "@/api";
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";
import {
  InfoOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";

const agents = ref<AgentResponse[]>([]);
const tasks = ref<AgentTaskResponse[]>([]);
const isLoading = ref(false);
const isTaskLoading = ref(false);
const deletingId = ref<number | null>(null);
const deletingTaskId = ref<number | null>(null);
const actionTaskId = ref<number | null>(null);
const actionType = ref<"start" | "replay" | "stop" | null>(null);
const taskChatHistories = ref<Record<number, ChatHistoryResponse[]>>({});
const taskChatHistoryLoading = ref<Record<number, boolean>>({});
const taskChatHistoryErrors = ref<Record<number, string>>({});
const taskChatHistoriesExpanded = ref<Record<number, boolean>>({});
const errorMessage = ref("");
const taskErrorMessage = ref("");

const TASK_STATES = ["PENDING", "ACTIVE", "FAILED", "FINISHED"] as const;
type TaskState = (typeof TASK_STATES)[number];

onMounted(async () => {
  await loadAgents();
});

async function loadAgents() {
  errorMessage.value = "";
  isLoading.value = true;
  try {
    const response = await api.agent.getAgent();
    agents.value = response.data || [];
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to load agents.");
  } finally {
    isLoading.value = false;
  }
}

async function openCreateAgent() {
  await dialogs.CreateOrEditAgentDialog().finishPromise(async () => {
    await loadAgents();
  });
}

async function openEditAgent(id: number) {
  await dialogs.CreateOrEditAgentDialog({ id }).finishPromise(async () => {
    await loadAgents();
  });
}

async function openCreateTask() {
  if (!finalAgent.value) {
    return;
  }

  await dialogs
    .CreateOrEditAgentTaskDialog({ agentId: finalAgent.value.id })
    .finishPromise(async () => {
      await loadTasks(finalAgent.value!.id);
      return true;
    });
}

async function openEditTask(id: number) {
  if (!finalAgent.value) {
    return;
  }

  await dialogs.CreateOrEditAgentTaskDialog({ id }).finishPromise(async () => {
    await loadTasks(finalAgent.value!.id);
  });
}

async function deleteTask(id: number) {
  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete Task",
      content: "Are you sure you want to delete this task?",
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete || !finalAgent.value) {
    return;
  }

  deletingTaskId.value = id;
  taskErrorMessage.value = "";
  try {
    await api.agentTask.deleteAgentTaskById(id);
    await loadTasks(finalAgent.value.id);
  } catch (error) {
    taskErrorMessage.value = getErrorMessage(error, "Failed to delete task.");
  } finally {
    deletingTaskId.value = null;
  }
}

async function loadTasks(agentId: number) {
  taskErrorMessage.value = "";
  isTaskLoading.value = true;
  try {
    const response = await api.agent.getAgentByIdTasks(agentId);
    const sortedTasks = (response.data || []).slice().sort((a, b) => {
      return getTaskSortTimestamp(b) - getTaskSortTimestamp(a) || b.id - a.id;
    });
    tasks.value = sortedTasks;
    taskChatHistoriesExpanded.value = Object.fromEntries(
      tasks.value.map((task, index) => {
        const previousExpanded = taskChatHistoriesExpanded.value[task.id];
        const nextExpanded =
          previousExpanded ?? getDefaultTaskChatHistoriesExpanded(task, index);
        return [task.id, nextExpanded];
      }),
    ) as Record<number, boolean>;
    await loadTaskChatHistories(tasks.value.map((task) => task.id));
  } catch (error) {
    tasks.value = [];
    taskChatHistories.value = {};
    taskChatHistoryLoading.value = {};
    taskChatHistoryErrors.value = {};
    taskChatHistoriesExpanded.value = {};
    taskErrorMessage.value = getErrorMessage(error, "Failed to load tasks.");
  } finally {
    isTaskLoading.value = false;
  }
}

async function loadTaskChatHistories(taskIds: number[]) {
  const uniqTaskIds = Array.from(new Set(taskIds));

  const keep = new Set(uniqTaskIds);
  const nextChatHistories: Record<number, ChatHistoryResponse[]> = {};
  const nextChatHistoryErrors: Record<number, string> = {};

  for (const taskId of uniqTaskIds) {
    if (taskChatHistories.value[taskId]) {
      nextChatHistories[taskId] = taskChatHistories.value[taskId];
    }
    if (taskChatHistoryErrors.value[taskId]) {
      nextChatHistoryErrors[taskId] = taskChatHistoryErrors.value[taskId];
    }
  }

  taskChatHistories.value = nextChatHistories;
  taskChatHistoryErrors.value = nextChatHistoryErrors;
  taskChatHistoryLoading.value = Object.fromEntries(
    Object.entries(taskChatHistoryLoading.value).filter(([taskId]) =>
      keep.has(Number(taskId)),
    ),
  ) as Record<number, boolean>;

  await Promise.all(uniqTaskIds.map((taskId) => loadTaskChatHistory(taskId)));
}

async function loadTaskChatHistory(taskId: number) {
  taskChatHistoryLoading.value = {
    ...taskChatHistoryLoading.value,
    [taskId]: true,
  };

  const nextErrors = { ...taskChatHistoryErrors.value };
  delete nextErrors[taskId];
  taskChatHistoryErrors.value = nextErrors;

  try {
    const response =
      await api.chatHistory.getChatHistoryAgentTaskByAgentTaskId(taskId);
    const histories = (response.data || []).slice().sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    taskChatHistories.value = {
      ...taskChatHistories.value,
      [taskId]: histories,
    };
  } catch (error) {
    taskChatHistories.value = {
      ...taskChatHistories.value,
      [taskId]: [],
    };
    taskChatHistoryErrors.value = {
      ...taskChatHistoryErrors.value,
      [taskId]: getErrorMessage(error, "Failed to load chat history."),
    };
  } finally {
    taskChatHistoryLoading.value = {
      ...taskChatHistoryLoading.value,
      [taskId]: false,
    };
  }
}

function getTaskChatHistories(taskId: number) {
  return taskChatHistories.value[taskId] || [];
}

function isTaskChatHistoryLoading(taskId: number) {
  return !!taskChatHistoryLoading.value[taskId];
}

function getTaskChatHistoryError(taskId: number) {
  return taskChatHistoryErrors.value[taskId] || "";
}

function isTaskChatHistoriesExpanded(taskId: number) {
  return taskChatHistoriesExpanded.value[taskId] ?? false;
}

function toggleTaskChatHistories(taskId: number) {
  taskChatHistoriesExpanded.value = {
    ...taskChatHistoriesExpanded.value,
    [taskId]: !isTaskChatHistoriesExpanded(taskId),
  };
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return true;
}

function stringifyMetaValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getChatHistoryDetailItems(history: ChatHistoryResponse) {
  const rawItems: Array<{ label: string; value: unknown }> = [
    { label: "Event Type", value: history.eventType },
    { label: "Duration(ms)", value: history.durationMs },
    { label: "Extra Logs", value: history.extraLogs },
  ];

  return rawItems
    .filter((item) => hasValue(item.value))
    .map((item) => ({
      label: item.label,
      value: stringifyMetaValue(item.value),
    }));
}

function hasChatHistoryDetails(history: ChatHistoryResponse) {
  return getChatHistoryDetailItems(history).length > 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function getTaskSortTimestamp(task: AgentTaskResponse) {
  const createdAtValue = (
    task as AgentTaskResponse & { createdAt?: string | null }
  ).createdAt;
  const timestamp = createdAtValue || task.assignedAt || task.updatedAt;
  if (!timestamp) {
    return 0;
  }
  const parsed = new Date(timestamp).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDefaultTaskChatHistoriesExpanded(
  task: AgentTaskResponse,
  index: number,
) {
  if (index === 0) {
    return true;
  }

  return getTaskState(task.state) === "ACTIVE";
}

function getTaskState(state: string): TaskState {
  if ((TASK_STATES as readonly string[]).includes(state)) {
    return state as TaskState;
  }
  return "PENDING";
}

function getTaskStateLabel(state: string) {
  const normalized = getTaskState(state);
  return (
    {
      PENDING: "PENDING",
      ACTIVE: "ACTIVE",
      FAILED: "FAILED",
      FINISHED: "FINISHED",
    } as const
  )[normalized];
}

function getToolCount(task: AgentTaskResponse) {
  return task.toolList?.length || 0;
}

function getToolListTooltip(
  task: AgentTaskResponse & { toolList?: ToolListItem[] | null },
): string {
  if (!task.toolList?.length) {
    return "No tools";
  }

  // Group tools by mcp/local
  const localTools: string[] = [];
  const mcpGroups: Map<string, string[]> = new Map();

  task.toolList.forEach((tool) => {
    const toolName = tool.function.name;
    const metadata = tool.metadata as ToolMetadata | undefined;
    const mcpServerId = metadata?.mcpServerId;

    if (mcpServerId) {
      // Group by MCP server ID
      const serverKey = `mcp-${mcpServerId}`;
      if (!mcpGroups.has(serverKey)) {
        mcpGroups.set(serverKey, []);
      }
      mcpGroups.get(serverKey)!.push(toolName);
    } else {
      // Local tools
      localTools.push(toolName);
    }
  });

  // Format output
  const result: string[] = [];

  // Add local tools first
  if (localTools.length > 0) {
    result.push("local");
    localTools.forEach((name) => result.push(name));
  }

  // Add MCP tools grouped by server
  mcpGroups.forEach((tools, serverKey) => {
    result.push(serverKey);
    tools.forEach((name) => result.push("\t" + name));
  });

  return result.join("\n");
}

function canStartTask(task: AgentTaskResponse) {
  const state = getTaskState(task.state);
  return state === "PENDING" || state === "FAILED" || state === "FINISHED";
}

function canStopTask(task: AgentTaskResponse) {
  return getTaskState(task.state) === "ACTIVE";
}

function isTaskStarting(taskId: number) {
  return (
    actionTaskId.value === taskId &&
    (actionType.value === "start" || actionType.value === "replay")
  );
}

function isTaskStopping(taskId: number) {
  return actionTaskId.value === taskId && actionType.value === "stop";
}

async function startTask(task: AgentTaskResponse) {
  await dialogs
    .ConfirmDialog({
      content: `Are you sure you want to ${
        ["FAILED", "FINISHED"].includes(getTaskState(task.state))
          ? "replay"
          : "start"
      } this task?`,
    })
    .finishPromise();
  if (!canStartTask(task)) {
    return;
  }

  const state = getTaskState(task.state);
  await runTask(
    task.id,
    state === "FAILED" || state === "FINISHED" ? "replay" : "start",
  );
}

async function stopTask(task: AgentTaskResponse) {
  if (!canStopTask(task)) {
    return;
  }

  await stopTaskRun(task.id);
}

async function runTask(taskId: number, action: "start" | "replay") {
  if (!finalAgent.value) {
    return;
  }

  actionTaskId.value = taskId;
  actionType.value = action;
  taskErrorMessage.value = "";
  try {
    if (action === "replay") {
      await api.agentTask.postAgentTaskByIdRetry(taskId);
    } else {
      await api.agentTask.postAgentTaskByIdRun(taskId);
    }
    await loadTasks(finalAgent.value.id);
  } catch (error) {
    taskErrorMessage.value = getErrorMessage(
      error,
      action === "replay" ? "Failed to replay task." : "Failed to start task.",
    );
  } finally {
    actionTaskId.value = null;
    actionType.value = null;
  }
}

async function stopTaskRun(taskId: number) {
  if (!finalAgent.value) {
    return;
  }

  actionTaskId.value = taskId;
  actionType.value = "stop";
  taskErrorMessage.value = "";
  try {
    const stopApi = (api.agentTask as any).postAgentTaskByIdStop;
    if (typeof stopApi !== "function") {
      taskErrorMessage.value =
        "Current API does not expose a task stop endpoint. Please regenerate API after backend adds /agent-task/{id}/stop.";
      return;
    }

    await stopApi(taskId);
    await loadTasks(finalAgent.value.id);
  } catch (error) {
    taskErrorMessage.value = getErrorMessage(error, "Failed to stop task.");
  } finally {
    actionTaskId.value = null;
    actionType.value = null;
  }
}

async function deleteAgent(id: number) {
  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete Agent",
      content: "Are you sure you want to delete this agent?",
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  deletingId.value = id;
  errorMessage.value = "";
  try {
    await api.agent.deleteAgentById(id);
    await loadAgents();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to delete agent.");
  } finally {
    deletingId.value = null;
  }
}

function getAgentMenus(agent: AgentResponse): Menu[] {
  return [
    {
      id: "edit",
      name: "Edit",
      click: () => {
        void openEditAgent(agent.id);
      },
    },
    {
      id: "delete",
      name: deletingId.value === agent.id ? "Deleting..." : "Delete",
      danger: true,
      click: () => {
        if (deletingId.value === agent.id) {
          return;
        }
        void deleteAgent(agent.id);
      },
    },
  ];
}

function getTaskMenus(task: AgentTaskResponse): Menu[] {
  return [
    {
      id: "edit",
      name: "Edit",
      click: () => {
        void openEditTask(task.id);
      },
    },
    {
      id: "delete",
      name: deletingTaskId.value === task.id ? "Deleting..." : "Delete",
      danger: true,
      click: () => {
        if (deletingTaskId.value === task.id) {
          return;
        }
        void deleteTask(task.id);
      },
    },
  ];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "error" in error.error &&
    typeof error.error.error === "string"
  ) {
    return error.error.error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

const currentAgentId = ref<number>();
const finalAgentId = computed(() => {
  if (currentAgentId.value) {
    return currentAgentId.value;
  }
  const agentWithCapacity = agents.value.find((agent) => !!agent.capacity);
  return agentWithCapacity ? agentWithCapacity.id : agents.value[0]?.id;
});

const finalAgent = computed(() => {
  return agents.value.find((agent) => agent.id === finalAgentId.value);
});

watch(
  () => finalAgentId.value,
  async (agentId) => {
    if (!agentId) {
      tasks.value = [];
      return;
    }
    await loadTasks(agentId);
  },
  { immediate: true },
);
</script>
