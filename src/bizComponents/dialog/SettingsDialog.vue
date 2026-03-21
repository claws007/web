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

        <div v-else-if="activeTab === 'company'" class="v gap-3">
          <div class="h items-center justify-between gap-2">
            <div class="text-sm font-semibold">Company Management</div>
            <div class="h gap-2">
              <Button type="primary" @click="openCreateCompany"
                >Create Company</Button
              >
              <Button @click="loadCompanyContext">Refresh</Button>
              <Button
                type="primary"
                :disabled="!companyStore.canManageCompany || !activeCompany"
                @click="openEditCompany"
              >
                Edit Company
              </Button>
              <Button
                danger
                :disabled="!companyStore.canDeleteCompany || !activeCompany"
                @click="deleteCurrentCompany"
              >
                Delete Company
              </Button>
            </div>
          </div>

          <div
            v-if="companyErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ companyErrorMessage }}
          </div>

          <div v-if="companyIsLoading" class="text-light text-sm">
            Loading company details...
          </div>

          <div v-else-if="!activeCompany" class="text-light text-sm">
            No active company selected.
          </div>

          <div v-else class="v gap-3 rounded bg-light-2 px-4 py-4">
            <div class="v gap-1">
              <div class="text-light text-xs uppercase tracking-[0.18em]">
                Name
              </div>
              <div class="text-sm font-semibold">{{ activeCompany.name }}</div>
            </div>
            <div class="v gap-1">
              <div class="text-light text-xs uppercase tracking-[0.18em]">
                Description
              </div>
              <div class="text-sm whitespace-pre-wrap break-all">
                {{ activeCompany.description || "No description" }}
              </div>
            </div>
            <div class="v gap-1">
              <div class="text-light text-xs uppercase tracking-[0.18em]">
                My Role
              </div>
              <div class="text-sm">{{ activeRoleLabel }}</div>
            </div>
            <div class="v gap-1">
              <div class="text-light text-xs uppercase tracking-[0.18em]">
                Brand
              </div>
              <div class="text-sm text-light">
                Brand file support is pending because the generated OpenAPI
                schema does not expose the brand field yet.
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'members'" class="v gap-3">
          <div class="h items-center justify-between gap-2">
            <div class="text-sm font-semibold">Member Management</div>
            <div class="h gap-2">
              <Button @click="loadMembers">Refresh</Button>
              <Button
                type="primary"
                :disabled="!companyStore.canManageMembers || !activeCompanyId"
                @click="openCreateMember"
              >
                Add Member
              </Button>
            </div>
          </div>

          <div
            v-if="memberErrorMessage"
            class="rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
          >
            {{ memberErrorMessage }}
          </div>

          <div v-if="memberIsLoading" class="text-light text-sm">
            Loading members...
          </div>

          <div v-else-if="members.length === 0" class="text-light text-sm">
            No members found.
          </div>

          <div v-else class="v gap-2">
            <SelectableTag
              v-for="member in members"
              :key="member.id"
              :selected="memberMutatingId === member.id"
              :title="getMemberTitle(member)"
              :content="getMemberSubtitle(member)"
              :menus="getMemberMenus(member)"
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
import {
  createCompany,
  createCompanyMember,
  deleteCompany,
  deleteCompanyMember,
  updateCompany,
  updateCompanyMember,
  type UserCompanyRelationResponse,
} from "@/company/api";
import { dialogs } from "@/components/dialog";
import type {
  AIModelConnectorResponse,
  MCPServerResponse,
  SkillResponse,
} from "@/api";
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";
import type { DialogType } from "@/components/dialog/dialog";
import { useCompanyStore } from "@/store/company";

type TabId = "modelConnector" | "skill" | "mcp" | "company" | "members";

const companyStore = useCompanyStore();

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
  { id: "company", title: "Company" },
  { id: "members", title: "Members" },
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
const memberMutatingId = ref<number | null>(null);
const modelConnectorErrorMessage = ref("");
const skillErrorMessage = ref("");
const mcpErrorMessage = ref("");
const companyErrorMessage = ref("");
const memberErrorMessage = ref("");
const companyIsLoading = ref(false);
const memberIsLoading = ref(false);

const activeCompanyId = computed(() => companyStore.activeCompanyId);
const activeCompany = computed(() => companyStore.activeCompany);
const members = computed(() => companyStore.currentMembers);
const activeRoleLabel = computed(() => {
  const role = companyStore.activeRole;
  return role ? role.toLowerCase() : "unknown";
});

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

  if (tab === "company") {
    await loadCompanyContext();
  }

  if (tab === "members") {
    await loadMembers();
  }
});

async function loadCompanyContext() {
  companyErrorMessage.value = "";
  companyIsLoading.value = true;

  try {
    await companyStore.initCompanyContext(true);
  } catch (error) {
    companyErrorMessage.value = getErrorMessage(
      error,
      "Failed to load company details.",
    );
  } finally {
    companyIsLoading.value = false;
  }
}

async function loadMembers() {
  memberErrorMessage.value = "";

  if (!activeCompanyId.value) {
    return;
  }

  memberIsLoading.value = true;

  try {
    await companyStore.loadMembers(activeCompanyId.value);
  } catch (error) {
    memberErrorMessage.value = getErrorMessage(
      error,
      "Failed to load company members.",
    );
  } finally {
    memberIsLoading.value = false;
  }
}

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

async function openCreateCompany() {
  const nameResult = await dialogs.InputDialog({
    title: "Create Company",
    placeholder: "Company name",
  });

  if (nameResult.result !== "finish") {
    return;
  }

  const name = nameResult.data.trim();
  if (!name) {
    companyErrorMessage.value = "Company name is required.";
    return;
  }

  const descriptionResult = await dialogs.TextareaDialog({
    title: "Company Description",
    value: "",
    placeholder: "Optional description",
  });

  if (descriptionResult.result !== "finish") {
    return;
  }

  companyErrorMessage.value = "";
  companyIsLoading.value = true;

  try {
    const company = await createCompany({
      name,
      description: toOptional(descriptionResult.data),
    });

    await companyStore.initCompanyContext(true);

    if (company?.id) {
      companyStore.selectCompany(company.id);
    }
  } catch (error) {
    companyErrorMessage.value = getErrorMessage(
      error,
      "Failed to create company.",
    );
  } finally {
    companyIsLoading.value = false;
  }
}

async function openEditCompany() {
  if (!activeCompany.value || !companyStore.canManageCompany) {
    return;
  }

  const nameResult = await dialogs.InputDialog({
    title: "Company Name",
    value: activeCompany.value.name,
    placeholder: "Enter company name",
  });

  if (nameResult.result !== "finish") {
    return;
  }

  const nextName = nameResult.data.trim();
  if (!nextName) {
    companyErrorMessage.value = "Company name is required.";
    return;
  }

  const descriptionResult = await dialogs.TextareaDialog({
    title: "Company Description",
    value: activeCompany.value.description || "",
    placeholder: "Optional description",
  });

  if (descriptionResult.result !== "finish") {
    return;
  }

  companyErrorMessage.value = "";
  companyIsLoading.value = true;

  try {
    await updateCompany(activeCompany.value.id, {
      name: nextName,
      description: toOptional(descriptionResult.data),
    });
    await companyStore.initCompanyContext(true);
  } catch (error) {
    companyErrorMessage.value = getErrorMessage(
      error,
      "Failed to update company.",
    );
  } finally {
    companyIsLoading.value = false;
  }
}

async function deleteCurrentCompany() {
  if (!activeCompany.value || !companyStore.canDeleteCompany) {
    return;
  }

  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Delete Company",
      content: `Are you sure you want to delete ${activeCompany.value.name}?`,
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  companyErrorMessage.value = "";
  companyIsLoading.value = true;

  try {
    await deleteCompany(activeCompany.value.id);
    await companyStore.initCompanyContext(true);
    activeTab.value = "company";
  } catch (error) {
    companyErrorMessage.value = getErrorMessage(
      error,
      "Failed to delete company.",
    );
  } finally {
    companyIsLoading.value = false;
  }
}

async function openCreateMember() {
  if (!activeCompanyId.value || !companyStore.canManageMembers) {
    return;
  }

  const userIdResult = await dialogs.InputDialog({
    title: "User ID",
    content: "Enter the user ID to add into this company.",
    placeholder: "User ID",
    type: "number",
  });

  if (userIdResult.result !== "finish") {
    return;
  }

  const userId = Number(userIdResult.data);
  if (!Number.isInteger(userId) || userId <= 0) {
    memberErrorMessage.value = "A valid user ID is required.";
    return;
  }

  const roleResult = await dialogs.SelectDialog({
    title: "Member Role",
    options: memberRoleOptions,
  });

  if (
    roleResult.result !== "finish" ||
    typeof roleResult.data?.id !== "string"
  ) {
    return;
  }

  memberErrorMessage.value = "";

  try {
    await createCompanyMember(activeCompanyId.value, {
      userId,
      role: roleResult.data.id,
    });
    await loadMembers();
  } catch (error) {
    memberErrorMessage.value = getErrorMessage(error, "Failed to add member.");
  }
}

async function openEditMemberRole(member: UserCompanyRelationResponse) {
  if (!activeCompanyId.value || !canEditMemberRole(member)) {
    return;
  }

  const roleResult = await dialogs.SelectDialog({
    title: "Update Member Role",
    options: memberRoleOptions,
  });

  if (
    roleResult.result !== "finish" ||
    typeof roleResult.data?.id !== "string"
  ) {
    return;
  }

  memberMutatingId.value = member.id;
  memberErrorMessage.value = "";

  try {
    await updateCompanyMember(activeCompanyId.value, member.id, {
      role: roleResult.data.id,
    });
    await loadMembers();
  } catch (error) {
    memberErrorMessage.value = getErrorMessage(
      error,
      "Failed to update member role.",
    );
  } finally {
    memberMutatingId.value = null;
  }
}

async function removeMember(member: UserCompanyRelationResponse) {
  if (!activeCompanyId.value || !canDeleteMember(member)) {
    return;
  }

  const shouldDelete = await dialogs
    .ConfirmDialog({
      title: "Remove Member",
      content: `Remove ${getMemberTitle(member)} from this company?`,
    })
    .finallyPromise((isFinished) => isFinished);

  if (!shouldDelete) {
    return;
  }

  memberMutatingId.value = member.id;
  memberErrorMessage.value = "";

  try {
    await deleteCompanyMember(activeCompanyId.value, member.id);
    await loadMembers();
  } catch (error) {
    memberErrorMessage.value = getErrorMessage(
      error,
      "Failed to remove member.",
    );
  } finally {
    memberMutatingId.value = null;
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

function getMemberTitle(member: UserCompanyRelationResponse) {
  return member.user?.name || member.user?.email || `User #${member.userId}`;
}

function getMemberSubtitle(member: UserCompanyRelationResponse) {
  const detailParts = [
    `Role: ${member.role.toLowerCase()}`,
    member.user?.email,
  ].filter((item): item is string => !!item);

  return detailParts.join(" | ");
}

function getMemberMenus(member: UserCompanyRelationResponse): Menu[] {
  return [
    {
      id: "edit-role",
      name: "Change Role",
      show: canEditMemberRole(member),
      click: () => {
        void openEditMemberRole(member);
      },
    },
    {
      id: "delete",
      name: memberMutatingId.value === member.id ? "Removing..." : "Remove",
      show: canDeleteMember(member),
      danger: true,
      click: () => {
        if (memberMutatingId.value === member.id) {
          return;
        }
        void removeMember(member);
      },
    },
  ];
}

function canEditMemberRole(member: UserCompanyRelationResponse) {
  if (!companyStore.canEditMemberRoles) {
    return false;
  }

  return companyStore.currentUserRelation?.id !== member.id;
}

function canDeleteMember(member: UserCompanyRelationResponse) {
  const activeRole = companyStore.activeRole;
  const currentRelationId = companyStore.currentUserRelation?.id;

  if (!activeRole) {
    return false;
  }

  if (activeRole === "OWNER") {
    return currentRelationId !== member.id;
  }

  if (activeRole === "MANAGER") {
    return member.role === "STAFF";
  }

  return false;
}

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

const memberRoleOptions = [
  { id: "manager", name: "Manager" },
  { id: "staff", name: "Staff" },
];

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
