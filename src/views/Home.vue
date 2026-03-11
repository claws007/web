<script setup lang="ts">
import { api } from "@/api";
import { dialogs } from "@/components/dialog";
import type { AgentResponse } from "@/api";
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";
import { PlusOutlined, SettingOutlined } from "@ant-design/icons-vue";

const agents = ref<AgentResponse[]>([]);
const isLoading = ref(false);
const deletingId = ref<number | null>(null);
const errorMessage = ref("");

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
</script>

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
          :selected="deletingId === agent.id"
          background="3"
        ></SelectableTag>
      </div>
    </div>
  </div>
</template>
