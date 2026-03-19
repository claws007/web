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
          <div class="text-sm font-semibold">Capacity</div>
          <Input
            v-model="capacity"
            placeholder="code,search,summarize"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Sandbox Type <span class="text-danger">*</span>
          </div>
          <Select v-model="sandboxType" :options="sandboxTypeOptions" />
        </div>

        <div v-if="sandboxType === 'DOCKER'" class="v gap-1">
          <div class="text-sm font-semibold">Container Image</div>
          <Input
            v-model="containerImage"
            placeholder="docker.io/library/ubuntu:latest"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Description</div>
          <Textarea v-model="description" class="bg-transparent" />
        </div>

        <div
          v-if="errorMessage"
          class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
        >
          {{ errorMessage }}
        </div>
      </div>

      <div v-else-if="activeTab === 'mcp'" class="v gap-2 pt-3">
        <div v-if="mcpIsLoading" class="text-light text-sm">Loading...</div>
        <div v-else-if="allMcpServers.length === 0" class="text-light text-sm">
          No MCP servers available.
        </div>
        <div
          v-for="server in allMcpServers"
          v-else
          :key="server.id"
          class="h items-center justify-between gap-3 rounded border border-border px-3 py-2"
        >
          <div class="v min-w-0 gap-0.5">
            <div class="text-sm font-semibold">{{ server.name }}</div>
            <div v-if="server.description" class="text-light truncate text-xs">
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
      </div>

      <div v-else-if="activeTab === 'skill'" class="v gap-2 pt-3">
        <div v-if="skillIsLoading" class="text-light text-sm">Loading...</div>
        <div v-else-if="allSkills.length === 0" class="text-light text-sm">
          No skills available.
        </div>
        <div
          v-for="skill in allSkills"
          v-else
          :key="skill.id"
          class="h items-center justify-between gap-3 rounded border border-border px-3 py-2"
        >
          <div class="v min-w-0 gap-0.5">
            <div class="text-sm font-semibold">{{ skill.name }}</div>
            <div v-if="skill.description" class="text-light truncate text-xs">
              {{ skill.description }}
            </div>
          </div>
          <Switch
            :model-value="isSkillEnabled(skill.id)"
            @update:model-value="toggleSkill(skill.id, $event ?? false)"
          />
        </div>
        <div
          v-if="skillErrorMessage"
          class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
        >
          {{ skillErrorMessage }}
        </div>
      </div>

      <div v-else-if="activeTab === 'filePermission'" class="v gap-3 pt-3">
        <div class="h items-center justify-between gap-2">
          <div class="text-sm font-semibold">File Permissions</div>
          <Button type="primary" @click="addFilePermission">
            <PlusOutlined /> Add Permission
          </Button>
        </div>

        <div v-if="filePermissionIsLoading" class="text-light text-sm">
          Loading file permissions...
        </div>

        <div
          v-else-if="filePermissionDrafts.length === 0"
          class="rounded border border-dashed border-light-4 bg-light-2 px-3 py-4 text-light text-sm"
        >
          No file permissions configured.
        </div>

        <div v-else class="v gap-3">
          <div
            v-for="(permission, index) in filePermissionDrafts"
            :key="permission.localId"
            class="v gap-3 rounded border border-border px-3 py-3"
          >
            <div class="h items-center justify-between gap-2">
              <div class="text-sm font-semibold">
                Permission {{ index + 1 }}
              </div>
              <Button
                type="text"
                danger
                @click="removeFilePermission(permission.localId)"
              >
                Delete
              </Button>
            </div>

            <div class="v gap-1">
              <div class="text-sm font-semibold">
                Path <span class="text-danger">*</span>
              </div>
              <Input
                v-model="permission.path"
                placeholder="C:/workspace/project or ./relative/path"
              />
            </div>

            <div class="v gap-1">
              <div class="text-sm font-semibold">
                Mount Path <span class="text-danger">*</span>
              </div>
              <Input
                v-model="permission.mountPath"
                placeholder="Mount path exposed to the agent"
              />
            </div>

            <div class="h flex-wrap items-center gap-6">
              <div class="h items-center gap-2">
                <div class="text-sm font-semibold">Enabled</div>
                <Switch v-model="permission.enabled" />
              </div>
              <div class="h items-center gap-2">
                <div class="text-sm font-semibold">Writable</div>
                <Switch v-model="permission.writable" />
              </div>
            </div>

            <div class="text-light text-xs">
              {{
                permission.writable
                  ? "Access: Read + Write"
                  : "Access: Read Only"
              }}
            </div>

            <div
              v-if="permission.normalizedPath"
              class="text-light break-all text-xs"
            >
              Normalized: {{ permission.normalizedPath }}
            </div>
          </div>
        </div>

        <div
          v-if="filePermissionErrorMessage"
          class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
        >
          {{ filePermissionErrorMessage }}
        </div>
      </div>
    </template>

    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
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
  AgentFilePermissionResponse,
  AgentSkillRelationResponse,
  AgentResponse,
  AgentMcpServerRelationResponse,
  AIModelConnectorResponse,
  MCPServerResponse,
  SkillResponse,
} from "@/api";
import type { DialogType } from "@/components/dialog/dialog";
import { PlusOutlined } from "@ant-design/icons-vue";

type FormResult = AgentResponse;
type TabId = "general" | "mcp" | "skill" | "filePermission";
type FilePermissionDraft = {
  localId: string;
  id?: number;
  path: string;
  normalizedPath?: string;
  mountPath: string;
  enabled: boolean;
  writable: boolean;
};

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, FormResult>;
    id?: number | null;
    title?: string | null;
    width?: string;
    userId?: number | null;
  }>(),
  {
    width: "640px",
    id: null,
    title: null,
    userId: null,
  },
);

const activeTab = ref<TabId>("general");
const tabs: Array<{ id: TabId; title: string }> = [
  { id: "general", title: "常规" },
  { id: "mcp", title: "MCP" },
  { id: "skill", title: "Skill" },
  { id: "filePermission", title: "File Permission" },
];

const name = ref("");
const modelConnectorId = ref<number | undefined>(undefined);
const model = ref<string | undefined>(undefined);
const description = ref("");
const capacity = ref("");
const sandboxType = ref<"NONE" | "DOCKER" | undefined>(undefined);
const containerImage = ref("");

const modelConnectors = ref<AIModelConnectorResponse[]>([]);
const modelCatalogOptions = ref<Array<{ id: string; name: string }>>([]);
const modelCatalogIsLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");

// MCP
const allMcpServers = ref<MCPServerResponse[]>([]);
const agentMcpAssignments = ref<AgentMcpServerRelationResponse[]>([]);
const draftMcpServerIds = ref<number[]>([]);
const mcpIsLoading = ref(false);
const mcpErrorMessage = ref("");

// Skills
const allSkills = ref<SkillResponse[]>([]);
const agentSkillAssignments = ref<AgentSkillRelationResponse[]>([]);
const draftSkillIds = ref<number[]>([]);
const skillIsLoading = ref(false);
const skillErrorMessage = ref("");

// File permissions
const agentFilePermissions = ref<AgentFilePermissionResponse[]>([]);
const filePermissionDrafts = ref<FilePermissionDraft[]>([]);
const filePermissionIsLoading = ref(false);
const filePermissionErrorMessage = ref("");
let nextFilePermissionDraftId = 0;

function isMcpEnabled(mcpServerId: number) {
  return draftMcpServerIds.value.includes(mcpServerId);
}

function isSkillEnabled(skillId: number) {
  return draftSkillIds.value.includes(skillId);
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
const sandboxTypeOptions = computed(() => [
  { id: "NONE", name: "None" },
  { id: "DOCKER", name: "Docker" },
]);
const canSubmit = computed(
  () =>
    !!name.value.trim() &&
    typeof modelConnectorId.value === "number" &&
    typeof sandboxType.value === "string",
);

onMounted(async () => {
  await loadModelConnectors();
  await loadAllMcpServers();
  await loadAllSkills();

  if (isEdit.value && props.id) {
    await loadAgent(props.id);
    await Promise.all([
      loadAgentMcpAssignments(props.id),
      loadAgentSkillAssignments(props.id),
      loadAgentFilePermissions(props.id),
    ]);
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

async function loadAllSkills() {
  try {
    const response = await api.skill.getSkill();
    allSkills.value = response.data || [];
  } catch (error) {
    skillErrorMessage.value = getErrorMessage(error, "Failed to load skills.");
  }
}

async function loadAgentMcpAssignments(agentId: number) {
  mcpErrorMessage.value = "";
  mcpIsLoading.value = true;
  try {
    const response =
      await api.agentMcpServer.getAgentMcpServerAgentByAgentId(agentId);
    agentMcpAssignments.value = response.data || [];
    draftMcpServerIds.value = agentMcpAssignments.value
      .filter((assignment) => assignment.enabled)
      .map((assignment) => assignment.mcpServerId);
  } catch (error) {
    mcpErrorMessage.value = getErrorMessage(
      error,
      "Failed to load agent MCP assignments.",
    );
  } finally {
    mcpIsLoading.value = false;
  }
}

async function loadAgentSkillAssignments(agentId: number) {
  skillErrorMessage.value = "";
  skillIsLoading.value = true;
  try {
    const response =
      await api.agentSkillRelation.getAgentSkillRelationAgentByAgentId(agentId);
    agentSkillAssignments.value = response.data || [];
    draftSkillIds.value = agentSkillAssignments.value
      .filter((assignment) => assignment.enabled)
      .map((assignment) => assignment.skillId);
  } catch (error) {
    skillErrorMessage.value = getErrorMessage(
      error,
      "Failed to load agent skill assignments.",
    );
  } finally {
    skillIsLoading.value = false;
  }
}

function toggleMcp(mcpServerId: number, enabled: boolean) {
  mcpErrorMessage.value = "";

  if (enabled) {
    if (!draftMcpServerIds.value.includes(mcpServerId)) {
      draftMcpServerIds.value = [...draftMcpServerIds.value, mcpServerId];
    }
    return;
  }

  draftMcpServerIds.value = draftMcpServerIds.value.filter(
    (id) => id !== mcpServerId,
  );
}

function toggleSkill(skillId: number, enabled: boolean) {
  skillErrorMessage.value = "";

  if (enabled) {
    if (!draftSkillIds.value.includes(skillId)) {
      draftSkillIds.value = [...draftSkillIds.value, skillId];
    }
    return;
  }

  draftSkillIds.value = draftSkillIds.value.filter((id) => id !== skillId);
}

async function loadAgentFilePermissions(agentId: number) {
  filePermissionErrorMessage.value = "";
  filePermissionIsLoading.value = true;
  try {
    const response =
      await api.agentFilePermission.getAgentFilePermissionAgentByAgentId(
        agentId,
      );
    agentFilePermissions.value = response.data || [];
    filePermissionDrafts.value = agentFilePermissions.value.map(
      createFilePermissionDraft,
    );
  } catch (error) {
    filePermissionErrorMessage.value = getErrorMessage(
      error,
      "Failed to load file permissions.",
    );
  } finally {
    filePermissionIsLoading.value = false;
  }
}

function createFilePermissionDraft(
  permission?: Partial<AgentFilePermissionResponse>,
): FilePermissionDraft {
  nextFilePermissionDraftId += 1;
  return {
    localId: `file-permission-${nextFilePermissionDraftId}`,
    id: permission?.id,
    path: permission?.path || "",
    normalizedPath: permission?.normalizedPath,
    mountPath: permission?.mountPath || "",
    enabled: permission?.enabled ?? true,
    writable: permission?.writable ?? false,
  };
}

function addFilePermission() {
  filePermissionErrorMessage.value = "";
  filePermissionDrafts.value = [
    ...filePermissionDrafts.value,
    createFilePermissionDraft(),
  ];
}

function removeFilePermission(localId: string) {
  filePermissionErrorMessage.value = "";
  filePermissionDrafts.value = filePermissionDrafts.value.filter(
    (permission) => permission.localId !== localId,
  );
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
    sandboxType.value = (agent as any).sandboxType || undefined;
    containerImage.value = agent.containerImage || "";
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
  mcpErrorMessage.value = "";
  skillErrorMessage.value = "";
  filePermissionErrorMessage.value = "";

  if (!canSubmit.value) {
    errorMessage.value =
      "Name, model connector, and sandbox type are required.";
    activeTab.value = "general";
    return;
  }

  const invalidFilePermission = filePermissionDrafts.value.find(
    (permission) => !permission.path.trim() || !permission.mountPath.trim(),
  );
  if (invalidFilePermission) {
    filePermissionErrorMessage.value =
      "File permission path and mount path are required.";
    activeTab.value = "filePermission";
    return;
  }

  isSubmitting.value = true;

  try {
    const savedAgent = await props.dialog.process(async () => {
      let saved: AgentResponse;

      if (isEdit.value && props.id) {
        const response = await api.agent.putAgentById(props.id, {
          name: name.value.trim(),
          model: toOptional(model.value || ""),
          description: toOptional(description.value),
          capacity: toOptional(capacity.value),
          sandboxType: sandboxType.value || undefined,
          containerImage: toOptional(containerImage.value),
          modelConnectorId: modelConnectorId.value,
        });
        saved = response.data;
      } else {
        const response = await api.agent.postAgent({
          name: name.value.trim(),
          model: toOptional(model.value || ""),
          description: toOptional(description.value),
          capacity: toOptional(capacity.value),
          sandboxType: sandboxType.value || undefined,
          containerImage: toOptional(containerImage.value),
          modelConnectorId: modelConnectorId.value!,
        });

        saved = response.data;
      }

      try {
        await syncAgentMcpAssignments(saved.id);
      } catch (error) {
        activeTab.value = "mcp";
        mcpErrorMessage.value = getErrorMessage(
          error,
          "Failed to save MCP assignments.",
        );
        throw new Error(
          getErrorMessage(error, "Failed to save MCP assignments."),
        );
      }

      try {
        await syncAgentSkillAssignments(saved.id);
      } catch (error) {
        activeTab.value = "skill";
        skillErrorMessage.value = getErrorMessage(
          error,
          "Failed to save skill assignments.",
        );
        throw new Error(
          getErrorMessage(error, "Failed to save skill assignments."),
        );
      }

      try {
        await syncAgentFilePermissions(saved.id);
      } catch (error) {
        activeTab.value = "filePermission";
        filePermissionErrorMessage.value = getErrorMessage(
          error,
          "Failed to save file permissions.",
        );
        throw new Error(
          getErrorMessage(error, "Failed to save file permissions."),
        );
      }

      return saved;
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

async function syncAgentMcpAssignments(agentId: number) {
  const originalAssignments = new Map(
    agentMcpAssignments.value.map((assignment) => [
      assignment.mcpServerId,
      assignment,
    ]),
  );
  const nextEnabledServerIds = new Set(draftMcpServerIds.value);
  const targetServerIds = new Set<number>([
    ...originalAssignments.keys(),
    ...nextEnabledServerIds,
  ]);

  for (const mcpServerId of targetServerIds) {
    const assignment = originalAssignments.get(mcpServerId);
    const enabled = nextEnabledServerIds.has(mcpServerId);

    if (enabled) {
      if (!assignment) {
        await api.agentMcpServer.postAgentMcpServer({
          agentId,
          mcpServerId,
          enabled: true,
        });
      } else if (!assignment.enabled) {
        await api.agentMcpServer.putAgentMcpServerById(assignment.id, {
          enabled: true,
        });
      }
      continue;
    }

    if (assignment) {
      await api.agentMcpServer.deleteAgentMcpServerById(assignment.id);
    }
  }

  if (!isEdit.value && !targetServerIds.size) {
    agentMcpAssignments.value = [];
    return;
  }

  const response =
    await api.agentMcpServer.getAgentMcpServerAgentByAgentId(agentId);
  agentMcpAssignments.value = response.data || [];
  draftMcpServerIds.value = agentMcpAssignments.value
    .filter((assignment) => assignment.enabled)
    .map((assignment) => assignment.mcpServerId);
}

async function syncAgentSkillAssignments(agentId: number) {
  const originalAssignments = new Map(
    agentSkillAssignments.value.map((assignment) => [
      assignment.skillId,
      assignment,
    ]),
  );
  const nextEnabledSkillIds = new Set(draftSkillIds.value);
  const targetSkillIds = new Set<number>([
    ...originalAssignments.keys(),
    ...nextEnabledSkillIds,
  ]);

  for (const skillId of targetSkillIds) {
    const assignment = originalAssignments.get(skillId);
    const enabled = nextEnabledSkillIds.has(skillId);

    if (enabled) {
      if (!assignment) {
        await api.agentSkillRelation.postAgentSkillRelation({
          agentId,
          skillId,
          enabled: true,
        });
      } else if (!assignment.enabled) {
        await api.agentSkillRelation.putAgentSkillRelationById(assignment.id, {
          enabled: true,
        });
      }
      continue;
    }

    if (assignment) {
      await api.agentSkillRelation.deleteAgentSkillRelationById(assignment.id);
    }
  }

  if (!isEdit.value && !targetSkillIds.size) {
    agentSkillAssignments.value = [];
    return;
  }

  const response =
    await api.agentSkillRelation.getAgentSkillRelationAgentByAgentId(agentId);
  agentSkillAssignments.value = response.data || [];
  draftSkillIds.value = agentSkillAssignments.value
    .filter((assignment) => assignment.enabled)
    .map((assignment) => assignment.skillId);
}

function normalizeFilePermissionDraft(permission: FilePermissionDraft) {
  return {
    id: permission.id,
    path: permission.path.trim(),
    mountPath: permission.mountPath.trim(),
    enabled: permission.enabled,
    writable: permission.writable,
  };
}

function isSameFilePermission(
  current: AgentFilePermissionResponse,
  draft: ReturnType<typeof normalizeFilePermissionDraft>,
) {
  return (
    current.path === draft.path &&
    (current.mountPath || undefined) === draft.mountPath &&
    current.enabled === draft.enabled &&
    current.writable === draft.writable
  );
}

async function syncAgentFilePermissions(agentId: number) {
  const normalizedDrafts = filePermissionDrafts.value.map(
    normalizeFilePermissionDraft,
  );
  const originalPermissions = new Map(
    agentFilePermissions.value.map((permission) => [permission.id, permission]),
  );
  const retainedIds = new Set(
    normalizedDrafts
      .map((permission) => permission.id)
      .filter((id): id is number => typeof id === "number"),
  );

  for (const permission of agentFilePermissions.value) {
    if (!retainedIds.has(permission.id)) {
      await api.agentFilePermission.deleteAgentFilePermissionById(
        permission.id,
      );
    }
  }

  for (const permission of normalizedDrafts) {
    if (typeof permission.id === "number") {
      const current = originalPermissions.get(permission.id);
      if (current && !isSameFilePermission(current, permission)) {
        await api.agentFilePermission.putAgentFilePermissionById(
          permission.id,
          {
            path: permission.path,
            mountPath: permission.mountPath,
            enabled: permission.enabled,
            writable: permission.writable,
          },
        );
      }
      continue;
    }

    await api.agentFilePermission.postAgentFilePermission({
      agentId,
      path: permission.path,
      mountPath: permission.mountPath,
      enabled: permission.enabled,
      writable: permission.writable,
    });
  }

  const response =
    await api.agentFilePermission.getAgentFilePermissionAgentByAgentId(agentId);
  agentFilePermissions.value = response.data || [];
  filePermissionDrafts.value = agentFilePermissions.value.map(
    createFilePermissionDraft,
  );
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
