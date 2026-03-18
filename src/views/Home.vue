<template>
  <div class="size-full h items-stretch bg-light">
    <div
      class="w-80 bg-light-2 border-r border-light-4 v overflow-hidden [&>div]:px-4 py-4 gap-4"
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
      <div v-else class="stretch gap-2 v overflow-y-auto">
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
    <div
      v-if="finalAgent"
      class="w-80 bg-light border-r border-light-4 v overflow-hidden [&>div]:px-4 py-4 gap-4"
    >
      <div class="h justify-between items-center">
        <div>Tasks</div>
        <div class="h items-center gap-2">
          <Button
            :disabled="tasks.length === 0 || isTaskLoading || clearingAllTasks"
            :is-loading="clearingAllTasks"
            @click="clearAllTasks"
          >
            <DeleteOutlined />
          </Button>
        </div>
      </div>
      <div v-if="finalAgent" class="px-4">
        <Input
          v-model="newTaskContent"
          placeholder="Enter task content and press Enter to create"
          @enter="createTaskFromInput"
        />
      </div>
      <div
        v-if="taskErrorMessage"
        class="mx-4 rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
      >
        {{ taskErrorMessage }}
      </div>
      <div v-if="isTaskLoading" class="mx-4 text-light text-sm">
        Loading tasks...
      </div>
      <div v-else-if="tasks.length === 0" class="mx-4 text-light text-sm">
        No tasks found.
      </div>
      <div v-else class="stretch v gap-2 overflow-y-auto">
        <SelectableTag
          v-for="task in tasks"
          :key="task.id"
          :title="`${task.content}`"
          :menus="getTaskMenus(task)"
          :selected="finalTaskId === task.id"
          background="2"
          @click="currentTaskId = task.id"
        >
        </SelectableTag>
      </div>
    </div>
    <div
      class="stretch overflow-y-auto v gap-2 p-4"
      v-if="finalAgent && finalTask"
    >
      <div class="h justify-between items-center">
        <div class="h items-center gap-2">
          <div class="text-light font-semibold">Chat History</div>
          <Tooltip v-if="getToolCount(finalTask) > 0">
            <!-- <Badge :value="`Tools: ${getToolCount(task)}`" /> -->
            <div class="text-light text-sm">
              <ToolOutlined />{{ getToolCount(finalTask) }}
            </div>
            <template #content>
              <div
                class="max-h-[50vh] overflow-y-auto max-w-100 whitespace-pre-wrap break-all text-xs"
              >
                {{ getToolListTooltip(finalTask) }}
              </div>
            </template>
          </Tooltip>
        </div>
        <div class="h items-center gap-1" @click.stop>
          <Tooltip
            v-if="
              ['FAILED', 'FINISHED'].includes(getTaskState(finalTask.state)) &&
              hasTaskResult(finalTask)
            "
          >
            <span class="cursor-pointer text-light text-xs hover:text-primary">
              {{ finalTask.state }}
            </span>
            <template #content>
              <div
                class="max-h-[50vh] overflow-y-auto max-w-100 whitespace-pre-wrap break-all text-xs"
              >
                {{ getTaskResultTooltip(finalTask) }}
              </div>
            </template>
          </Tooltip>
          <Button
            :disabled="
              !canStartTask(finalTask) || actionTaskId === finalTask.id
            "
            :is-loading="isTaskStarting(finalTask.id)"
            @click="startTask(finalTask)"
          >
            <template
              v-if="
                ['FAILED', 'FINISHED'].includes(getTaskState(finalTask.state))
              "
            >
              <ReloadOutlined />
            </template>
            <template v-else>
              <PlayCircleOutlined />
            </template>
          </Button>
          <Button
            v-if="getTaskState(finalTask.state) === 'ACTIVE'"
            danger
            :disabled="!canStopTask(finalTask) || actionTaskId === finalTask.id"
            :is-loading="isTaskStopping(finalTask.id)"
            @click="stopTask(finalTask)"
          >
            停止
          </Button>
          <Button
            v-if="getTaskState(finalTask.state) !== 'ACTIVE'"
            :disabled="actionTaskId === finalTask.id"
            :is-loading="isTaskResuming(finalTask.id)"
            @click="resumeTaskWithoutMessage(finalTask)"
          >
            Resume
          </Button>
        </div>
      </div>
      <div
        v-if="isTaskChatHistoryLoading(finalTask.id)"
        class="text-light text-xs"
      >
        Loading chat history...
      </div>
      <div
        v-else-if="getTaskChatHistoryError(finalTask.id)"
        class="text-danger text-xs"
      >
        {{ getTaskChatHistoryError(finalTask.id) }}
      </div>
      <div
        v-else-if="getTaskChatHistories(finalTask.id).length === 0"
        class="text-light text-xs"
      >
        No chat history.
      </div>
      <div v-else class="stretch v gap-1 overflow-y-auto">
        <div
          v-for="history in getTaskChatHistories(finalTask.id)"
          :key="history.id"
          class="v rounded bg-light group"
        >
          <div :class="['text-sm h items-end gap-2']">
            <template v-if="history.content.trim()">
              <MarkdownPreviewer
                class="stretch bg-light-2! p-2 rounded leading-relaxed"
                :model-value="history.content"
                v-if="history.eventType === 'MESSAGE'"
              ></MarkdownPreviewer>
              <template v-else>
                <div
                  v-if="
                    history.eventType === 'TOOL_CALL' &&
                    history.eventTypeName === 'execute_command'
                  "
                  class="v gap-1 rounded bg-light-2 p-1 px-2 text-xs"
                >
                  <div>
                    $
                    {{
                      (history.extraLogs as any)?.mcp?.call?.arguments?.command
                    }}
                  </div>
                  <pre class="text-light whitespace-pre-wrap break-all">{{
                    decodeURIComponent(
                      (history.extraLogs as any)?.mcp?.result?.rawOutput,
                    )
                  }}</pre>
                </div>
                <span v-else class="stretch text-xs text-light-2 truncate">
                  {{ history.content }}
                </span>
              </template>
            </template>
            <div v-else class="text-light-2 text-xs stretch">
              tool called decided
            </div>
            <Tooltip v-if="hasChatHistoryDetails(history)">
              <InfoOutlined
                class="cursor-pointer text-light hover:text-primary group-hover:opacity-100 opacity-0"
              />
              <template #content>
                <div
                  class="v gap-1 max-w-100 max-h-[50vh] text-xs overflow-y-auto"
                >
                  <div
                    v-for="(item, index) in getChatHistoryDetailItems(history)"
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
      <div class="mt-2">
        <Input
          v-model="taskResumeMessage"
          placeholder="Type message and press Enter to continue this task"
          :disabled="actionTaskId === finalTask.id"
          @enter="resumeTaskWithMessage(finalTask)"
        />
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
  DeleteOutlined,
  InfoOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  ToolOutlined,
} from "@ant-design/icons-vue";

const agents = ref<AgentResponse[]>([]);
const tasks = ref<AgentTaskResponse[]>([]);
const isLoading = ref(false);
const isTaskLoading = ref(false);
const clearingAllTasks = ref(false);
const deletingId = ref<number | null>(null);
const deletingTaskId = ref<number | null>(null);
const actionTaskId = ref<number | null>(null);
const actionType = ref<"start" | "replay" | "stop" | "resume" | null>(null);
const taskChatHistories = ref<Record<number, ChatHistoryResponse[]>>({});
const taskChatHistoryLoading = ref<Record<number, boolean>>({});
const taskChatHistoryErrors = ref<Record<number, string>>({});
const taskChatHistoryStreamTaskId = ref<number | null>(null);
const taskChatHistoryStreamController = ref<AbortController | null>(null);
const taskChatHistoryStreamReconnectTimer = ref<number | null>(null);
const taskChatHistoryStreamLastEventIds = ref<Record<number, string>>({});
const errorMessage = ref("");
const taskErrorMessage = ref("");
const newTaskContent = ref("");
const taskResumeMessage = ref("");

const TASK_STATES = [
  "PENDING",
  "ACTIVE",
  "FAILED",
  "FINISHED",
  "CANCELLED",
] as const;
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

  const previousTaskIds = new Set(tasks.value.map((task) => task.id));

  await dialogs
    .CreateOrEditAgentTaskDialog({ agentId: finalAgent.value.id })
    .finishPromise(async () => {
      await loadTasks(finalAgent.value!.id);

      const createdTask = tasks.value.find(
        (task) => !previousTaskIds.has(task.id),
      );
      if (createdTask) {
        currentTaskId.value = createdTask.id;
      }

      return true;
    });
}

async function createTaskFromInput() {
  if (!finalAgent.value || !newTaskContent.value.trim()) {
    return;
  }

  const previousTaskIds = new Set(tasks.value.map((task) => task.id));
  taskErrorMessage.value = "";

  try {
    await api.agent.postAgentByIdTasks(finalAgent.value.id, {
      content: newTaskContent.value.trim(),
    });

    newTaskContent.value = "";
    await loadTasks(finalAgent.value.id);

    const createdTask = tasks.value.find(
      (task) => !previousTaskIds.has(task.id),
    );
    if (createdTask) {
      currentTaskId.value = createdTask.id;
    }
  } catch (error) {
    taskErrorMessage.value = getErrorMessage(error, "Failed to create task.");
  }
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

async function clearAllTasks() {
  if (!finalAgent.value || tasks.value.length === 0) {
    return;
  }

  const shouldClear = await dialogs
    .ConfirmDialog({
      title: "Clear All Tasks",
      content: `Are you sure you want to delete all tasks for ${finalAgent.value.name}?`,
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldClear) {
    return;
  }

  clearingAllTasks.value = true;
  taskErrorMessage.value = "";
  try {
    const taskIds = tasks.value.map((task) => task.id);
    const results = await Promise.allSettled(
      taskIds.map((taskId) => api.agentTask.deleteAgentTaskById(taskId)),
    );
    const failedCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    await loadTasks(finalAgent.value.id);

    if (failedCount > 0) {
      taskErrorMessage.value = `Failed to delete ${failedCount} task(s).`;
    }
  } catch (error) {
    taskErrorMessage.value = getErrorMessage(error, "Failed to clear tasks.");
  } finally {
    clearingAllTasks.value = false;
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
    const previousTaskId = currentTaskId.value;
    tasks.value = sortedTasks;
    currentTaskId.value =
      previousTaskId && tasks.value.some((task) => task.id === previousTaskId)
        ? previousTaskId
        : tasks.value[0]?.id;
    await loadTaskChatHistories(tasks.value.map((task) => task.id));
  } catch (error) {
    tasks.value = [];
    currentTaskId.value = undefined;
    taskChatHistories.value = {};
    taskChatHistoryLoading.value = {};
    taskChatHistoryErrors.value = {};
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

function upsertTask(task: Partial<AgentTaskResponse> & { id: number }) {
  const index = tasks.value.findIndex((item) => item.id === task.id);
  if (index < 0) {
    return;
  }

  const nextTasks = tasks.value.slice();
  const mergedTask: AgentTaskResponse = {
    ...nextTasks[index],
    ...task,
  } as AgentTaskResponse;
  nextTasks[index] = mergedTask;
  tasks.value = nextTasks;
}

function mergeTaskChatHistories(
  taskId: number,
  histories: ChatHistoryResponse[],
) {
  if (!histories.length) {
    return;
  }

  const mergedMap = new Map<number, ChatHistoryResponse>();
  (taskChatHistories.value[taskId] || []).forEach((item) => {
    mergedMap.set(item.id, item);
  });
  histories.forEach((item) => {
    mergedMap.set(item.id, item);
  });

  const merged = Array.from(mergedMap.values()).sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  taskChatHistories.value = {
    ...taskChatHistories.value,
    [taskId]: merged,
  };
}

function parseSseEvent(rawEvent: string) {
  const result = {
    id: "",
    event: "message",
    data: "",
  };

  const lines = rawEvent.split(/\r?\n/);
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }
    const colonIndex = line.indexOf(":");
    const field = colonIndex >= 0 ? line.slice(0, colonIndex) : line;
    const rawValue = colonIndex >= 0 ? line.slice(colonIndex + 1) : "";
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    if (field === "id") {
      result.id = value;
    } else if (field === "event") {
      result.event = value || "message";
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  result.data = dataLines.join("\n");
  return result;
}

function extractTaskFromSsePayload(
  eventName: string,
  payload: unknown,
  fallbackTaskId: number,
): (Partial<AgentTaskResponse> & { id: number }) | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;

  if (eventName === "task_state") {
    const taskId = source.taskId;
    const state = source.state;
    if (
      typeof taskId === "number" &&
      taskId === fallbackTaskId &&
      typeof state === "string"
    ) {
      return {
        id: taskId,
        state,
      };
    }
  }

  const taskCandidate =
    source.task && typeof source.task === "object"
      ? (source.task as Record<string, unknown>)
      : source;

  if (
    typeof taskCandidate.id === "number" &&
    taskCandidate.id === fallbackTaskId &&
    typeof taskCandidate.state === "string"
  ) {
    return taskCandidate as unknown as Partial<AgentTaskResponse> & {
      id: number;
    };
  }

  return null;
}

function extractChatHistoriesFromSsePayload(
  payload: unknown,
  fallbackTaskId: number,
): ChatHistoryResponse[] {
  if (!payload) {
    return [];
  }

  const candidates: unknown[] = [];

  if (Array.isArray(payload)) {
    candidates.push(...payload);
  } else if (typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    if (Array.isArray(source.chatHistories)) {
      candidates.push(...source.chatHistories);
    }
    if (source.chatHistory) {
      candidates.push(source.chatHistory);
    }
    if (Array.isArray(source.histories)) {
      candidates.push(...source.histories);
    }
    if (source.history) {
      candidates.push(source.history);
    }
    if (
      typeof source.id === "number" &&
      typeof source.agentTaskId === "number" &&
      typeof source.createdAt === "string"
    ) {
      candidates.push(source);
    }
  }

  return candidates.filter((item): item is ChatHistoryResponse => {
    return !!(
      item &&
      typeof item === "object" &&
      typeof (item as ChatHistoryResponse).id === "number" &&
      typeof (item as ChatHistoryResponse).agentTaskId === "number" &&
      typeof (item as ChatHistoryResponse).createdAt === "string" &&
      ((item as ChatHistoryResponse).agentTaskId === fallbackTaskId ||
        !(item as ChatHistoryResponse).agentTaskId)
    );
  });
}

function clearTaskChatHistoryStreamReconnectTimer() {
  if (taskChatHistoryStreamReconnectTimer.value !== null) {
    window.clearTimeout(taskChatHistoryStreamReconnectTimer.value);
    taskChatHistoryStreamReconnectTimer.value = null;
  }
}

function stopTaskChatHistoryStream() {
  clearTaskChatHistoryStreamReconnectTimer();
  if (taskChatHistoryStreamController.value) {
    taskChatHistoryStreamController.value.abort();
    taskChatHistoryStreamController.value = null;
  }
  taskChatHistoryStreamTaskId.value = null;
}

function scheduleTaskChatHistoryStreamReconnect(
  taskId: number,
  delayMs = 1200,
) {
  clearTaskChatHistoryStreamReconnectTimer();
  taskChatHistoryStreamReconnectTimer.value = window.setTimeout(() => {
    void connectTaskChatHistoryStream(taskId);
  }, delayMs);
}

async function connectTaskChatHistoryStream(taskId: number) {
  if (taskChatHistoryStreamTaskId.value !== taskId) {
    return;
  }

  const controller = new AbortController();
  taskChatHistoryStreamController.value = controller;

  if (!taskChatHistoryStreamLastEventIds.value[taskId]) {
    const currentHistories = taskChatHistories.value[taskId] || [];
    const lastHistory = currentHistories[currentHistories.length - 1];
    if (lastHistory) {
      taskChatHistoryStreamLastEventIds.value = {
        ...taskChatHistoryStreamLastEventIds.value,
        [taskId]: String(lastHistory.id),
      };
    }
  }

  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  };
  const lastEventId = taskChatHistoryStreamLastEventIds.value[taskId];
  if (lastEventId) {
    headers["Last-Event-ID"] = lastEventId;
  }

  try {
    const response = await api.request<unknown, unknown>({
      path: `/agent-task/${taskId}/stream`,
      method: "GET",
      headers,
      signal: controller.signal,
      secure: true,
    });

    if (!response.ok || !response.body) {
      throw new Error(`SSE connection failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let shouldReconnect = true;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let splitIndex = buffer.indexOf("\n\n");
      while (splitIndex >= 0) {
        const rawEvent = buffer.slice(0, splitIndex).replace(/\r/g, "");
        buffer = buffer.slice(splitIndex + 2);

        const event = parseSseEvent(rawEvent);
        if (event.id) {
          taskChatHistoryStreamLastEventIds.value = {
            ...taskChatHistoryStreamLastEventIds.value,
            [taskId]: event.id,
          };
        }

        if (event.event === "done" || event.data === "[DONE]") {
          shouldReconnect = false;
          break;
        }

        if (event.data) {
          let payload: unknown = event.data;
          try {
            payload = JSON.parse(event.data);
          } catch {
            payload = event.data;
          }

          const incomingHistories = extractChatHistoriesFromSsePayload(
            payload,
            taskId,
          );
          if (incomingHistories.length > 0) {
            mergeTaskChatHistories(taskId, incomingHistories);
          }

          const incomingTask = extractTaskFromSsePayload(
            event.event,
            payload,
            taskId,
          );
          if (incomingTask) {
            upsertTask(incomingTask);
          }
        }

        splitIndex = buffer.indexOf("\n\n");
      }
    }

    if (!shouldReconnect && taskChatHistoryStreamTaskId.value === taskId) {
      stopTaskChatHistoryStream();
      return;
    }
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    taskChatHistoryErrors.value = {
      ...taskChatHistoryErrors.value,
      [taskId]: getErrorMessage(error, "Chat history stream disconnected."),
    };
  } finally {
    if (taskChatHistoryStreamController.value === controller) {
      taskChatHistoryStreamController.value = null;
    }

    const currentTask = tasks.value.find((task) => task.id === taskId);
    if (
      taskChatHistoryStreamTaskId.value === taskId &&
      currentTask &&
      ["PENDING", "ACTIVE"].includes(getTaskState(currentTask.state))
    ) {
      scheduleTaskChatHistoryStreamReconnect(taskId);
    }
  }
}

function startTaskChatHistoryStream(taskId: number) {
  if (taskChatHistoryStreamTaskId.value === taskId) {
    return;
  }
  stopTaskChatHistoryStream();
  taskChatHistoryStreamTaskId.value = taskId;
  void connectTaskChatHistoryStream(taskId);
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
    { label: "Event Type Name", value: history.eventTypeName },
    { label: "Duration(ms)", value: history.durationMs },
    { label: "Content", value: history.content },
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

function hasTaskResult(task: AgentTaskResponse & { result?: unknown }) {
  return hasValue(task.result);
}

function getTaskResultTooltip(task: AgentTaskResponse & { result?: unknown }) {
  if (!hasTaskResult(task)) {
    return "No result";
  }
  return stringifyMetaValue(task.result);
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

function getTaskState(state: string): TaskState {
  if ((TASK_STATES as readonly string[]).includes(state)) {
    return state as TaskState;
  }
  return "PENDING";
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
      localTools.push("\t" + toolName);
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
  return (
    state === "PENDING" ||
    state === "FAILED" ||
    state === "FINISHED" ||
    state === "CANCELLED"
  );
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

function isTaskResuming(taskId: number) {
  return actionTaskId.value === taskId && actionType.value === "resume";
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

async function resumeTaskWithoutMessage(task: AgentTaskResponse) {
  await retryContinueTask(task.id);
}

async function resumeTaskWithMessage(task: AgentTaskResponse) {
  const message = taskResumeMessage.value.trim();
  await retryContinueTask(task.id, message || undefined);
  taskResumeMessage.value = "";
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

async function retryContinueTask(taskId: number, message?: string) {
  if (!finalAgent.value) {
    return;
  }

  actionTaskId.value = taskId;
  actionType.value = "resume";
  taskErrorMessage.value = "";

  try {
    await api.agentTask.postAgentTaskByIdRetryContinue(taskId, {
      message: message || undefined,
    });
    await loadTasks(finalAgent.value.id);
  } catch (error) {
    taskErrorMessage.value = getErrorMessage(error, "Failed to continue task.");
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
const currentTaskId = ref<number>();
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

const finalTaskId = computed(() => {
  if (currentTaskId.value) {
    return currentTaskId.value;
  }
  return tasks.value[0]?.id;
});

const finalTask = computed(() => {
  return tasks.value.find((task) => task.id === finalTaskId.value);
});

watch(
  () => finalAgentId.value,
  async (agentId) => {
    if (!agentId) {
      tasks.value = [];
      currentTaskId.value = undefined;
      return;
    }
    currentTaskId.value = undefined;
    await loadTasks(agentId);
  },
  { immediate: true },
);

watch(
  () => ({
    taskId: finalTask.value?.id,
    taskState: finalTask.value?.state,
  }),
  ({ taskId, taskState }) => {
    if (!taskId || !taskState) {
      stopTaskChatHistoryStream();
      return;
    }

    const state = getTaskState(taskState);
    if (state === "PENDING" || state === "ACTIVE") {
      startTaskChatHistoryStream(taskId);
      return;
    }

    if (taskChatHistoryStreamTaskId.value === taskId) {
      stopTaskChatHistoryStream();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopTaskChatHistoryStream();
});
</script>
