<template>
  <Dialog :dialog :title="title ?? 'Settings'" :width>
    <template #autoPadding>
      <div class="v gap-3">
        <DefaultTabs v-model="activeTab" :tabs="tabs" />

        <div v-if="activeTab === 'modelConnector'" class="v gap-3">
          <div class="h items-center justify-between gap-2">
            <div class="text-sm font-semibold">Model Connector Management</div>
            <div class="h gap-2">
              <Button @click="loadModelConnectors">Refresh</Button>
              <Button type="primary" @click="openCreateModelConnector"
                >Create Model Connector</Button
              >
            </div>
          </div>

          <div
            v-if="modelConnectorErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ modelConnectorErrorMessage }}
          </div>

          <div v-if="modelConnectorIsLoading" class="text-light text-sm">
            Loading model connectors...
          </div>

          <div
            v-else-if="modelConnectors.length === 0"
            class="text-light text-sm"
          >
            No model connector found.
          </div>

          <div v-else class="v gap-2">
            <SelectableTag
              v-for="modelConnector in modelConnectors"
              :key="modelConnector.id"
              :selected="modelConnectorDeletingId === modelConnector.id"
              :title="modelConnector.name"
              :content="`Type: ${modelConnector.type}`"
              :menus="getModelConnectorMenus(modelConnector)"
            />
          </div>
        </div>

        <div v-else-if="activeTab === 'skill'" class="v gap-3">
          <div class="h items-center justify-between gap-2">
            <div class="text-sm font-semibold">Skill Management</div>
            <div class="h gap-2">
              <Button @click="loadSkills">Refresh</Button>
              <Button type="primary" @click="openCreateSkill"
                >Create Skill</Button
              >
            </div>
          </div>

          <div
            v-if="skillErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ skillErrorMessage }}
          </div>

          <div v-if="skillIsLoading" class="text-light text-sm">
            Loading skills...
          </div>

          <div v-else-if="skills.length === 0" class="text-light text-sm">
            No skill found.
          </div>

          <div v-else class="v gap-2">
            <SelectableTag
              v-for="skill in skills"
              :key="skill.id"
              :selected="skillDeletingId === skill.id"
              :title="skill.name"
              :content="skill.description || `Skill #${skill.id}`"
              :menus="getSkillMenus(skill)"
            >
              <template #dropdown-prefix>
                <Button
                  size="small"
                  @click.stop="openSkillTaskListManager(skill)"
                >
                  TaskList
                </Button>
              </template>
            </SelectableTag>
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
import type {
  AIModelConnectorResponse,
  MCPServerResponse,
  SkillResponse,
} from "@/api";
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";
import type { DialogType } from "@/components/dialog/dialog";

type TabId = "modelConnector" | "skill" | "mcp";

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
  { id: "modelConnector", title: "Model Connector" },
  { id: "skill", title: "Skill" },
  { id: "mcp", title: "MCP" },
];

const activeTab = ref<TabId>("modelConnector");
const modelConnectors = ref<AIModelConnectorResponse[]>([]);
const skills = ref<SkillResponse[]>([]);
const mcpServers = ref<MCPServerResponse[]>([]);
const modelConnectorIsLoading = ref(false);
const skillIsLoading = ref(false);
const mcpIsLoading = ref(false);
const modelConnectorDeletingId = ref<number | null>(null);
const skillDeletingId = ref<number | null>(null);
const mcpDeletingId = ref<number | null>(null);
const modelConnectorErrorMessage = ref("");
const skillErrorMessage = ref("");
const mcpErrorMessage = ref("");

onMounted(async () => {
  await loadModelConnectors();
});

watch(activeTab, async (tab) => {
  if (tab === "skill" && !skills.value.length) {
    await loadSkills();
  }

  if (tab === "mcp" && !mcpServers.value.length) {
    await loadMcpServers();
  }
});

async function loadModelConnectors() {
  modelConnectorErrorMessage.value = "";
  modelConnectorIsLoading.value = true;

  try {
    const response = await api.modelConnector.getModelConnector();
    modelConnectors.value = response.data || [];
  } catch (error) {
    modelConnectorErrorMessage.value = getErrorMessage(
      error,
      "Failed to load model connectors.",
    );
  } finally {
    modelConnectorIsLoading.value = false;
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

async function loadSkills() {
  skillErrorMessage.value = "";
  skillIsLoading.value = true;

  try {
    const response = await api.skill.getSkill();
    skills.value = response.data || [];
  } catch (error) {
    skillErrorMessage.value = getErrorMessage(error, "Failed to load skills.");
  } finally {
    skillIsLoading.value = false;
  }
}

async function openCreateModelConnector() {
  await dialogs.CreateOrEditModelConnectorDialog().finishPromise(async () => {
    await loadModelConnectors();
  });
}

async function openEditModelConnector(id: number) {
  await dialogs
    .CreateOrEditModelConnectorDialog({ id })
    .finishPromise(async () => {
      await loadModelConnectors();
    });
}

async function deleteModelConnector(id: number) {
  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete Model Connector",
      content: "Are you sure you want to delete this model connector?",
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  modelConnectorDeletingId.value = id;
  modelConnectorErrorMessage.value = "";

  try {
    await api.modelConnector.deleteModelConnectorById(id);
    await loadModelConnectors();
  } catch (error) {
    modelConnectorErrorMessage.value = getErrorMessage(
      error,
      "Failed to delete model connector.",
    );
  } finally {
    modelConnectorDeletingId.value = null;
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

async function openCreateSkill() {
  await dialogs.CreateOrEditSkillDialog().finishPromise(async () => {
    await loadSkills();
  });
}

async function openEditSkill(id: number) {
  await dialogs.CreateOrEditSkillDialog({ id }).finishPromise(async () => {
    await loadSkills();
  });
}

async function openSkillTaskListManager(skill: SkillResponse) {
  await dialogs.FileListManagerDialog({
    fileListId: skill.fileListId,
    baseOnPath: `/skills/${skill.id}`,
  });
}

async function deleteSkill(id: number) {
  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete Skill",
      content: "Are you sure you want to delete this skill?",
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  skillDeletingId.value = id;
  skillErrorMessage.value = "";

  try {
    await api.skill.deleteSkillById(id);
    await loadSkills();
  } catch (error) {
    skillErrorMessage.value = getErrorMessage(error, "Failed to delete skill.");
  } finally {
    skillDeletingId.value = null;
  }
}

function getModelConnectorMenus(
  modelConnector: AIModelConnectorResponse,
): Menu[] {
  return [
    {
      id: "edit",
      name: "Edit",
      click: () => {
        void openEditModelConnector(modelConnector.id);
      },
    },
    {
      id: "delete",
      name:
        modelConnectorDeletingId.value === modelConnector.id
          ? "Deleting..."
          : "Delete",
      danger: true,
      click: () => {
        if (modelConnectorDeletingId.value === modelConnector.id) {
          return;
        }
        void deleteModelConnector(modelConnector.id);
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

function getSkillMenus(skill: SkillResponse): Menu[] {
  return [
    {
      id: "edit",
      name: "Edit",
      click: () => {
        void openEditSkill(skill.id);
      },
    },
    {
      id: "delete",
      name: skillDeletingId.value === skill.id ? "Deleting..." : "Delete",
      danger: true,
      click: () => {
        if (skillDeletingId.value === skill.id) {
          return;
        }
        void deleteSkill(skill.id);
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
