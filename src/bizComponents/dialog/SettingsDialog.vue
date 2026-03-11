<template>
  <Dialog :dialog :title="title ?? 'Settings'" :width>
    <template #autoPadding>
      <div class="v gap-3">
        <DefaultTabs v-model="activeTab" :tabs="tabs" />

        <div v-if="activeTab === 'model'" class="v gap-3">
          <div class="h items-center justify-between gap-2">
            <div class="text-sm font-semibold">Model Management</div>
            <div class="h gap-2">
              <Button @click="loadModels">Refresh</Button>
              <Button type="primary" @click="openCreateModel"
                >Create Model</Button
              >
            </div>
          </div>

          <div
            v-if="modelErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ modelErrorMessage }}
          </div>

          <div v-if="modelIsLoading" class="text-light text-sm">
            Loading models...
          </div>

          <div v-else-if="models.length === 0" class="text-light text-sm">
            No model found.
          </div>

          <div v-else class="v gap-2">
            <SelectableTag
              v-for="model in models"
              :key="model.id"
              :selected="modelDeletingId === model.id"
              :title="model.name"
              :content="`Type: ${model.type}`"
              :menus="getModelMenus(model)"
            />
          </div>
        </div>

        <div v-else-if="activeTab === 'mcp'" class="v gap-3">
          <div class="h items-center justify-between gap-2">
            <div class="text-sm font-semibold">MCP Server Management</div>
            <div class="h gap-2">
              <Button @click="loadMcpServers">Refresh</Button>
              <Button type="primary" @click="openCreateMcpServer"
                >Create MCP Server</Button
              >
            </div>
          </div>

          <div
            v-if="mcpErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ mcpErrorMessage }}
          </div>

          <div v-if="mcpIsLoading" class="text-light text-sm">
            Loading MCP servers...
          </div>

          <div v-else-if="mcpServers.length === 0" class="text-light text-sm">
            No MCP server found.
          </div>

          <div v-else class="v gap-2">
            <SelectableTag
              v-for="mcpServer in mcpServers"
              :key="mcpServer.id"
              :selected="mcpDeletingId === mcpServer.id"
              :title="mcpServer.name || `MCP Server #${mcpServer.id}`"
              :content="mcpServer.url"
              :menus="getMcpServerMenus(mcpServer)"
            />
          </div>
        </div>

        <div
          v-else
          class="rounded border border-dashed border-light-4 bg-light-2 p-4 text-light text-sm"
        >
          Skill settings are not implemented yet.
        </div>
      </div>
    </template>

    <template #footer>
      <Button type="primary" @click="dialog.close()">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { api } from "@/api";
import { dialogs } from "@/components/dialog";
import type { AIModelResponse, MCPServerResponse } from "@/api";
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";
import type { DialogType } from "@/components/dialog/dialog";

type TabId = "model" | "skill" | "mcp";

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, void>;
    title?: string | null;
    width?: string;
  }>(),
  {
    title: null,
    width: "720px",
  },
);

const tabs: Array<{ id: TabId; title: string }> = [
  { id: "model", title: "Model" },
  { id: "skill", title: "Skill" },
  { id: "mcp", title: "MCP" },
];

const activeTab = ref<TabId>("model");
const models = ref<AIModelResponse[]>([]);
const mcpServers = ref<MCPServerResponse[]>([]);
const modelIsLoading = ref(false);
const mcpIsLoading = ref(false);
const modelDeletingId = ref<number | null>(null);
const mcpDeletingId = ref<number | null>(null);
const modelErrorMessage = ref("");
const mcpErrorMessage = ref("");

onMounted(async () => {
  await loadModels();
});

watch(activeTab, async (tab) => {
  if (tab === "mcp" && !mcpServers.value.length) {
    await loadMcpServers();
  }
});

async function loadModels() {
  modelErrorMessage.value = "";
  modelIsLoading.value = true;

  try {
    const response = await api.model.getModel();
    models.value = response.data || [];
  } catch (error) {
    modelErrorMessage.value = getErrorMessage(error, "Failed to load models.");
  } finally {
    modelIsLoading.value = false;
  }
}

async function loadMcpServers() {
  mcpErrorMessage.value = "";
  mcpIsLoading.value = true;

  try {
    const response = await api.mcpServer.getMcpServer();
    mcpServers.value = response.data || [];
  } catch (error) {
    mcpErrorMessage.value = getErrorMessage(
      error,
      "Failed to load MCP servers.",
    );
  } finally {
    mcpIsLoading.value = false;
  }
}

async function openCreateModel() {
  await dialogs.CreateOrEditModelDialog().finishPromise(async () => {
    await loadModels();
  });
}

async function openEditModel(id: number) {
  await dialogs.CreateOrEditModelDialog({ id }).finishPromise(async () => {
    await loadModels();
  });
}

async function deleteModel(id: number) {
  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete Model",
      content: "Are you sure you want to delete this model?",
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  modelDeletingId.value = id;
  modelErrorMessage.value = "";

  try {
    await api.model.deleteModelById(id);
    await loadModels();
  } catch (error) {
    modelErrorMessage.value = getErrorMessage(error, "Failed to delete model.");
  } finally {
    modelDeletingId.value = null;
  }
}

async function openCreateMcpServer() {
  await dialogs.CreateOrEditMcpServerDialog().finishPromise(async () => {
    await loadMcpServers();
  });
}

async function openEditMcpServer(id: number) {
  await dialogs.CreateOrEditMcpServerDialog({ id }).finishPromise(async () => {
    await loadMcpServers();
  });
}

async function deleteMcpServer(id: number) {
  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete MCP Server",
      content: "Are you sure you want to delete this MCP server?",
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  mcpDeletingId.value = id;
  mcpErrorMessage.value = "";

  try {
    await api.mcpServer.deleteMcpServerById(id);
    await loadMcpServers();
  } catch (error) {
    mcpErrorMessage.value = getErrorMessage(
      error,
      "Failed to delete MCP server.",
    );
  } finally {
    mcpDeletingId.value = null;
  }
}

function getModelMenus(model: AIModelResponse): Menu[] {
  return [
    {
      id: "edit",
      name: "Edit",
      click: () => {
        void openEditModel(model.id);
      },
    },
    {
      id: "delete",
      name: modelDeletingId.value === model.id ? "Deleting..." : "Delete",
      danger: true,
      click: () => {
        if (modelDeletingId.value === model.id) {
          return;
        }
        void deleteModel(model.id);
      },
    },
  ];
}

function getMcpServerMenus(mcpServer: MCPServerResponse): Menu[] {
  return [
    {
      id: "edit",
      name: "Edit",
      click: () => {
        void openEditMcpServer(mcpServer.id);
      },
    },
    {
      id: "delete",
      name: mcpDeletingId.value === mcpServer.id ? "Deleting..." : "Delete",
      danger: true,
      click: () => {
        if (mcpDeletingId.value === mcpServer.id) {
          return;
        }
        void deleteMcpServer(mcpServer.id);
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
