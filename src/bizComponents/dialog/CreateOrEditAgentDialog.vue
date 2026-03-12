<template>
  <Dialog :dialog :title="finalTitle" :width>
    <template #autoPadding>
      <DefaultTabs v-model="activeTab" :tabs="tabs" />

      <div v-if="activeTab === 'general'" class="v gap-3 pt-3">
        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Name <span class="text-danger">*</span>
          </div>
          <Input
            v-model="name"
            v-focus
            placeholder="Agent name"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Model Connector <span class="text-danger">*</span>
          </div>
          <Select v-model="modelConnectorId" :options="modelOptions" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Model</div>
          <Select v-model="model" :options="modelCatalogOptions" />
          <div v-if="modelCatalogIsLoading" class="text-light text-xs">
            Loading model dictionary...
          </div>
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Description</div>
          <Textarea v-model="description" class="bg-transparent" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Capacity</div>
          <Input
            v-model="capacity"
            placeholder="code,search,summarize"
            @enter="submit"
          />
        </div>

        <div
          v-if="errorMessage"
          class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
        >
          {{ errorMessage }}
        </div>
      </div>

      <div v-else-if="activeTab === 'mcp'" class="v gap-2 pt-3">
        <div v-if="!isEdit" class="text-light text-sm">
          Please save the agent first to configure MCP servers.
        </div>
        <template v-else>
          <div v-if="mcpIsLoading" class="text-light text-sm">Loading...</div>
          <div
            v-else-if="allMcpServers.length === 0"
            class="text-light text-sm"
          >
            No MCP servers available.
          </div>
          <div
            v-for="server in allMcpServers"
            v-else
            :key="server.id"
            class="h items-center justify-between gap-3 rounded border border-border px-3 py-2"
          >
            <div class="v gap-0.5 min-w-0">
              <div class="text-sm font-semibold">{{ server.name }}</div>
              <div
                v-if="server.description"
                class="text-light truncate text-xs"
              >
                {{ server.description }}
              </div>
              <div class="text-light text-xs">{{ server.type }}</div>
            </div>
            <Switch
              :model-value="isMcpEnabled(server.id)"
              @update:model-value="toggleMcp(server.id, $event ?? false)"
            />
          </div>
          <div
            v-if="mcpErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ mcpErrorMessage }}
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        v-if="activeTab === 'general'"
        type="primary"
        :is-loading="isSubmitting"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ isEdit ? "Save" : "Create" }}
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { api } from "@/api";
import type {
  AgentResponse,
  AgentMcpServerRelationResponse,
  AIModelConnectorResponse,
  MCPServerResponse,
} from "@/api";
import type { DialogType } from "@/components/dialog/dialog";

type FormResult = AgentResponse;

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, FormResult>;
    id?: number | null;
    title?: string | null;
    width?: string;
    userId?: number | null;
  }>(),
  {
    width: "460px",
    id: null,
    title: null,
    userId: null,
  },
);

const activeTab = ref("general");
const tabs = [
  { id: "general", title: "常规" },
  { id: "mcp", title: "MCP" },
];

const name = ref("");
const modelConnectorId = ref<number | undefined>(undefined);
const model = ref<string | undefined>(undefined);
const description = ref("");
const capacity = ref("");

const modelConnectors = ref<AIModelConnectorResponse[]>([]);
const modelCatalogOptions = ref<Array<{ id: string; name: string }>>([]);
const modelCatalogIsLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");

// MCP
const allMcpServers = ref<MCPServerResponse[]>([]);
const agentMcpAssignments = ref<AgentMcpServerRelationResponse[]>([]);
const mcpIsLoading = ref(false);
const mcpErrorMessage = ref("");

const mcpAssignmentMap = computed(() => {
  const map = new Map<number, AgentMcpServerRelationResponse>();
  agentMcpAssignments.value.forEach((a) => map.set(a.mcpServerId, a));
  return map;
});

function isMcpEnabled(mcpServerId: number) {
  const assignment = mcpAssignmentMap.value.get(mcpServerId);
  return assignment ? assignment.enabled : false;
}

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit Agent" : "Create Agent"),
);
const modelOptions = computed(() =>
  modelConnectors.value.map((modelConnector) => ({
    id: modelConnector.id,
    name: modelConnector.name,
  })),
);
const canSubmit = computed(
  () => !!name.value.trim() && typeof modelConnectorId.value === "number",
);

onMounted(async () => {
  await loadModelConnectors();
  await loadAllMcpServers();

  if (isEdit.value && props.id) {
    await loadAgent(props.id);
    await loadAgentMcpAssignments(props.id);
  }
});

watch(
  () => modelConnectorId.value,
  async (connectorId, previousConnectorId) => {
    if (typeof connectorId !== "number") {
      modelCatalogOptions.value = [];
      model.value = undefined;
      return;
    }

    if (
      typeof previousConnectorId === "number" &&
      previousConnectorId !== connectorId
    ) {
      model.value = undefined;
    }

    const connector = modelConnectors.value.find(
      (item) => item.id === connectorId,
    );
    const connectorType = connector?.type;

    if (!connectorType) {
      modelCatalogOptions.value = [];
      return;
    }

    await loadModelCatalogByType(connectorType);
  },
);

async function loadModelConnectors() {
  try {
    const response = await api.modelConnector.getModelConnector();
    modelConnectors.value = response.data || [];
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load model connector options.",
    );
  }
}

async function loadAllMcpServers() {
  try {
    const response = await api.mcpServer.getMcpServer();
    allMcpServers.value = response.data || [];
  } catch (error) {
    mcpErrorMessage.value = getErrorMessage(
      error,
      "Failed to load MCP servers.",
    );
  }
}

async function loadAgentMcpAssignments(agentId: number) {
  mcpIsLoading.value = true;
  try {
    const response =
      await api.agentMcpServer.getAgentMcpServerAgentByAgentId(agentId);
    agentMcpAssignments.value = response.data || [];
  } catch (error) {
    mcpErrorMessage.value = getErrorMessage(
      error,
      "Failed to load agent MCP assignments.",
    );
  } finally {
    mcpIsLoading.value = false;
  }
}

async function toggleMcp(mcpServerId: number, enabled: boolean) {
  mcpErrorMessage.value = "";
  const assignment = mcpAssignmentMap.value.get(mcpServerId);
  try {
    if (enabled) {
      if (!assignment) {
        const res = await api.agentMcpServer.postAgentMcpServer({
          agentId: props.id!,
          mcpServerId,
          enabled: true,
        });
        agentMcpAssignments.value.push(res.data);
      } else {
        const res = await api.agentMcpServer.putAgentMcpServerById(
          assignment.id,
          { enabled: true },
        );
        const idx = agentMcpAssignments.value.findIndex(
          (a) => a.id === assignment.id,
        );
        if (idx !== -1) agentMcpAssignments.value[idx] = res.data;
      }
    } else {
      if (assignment) {
        await api.agentMcpServer.deleteAgentMcpServerById(assignment.id);
        agentMcpAssignments.value = agentMcpAssignments.value.filter(
          (a) => a.id !== assignment.id,
        );
      }
    }
  } catch (error) {
    mcpErrorMessage.value = getErrorMessage(
      error,
      "Failed to update MCP assignment.",
    );
  }
}

async function loadAgent(id: number) {
  try {
    const response = await api.agent.getAgentById(id);
    const agent = response.data;
    name.value = agent.name || "";
    modelConnectorId.value = agent.modelConnectorId;
    model.value = agent.model || undefined;
    description.value = agent.description || "";
    capacity.value = agent.capacity || "";
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load agent details.",
    );
  }
}

async function loadModelCatalogByType(type: string) {
  modelCatalogIsLoading.value = true;

  try {
    const response =
      await api.modelConnector.getModelConnectorCatalogByType(type);
    const options = (response.data.models || []).map((item) => ({
      id: item,
      name: item,
    }));

    // Keep previously saved model visible when dictionary no longer contains it.
    if (model.value && !options.some((item) => item.id === model.value)) {
      options.unshift({
        id: model.value,
        name: `${model.value} (legacy)`,
      });
    }

    modelCatalogOptions.value = options;
  } catch (error) {
    modelCatalogOptions.value = [];
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load model dictionary.",
    );
  } finally {
    modelCatalogIsLoading.value = false;
  }
}

async function submit() {
  errorMessage.value = "";

  if (!canSubmit.value) {
    errorMessage.value = "Name and model connector are required.";
    return;
  }

  isSubmitting.value = true;

  try {
    const savedAgent = await props.dialog.process(async () => {
      if (isEdit.value && props.id) {
        const response = await api.agent.putAgentById(props.id, {
          name: name.value.trim(),
          model: toOptional(model.value || ""),
          description: toOptional(description.value),
          capacity: toOptional(capacity.value),
          modelConnectorId: modelConnectorId.value,
        });
        return response.data;
      }

      const response = await api.agent.postAgent({
        name: name.value.trim(),
        model: toOptional(model.value || ""),
        description: toOptional(description.value),
        capacity: toOptional(capacity.value),
        modelConnectorId: modelConnectorId.value!,
      });

      return response.data;
    });

    props.dialog.finish(savedAgent);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to save agent.");
  } finally {
    isSubmitting.value = false;
  }
}

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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
