<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  api,
  getImageUrlByFileId,
  type AgentFilePermissionResponse,
  type AgentMcpServerRelationResponse,
  type AgentResponse,
  type AIModelConnectorResponse,
  type MCPServerResponse,
} from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import Checkbox from "@/components/Checkbox.vue";
import Selector, { type SelectorItem } from "@/components/Selector.vue";
import Tabs from "@/components/Tabs.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { dialogs } from "virtual:dialogs";
import { msg } from "@/utils/message";
import { minLength, required, type Validator } from "@/utils/validators";

const props = defineProps<{
  id?: number;
}>();

const visible = ref(true);
const closing = ref(false);
const bootLoading = ref(false);
const saving = ref(false);
const submitButtonRef = ref<HTMLButtonElement | null>(null);
const { resolve, reject } = useDialogContext<AgentResponse>();

const name = ref("");
const description = ref("");
const capacity = ref("");
const model = ref("");
const modelConnectorId = ref("");
const useDockerSandbox = ref(false);
const containerImage = ref("");
const modelConnectors = ref<AIModelConnectorResponse[]>([]);
const modelConnectorOptions = ref<SelectorItem[]>([]);
const modelOptions = ref<SelectorItem[]>([]);
const connectorLoading = ref(false);
const modelCatalogLoading = ref(false);

const avatarInputRef = ref<HTMLInputElement | null>(null);
const avatarFile = ref<File | null>(null);
const avatarPreviewUrl = ref("");

function openAvatarPicker() {
  avatarInputRef.value?.click();
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (avatarPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
  }

  avatarFile.value = file;
  avatarPreviewUrl.value = URL.createObjectURL(file);
}

onBeforeUnmount(() => {
  if (avatarPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
  }
});

const isEditMode = computed(() => typeof props.id === "number");

const computedTitle = computed(() => {
  return isEditMode.value ? "编辑 Agent" : "创建 Agent";
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref("basic");

const tabItems = computed(() => [
  { id: "basic", label: "基础信息" },
  { id: "mcp", label: "MCP Server", disabled: !isEditMode.value },
  { id: "permissions", label: "文件权限", disabled: !isEditMode.value },
]);

// ── MCP Server tab ────────────────────────────────────────────────────────────
const mcpRelations = ref<AgentMcpServerRelationResponse[]>([]);
const mcpLoading = ref(false);
const mcpRefreshing = ref(false);
const mcpDeletingId = ref<number | null>(null);
const mcpError = ref<string | null>(null);

async function loadMcpRelations(soft = false) {
  if (typeof props.id !== "number") return;
  if (soft) mcpRefreshing.value = true;
  else mcpLoading.value = true;
  mcpError.value = null;
  try {
    const res = await api.agentMcpServer.getAgentMcpServerAgentByAgentId(
      props.id,
    );
    mcpRelations.value = (res.data.items ?? []).sort((a, b) => a.id - b.id);
  } catch (err) {
    mcpError.value =
      err instanceof Error ? err.message : "加载 MCP Server 列表失败";
  } finally {
    mcpLoading.value = false;
    mcpRefreshing.value = false;
  }
}

async function handleAddMcpServer() {
  let allServers: MCPServerResponse[] = [];
  try {
    const res = await api.mcpServer.getMcpServer();
    allServers = res.data.items ?? [];
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "获取 MCP Server 列表失败";
    await msg.error(message);
    return;
  }

  const assignedIds = new Set(mcpRelations.value.map((r) => r.mcpServerId));
  const available = allServers.filter((s) => !assignedIds.has(s.id));

  if (!available.length) {
    await msg.info("所有 MCP Server 均已分配给该 Agent");
    return;
  }

  const result = await dialogs.SelectOptionDialog({
    title: "添加 MCP Server",
    description: "选择要分配给该 Agent 的 MCP Server",
    modelValue: null,
    pageSize: 10,
    searchPlaceholder: "按名称或类型搜索",
    emptyText: "暂无可用 MCP Server",
    loadingText: "正在加载...",
    fetchOptions: async ({ keyword, page, pageSize }) => {
      const kw = keyword?.toLowerCase() ?? "";
      const filtered = kw
        ? available.filter(
            (s) =>
              (s.name?.toLowerCase() ?? "").includes(kw) ||
              s.type.toLowerCase().includes(kw),
          )
        : available;
      const start = (page - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);
      return {
        items: pageItems.map((s) => ({
          id: s.id,
          label: s.name || `MCP #${s.id}`,
          description: s.description ? `${s.type} · ${s.description}` : s.type,
          keywords: [s.name ?? "", s.type],
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

  if (result.type !== "resolve" || !result.value) return;

  const mcpServerId = Number(result.value.id);
  if (!mcpServerId) return;

  try {
    await api.agentMcpServer.postAgentMcpServer({
      agentId: props.id as number,
      mcpServerId,
    });
    await loadMcpRelations(true);
    await msg.success("MCP Server 已添加");
  } catch (err) {
    const message = err instanceof Error ? err.message : "添加失败，请稍后重试";
    await msg.error(message);
  }
}

async function handleRemoveMcpRelation(
  relation: AgentMcpServerRelationResponse,
) {
  const serverName = relation.mcpServer?.name || `MCP #${relation.mcpServerId}`;
  const confirmed = await msg.confirm(
    `确认移除「${serverName}」吗？移除后该 Agent 将无法调用此 MCP Server。`,
    { title: "移除 MCP Server", confirmText: "移 除", confirmType: "danger" },
  );
  if (confirmed.type !== "resolve") return;

  mcpDeletingId.value = relation.id;
  try {
    await api.agentMcpServer.deleteAgentMcpServerById(relation.id);
    await loadMcpRelations(true);
    await msg.success("MCP Server 已移除");
  } catch (err) {
    const message = err instanceof Error ? err.message : "移除失败，请稍后重试";
    await msg.error(message);
  } finally {
    mcpDeletingId.value = null;
  }
}

// ── File Permissions tab ──────────────────────────────────────────────────────
const filePermissions = ref<AgentFilePermissionResponse[]>([]);
const permLoading = ref(false);
const permRefreshing = ref(false);
const permDeletingId = ref<number | null>(null);
const permError = ref<string | null>(null);
const showPermForm = ref(false);
const editingPermId = ref<number | null>(null);
const permPath = ref("");
const permMountPath = ref("");
const permEnabled = ref(true);
const permWritable = ref(false);
const permSaving = ref(false);

async function loadFilePermissions(soft = false) {
  if (typeof props.id !== "number") return;
  if (soft) permRefreshing.value = true;
  else permLoading.value = true;
  permError.value = null;
  try {
    const res =
      await api.agentFilePermission.getAgentFilePermissionAgentByAgentId(
        props.id,
      );
    filePermissions.value = (res.data.items ?? []).sort((a, b) => a.id - b.id);
  } catch (err) {
    permError.value = err instanceof Error ? err.message : "加载文件权限失败";
  } finally {
    permLoading.value = false;
    permRefreshing.value = false;
  }
}

function openAddPermForm() {
  editingPermId.value = null;
  permPath.value = "";
  permMountPath.value = "";
  permEnabled.value = true;
  permWritable.value = false;
  showPermForm.value = true;
}

function openEditPermForm(perm: AgentFilePermissionResponse) {
  editingPermId.value = perm.id;
  permPath.value = perm.path;
  permMountPath.value = perm.mountPath;
  permEnabled.value = perm.enabled;
  permWritable.value = perm.writable;
  showPermForm.value = true;
}

function cancelPermForm() {
  showPermForm.value = false;
}

async function savePermForm() {
  if (!permPath.value.trim()) {
    await msg.error("请输入宿主机路径");
    return;
  }
  if (!permMountPath.value.trim()) {
    await msg.error("请输入挂载路径");
    return;
  }
  permSaving.value = true;
  try {
    if (editingPermId.value !== null) {
      await api.agentFilePermission.putAgentFilePermissionById(
        editingPermId.value,
        {
          path: permPath.value.trim(),
          mountPath: permMountPath.value.trim(),
          enabled: permEnabled.value,
          writable: permWritable.value,
        },
      );
      await msg.success("文件权限已更新");
    } else {
      await api.agentFilePermission.postAgentFilePermission({
        agentId: props.id as number,
        path: permPath.value.trim(),
        mountPath: permMountPath.value.trim(),
        enabled: permEnabled.value,
        writable: permWritable.value,
      });
      await msg.success("文件权限已添加");
    }
    showPermForm.value = false;
    await loadFilePermissions(true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存失败，请稍后重试";
    await msg.error(message);
  } finally {
    permSaving.value = false;
  }
}

async function handleDeletePermission(perm: AgentFilePermissionResponse) {
  const confirmed = await msg.confirm(`确认删除路径「${perm.path}」的权限？`, {
    title: "删除文件权限",
    confirmText: "删 除",
    confirmType: "danger",
  });
  if (confirmed.type !== "resolve") return;

  permDeletingId.value = perm.id;
  try {
    await api.agentFilePermission.deleteAgentFilePermissionById(perm.id);
    await loadFilePermissions(true);
    await msg.success("文件权限已删除");
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败，请稍后重试";
    await msg.error(message);
  } finally {
    permDeletingId.value = null;
  }
}

watch(activeTab, async (tab) => {
  if (
    tab === "mcp" &&
    mcpRelations.value.length === 0 &&
    !mcpLoading.value &&
    !mcpError.value
  ) {
    await loadMcpRelations();
  }
  if (
    tab === "permissions" &&
    filePermissions.value.length === 0 &&
    !permLoading.value &&
    !permError.value
  ) {
    await loadFilePermissions();
  }
});

const selectedConnectorOption = computed(() => {
  return (
    modelConnectorOptions.value.find(
      (item) => String(item.id) === modelConnectorId.value,
    ) ?? null
  );
});

const selectedModelOption = computed(() => {
  return (
    modelOptions.value.find((item) => String(item.id) === model.value) ?? null
  );
});

const formValidators: Record<string, Validator[]> = {
  name: [required("请输入 Agent 名称"), minLength(2, "名称至少 2 个字符")],
  description: [
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!text) {
        return true;
      }
      return text.length >= 6 ? true : "描述至少 6 个字符";
    },
  ],
  capacity: [
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!text) {
        return true;
      }
      return text.length >= 2 ? true : "能力简介至少 2 个字符";
    },
  ],
};

defineExpose(createDialogExpose<AgentResponse>());

function toConnectorOption(connector: AIModelConnectorResponse): SelectorItem {
  return {
    id: connector.id,
    label: connector.name || `连接器 #${connector.id}`,
    description: `类型：${connector.type}`,
    icon: "C",
  };
}

function toModelOption(modelName: string, type: string): SelectorItem {
  return {
    id: modelName,
    label: modelName,
    description: `来源：${type}`,
    icon: "M",
  };
}

async function resolveConnectorById(id: number) {
  const fromList = modelConnectors.value.find((item) => item.id === id);
  if (fromList) {
    return fromList;
  }

  const res = await api.modelConnector.getModelConnectorById(id);
  const connector = res.data;
  modelConnectors.value.push(connector);

  if (!modelConnectorOptions.value.some((item) => Number(item.id) === id)) {
    modelConnectorOptions.value.push(toConnectorOption(connector));
  }

  return connector;
}

async function loadModelConnectors() {
  connectorLoading.value = true;
  try {
    const res = await api.modelConnector.getModelConnector();
    const items = res.data.items ?? [];
    modelConnectors.value = items;
    modelConnectorOptions.value = items.map(toConnectorOption);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "获取模型连接器列表失败，请稍后重试";
    await msg.error(message);
  } finally {
    connectorLoading.value = false;
  }
}

async function loadModelCatalogByConnectorId(
  connectorIdText: string,
  preserveCurrentModel = false,
) {
  const connectorId = Number(connectorIdText);
  if (!Number.isInteger(connectorId) || connectorId <= 0) {
    modelOptions.value = [];
    if (!preserveCurrentModel) {
      model.value = "";
    }
    return;
  }

  modelCatalogLoading.value = true;
  try {
    const connector = await resolveConnectorById(connectorId);
    const res = await api.modelConnector.getModelConnectorCatalogByType(
      connector.type,
    );
    const options = (res.data.models ?? []).map((name) =>
      toModelOption(name, connector.type),
    );

    const hasCurrentModel = options.some(
      (item) => String(item.id) === model.value,
    );
    if (preserveCurrentModel && model.value && !hasCurrentModel) {
      options.unshift({
        id: model.value,
        label: model.value,
        description: "当前模型（未在目录中）",
        icon: "!",
      });
    }

    modelOptions.value = options;
    if (!preserveCurrentModel && !hasCurrentModel) {
      model.value = "";
    }
  } catch (error) {
    modelOptions.value = [];
    model.value = "";
    const message =
      error instanceof Error ? error.message : "获取模型目录失败，请稍后重试";
    await msg.error(message);
  } finally {
    modelCatalogLoading.value = false;
  }
}

async function onModelConnectorChange(value: string | number) {
  modelConnectorId.value = String(value);
  model.value = "";
  await loadModelCatalogByConnectorId(modelConnectorId.value);
}

async function loadAgentById() {
  if (typeof props.id !== "number") {
    return;
  }

  bootLoading.value = true;
  try {
    const res = await api.agent.getAgentById(props.id);
    const agent = res.data;

    name.value = agent.name ?? "";
    description.value = agent.description ?? "";
    capacity.value = agent.capacity ?? "";
    model.value = agent.model ?? "";
    modelConnectorId.value =
      typeof agent.modelConnectorId === "number"
        ? String(agent.modelConnectorId)
        : "";
    useDockerSandbox.value = agent.sandboxType === "DOCKER";
    containerImage.value = agent.containerImage ?? "";

    const imageUrl = getImageUrlByFileId(agent.avatarFileId);
    if (imageUrl) {
      avatarPreviewUrl.value = imageUrl;
    }

    if (modelConnectorId.value) {
      await loadModelCatalogByConnectorId(modelConnectorId.value, true);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "获取 Agent 详情失败，请稍后重试";
    await msg.error(message);
  } finally {
    bootLoading.value = false;
  }
}

function close(afterLeave?: () => void) {
  if (closing.value) {
    return;
  }
  closing.value = true;
  visible.value = false;
  setTimeout(() => afterLeave?.(), 220);
}

function cancel() {
  close(() => reject("cancel"));
}

function onModelValueChange(value: boolean) {
  if (!value) {
    cancel();
  }
}

function triggerSubmit() {
  if (bootLoading.value || saving.value || closing.value) {
    return;
  }
  submitButtonRef.value?.click();
}

async function handleFormSubmit() {
  const connectorId = Number(modelConnectorId.value);
  if (!Number.isInteger(connectorId) || connectorId <= 0) {
    await msg.error("请选择模型连接器");
    return;
  }

  if (!model.value.trim()) {
    await msg.error("请选择模型");
    return;
  }

  if (useDockerSandbox.value && !containerImage.value.trim()) {
    await msg.error("启用 Docker 沙箱时必须选择镜像");
    return;
  }

  const sandboxType: "NONE" | "DOCKER" = useDockerSandbox.value
    ? "DOCKER"
    : "NONE";

  const payload = {
    name: name.value.trim(),
    description: description.value.trim() || "",
    capacity: capacity.value.trim() || "",
    model: model.value.trim(),
    modelConnectorId: connectorId,
    sandboxType,
    containerImage: useDockerSandbox.value
      ? containerImage.value.trim() || undefined
      : undefined,
    avatarFile: avatarFile.value ?? undefined,
  };

  saving.value = true;
  try {
    const res = isEditMode.value
      ? await api.agent.putAgentById(props.id as number, payload)
      : await api.agent.postAgent(payload);
    close(() => resolve(res.data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存 Agent 失败，请稍后重试";
    await msg.error(message);
  } finally {
    saving.value = false;
  }
}

async function openDockerImageDialog() {
  if (!useDockerSandbox.value) {
    await msg.info("请先启用 Docker 沙箱");
    return;
  }

  const result = await dialogs.SelectOptionDialog({
    title: "选择 Docker 镜像",
    description: "从本地镜像列表中搜索并分页选择",
    modelValue: containerImage.value || null,
    pageSize: 10,
    searchPlaceholder: "按镜像名搜索，例如 nginx",
    emptyText: "暂无本地镜像",
    loadingText: "正在加载本地镜像...",
    fetchOptions: async ({ keyword, page, pageSize }) => {
      const res = await api.modelConnector.getDockerImages({
        page,
        pageSize,
        keyword: keyword || undefined,
      });

      const pageData = res.data;
      return {
        items: (pageData.items || []).map((item) => ({
          id: item.fullName,
          label: item.fullName,
          description: `ID: ${item.imageId} · ${item.size || "未知大小"}`,
          keywords: [item.repository, item.tag, item.imageId],
        })),
        total: pageData.total || 0,
        page: pageData.page || page,
        pageSize: pageData.pageSize || pageSize,
        totalPages: pageData.totalPages || 0,
      };
    },
    normalizeKeyword: (value) => value.trim(),
    allowEmptyKeyword: true,
    searchOnInput: true,
    debounceMs: 260,
  });

  if (result.type !== "resolve" || !result.value) {
    return;
  }

  const image = String(result.value.id || "").trim();
  if (!image) {
    return;
  }

  containerImage.value = image;
  await msg.success(`已选择镜像：${image}`);
}

onMounted(async () => {
  await loadModelConnectors();
  await loadAgentById();
});
</script>

<template>
  <Dialog
    v-model="visible"
    :width="isEditMode ? '40rem' : '34rem'"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="dialog-header-title">{{ computedTitle }}</div>
    </template>

    <!-- Tabs (edit mode only) -->
    <Tabs
      v-if="isEditMode"
      :items="tabItems"
      v-model="activeTab"
      class="dialog-tabs"
    />

    <!-- ── Basic tab ── -->
    <div v-show="activeTab === 'basic'">
      <div v-if="bootLoading" class="loading-state">正在加载 Agent 数据...</div>

      <Form v-else :validators="formValidators" @submit="handleFormSubmit">
        <div class="dialog-avatar-area">
          <button
            class="avatar-upload-btn"
            type="button"
            @click="openAvatarPicker"
          >
            <img
              v-if="avatarPreviewUrl"
              :src="avatarPreviewUrl"
              alt="Agent 头像预览"
              class="avatar-preview"
            />
            <template v-else>
              <span class="avatar-plus"
                ><span class="relative -top-0.5">+</span></span
              >
            </template>
          </button>
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="hidden-file-input"
            @change="onAvatarChange"
          />
          <p class="avatar-hint">头像（可选）</p>
        </div>

        <div class="dialog-form-grid">
          <Input
            v-model="name"
            label="名称"
            placeholder="例如：销售助理 Agent"
            field-name="name"
          />

          <div class="selector-stack">
            <label class="selector-label">模型连接器</label>
            <Selector
              v-model="modelConnectorId"
              :items="modelConnectorOptions"
              placeholder="请选择模型连接器"
              @change="onModelConnectorChange"
            >
              <template #selected>
                <span
                  class="stretch text-left"
                  :class="
                    selectedConnectorOption
                      ? 'text-foreground'
                      : 'text-[color-mix(in_srgb,var(--foreground)_55%,white)]'
                  "
                >
                  {{
                    connectorLoading
                      ? "模型连接器（加载中...）"
                      : selectedConnectorOption
                        ? `模型连接器：${selectedConnectorOption.label}`
                        : "模型连接器"
                  }}
                </span>
              </template>
            </Selector>
          </div>

          <div class="selector-stack">
            <label class="selector-label">模型</label>
            <Selector
              v-model="model"
              :items="modelOptions"
              :placeholder="
                modelConnectorId ? '请从目录中选择模型' : '请先选择模型连接器'
              "
            >
              <template #selected>
                <span
                  class="stretch text-left"
                  :class="
                    selectedModelOption
                      ? 'text-foreground'
                      : 'text-[color-mix(in_srgb,var(--foreground)_55%,white)]'
                  "
                >
                  {{
                    !modelConnectorId
                      ? "模型（请先选择连接器）"
                      : modelCatalogLoading
                        ? "模型（加载中...）"
                        : selectedModelOption
                          ? `模型：${selectedModelOption.label}`
                          : "模型"
                  }}
                </span>
              </template>
            </Selector>
          </div>

          <Textarea
            v-model="description"
            label="描述"
            placeholder="描述 Agent 的角色与边界"
            field-name="description"
            :rows="3"
          />

          <Textarea
            v-model="capacity"
            label="能力简介"
            placeholder="说明该 Agent 擅长的任务"
            field-name="capacity"
            :rows="2"
          />

          <div class="sandbox-area">
            <Checkbox v-model="useDockerSandbox" label="启用 Docker 沙箱" />
            <div class="selector-stack">
              <label class="selector-label">容器镜像</label>
              <section
                class="image-selector-shell rounded-lg"
                @click="openDockerImageDialog"
              >
                <button
                  type="button"
                  class="image-selector-trigger"
                  :disabled="!useDockerSandbox"
                >
                  <span
                    class="stretch min-w-0 text-left"
                    :class="
                      containerImage
                        ? 'text-foreground'
                        : 'text-[color-mix(in_srgb,var(--foreground)_55%,white)]'
                    "
                  >
                    {{
                      containerImage
                        ? `容器镜像：${containerImage}`
                        : useDockerSandbox
                          ? "请选择 Docker 镜像"
                          : "请先启用 Docker 沙箱"
                    }}
                  </span>
                  <span class="image-selector-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 16 16"
                      class="h-full w-full fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]"
                    >
                      <path d="M2.5 8h11" />
                      <path d="m9 4.5 3.5 3.5L9 11.5" />
                    </svg>
                  </span>
                </button>
              </section>
            </div>
          </div>
        </div>

        <button ref="submitButtonRef" type="submit" class="hidden-submit" />
      </Form>
    </div>

    <!-- ── MCP Server tab ── -->
    <div v-show="activeTab === 'mcp'" class="tab-panel">
      <div class="tab-panel-header">
        <span class="tab-panel-title">已分配的 MCP Server</span>
        <div class="tab-panel-actions">
          <Button :disabled="mcpRefreshing" @click="loadMcpRelations(true)"
            >刷 新</Button
          >
          <PrimaryButton :loading="mcpRefreshing" @click="handleAddMcpServer"
            >添 加</PrimaryButton
          >
        </div>
      </div>

      <div v-if="mcpLoading" class="tab-state">正在加载...</div>
      <div v-else-if="mcpError" class="tab-state tab-state--error">
        {{ mcpError }}
      </div>
      <div v-else-if="!mcpRelations.length" class="tab-state">
        暂未分配 MCP Server，点击「添加」进行分配。
      </div>
      <div v-else class="item-list">
        <div v-for="rel in mcpRelations" :key="rel.id" class="item-row">
          <div class="item-info">
            <div class="item-name">
              {{ rel.mcpServer?.name || `MCP #${rel.mcpServerId}` }}
            </div>
            <div class="item-meta">
              ID: {{ rel.mcpServerId }}
              <template v-if="rel.mcpServer?.type">
                · {{ rel.mcpServer.type }}
              </template>
            </div>
          </div>
          <button
            class="link-btn link-btn--danger"
            :disabled="mcpDeletingId === rel.id || mcpRefreshing"
            @click="handleRemoveMcpRelation(rel)"
          >
            {{ mcpDeletingId === rel.id ? "移除中..." : "移 除" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── File Permissions tab ── -->
    <div v-show="activeTab === 'permissions'" class="tab-panel">
      <div class="tab-panel-header">
        <span class="tab-panel-title">文件权限</span>
        <div class="tab-panel-actions">
          <Button :disabled="permRefreshing" @click="loadFilePermissions(true)"
            >刷 新</Button
          >
          <PrimaryButton :disabled="showPermForm" @click="openAddPermForm"
            >添 加</PrimaryButton
          >
        </div>
      </div>

      <!-- Add / Edit form -->
      <div v-if="showPermForm" class="perm-form">
        <div class="perm-form-title">
          {{ editingPermId !== null ? "编辑权限" : "添加权限" }}
        </div>
        <div class="perm-form-fields">
          <Input
            v-model="permPath"
            label="宿主机路径"
            placeholder="/host/path/to/dir"
          />
          <Input
            v-model="permMountPath"
            label="挂载路径"
            placeholder="/mount/path/in/container"
          />
          <div class="perm-flags">
            <Checkbox v-model="permEnabled" label="启用" />
            <Checkbox v-model="permWritable" label="可写" />
          </div>
        </div>
        <div class="perm-form-actions">
          <Button @click="cancelPermForm">取 消</Button>
          <PrimaryButton :loading="permSaving" @click="savePermForm"
            >保 存</PrimaryButton
          >
        </div>
      </div>

      <div v-if="permLoading" class="tab-state">正在加载...</div>
      <div v-else-if="permError" class="tab-state tab-state--error">
        {{ permError }}
      </div>
      <div
        v-else-if="!filePermissions.length && !showPermForm"
        class="tab-state"
      >
        暂无文件权限，点击「添加」配置路径挂载。
      </div>
      <div v-else-if="filePermissions.length" class="item-list">
        <div
          v-for="perm in filePermissions"
          :key="perm.id"
          class="item-row item-row--perm"
        >
          <div class="item-info">
            <div class="perm-paths">
              <span class="perm-path" :title="perm.path">{{ perm.path }}</span>
              <span class="perm-arrow" aria-hidden="true">→</span>
              <span class="perm-mount" :title="perm.mountPath">{{
                perm.mountPath
              }}</span>
            </div>
            <div class="perm-badges">
              <span
                class="perm-badge"
                :class="perm.enabled ? 'perm-badge--on' : 'perm-badge--off'"
                >{{ perm.enabled ? "已启用" : "已禁用" }}</span
              >
              <span v-if="perm.writable" class="perm-badge perm-badge--write"
                >可写</span
              >
            </div>
          </div>
          <div class="item-actions">
            <button
              class="link-btn"
              :disabled="permDeletingId === perm.id"
              @click="openEditPermForm(perm)"
            >
              编辑
            </button>
            <button
              class="link-btn link-btn--danger"
              :disabled="permDeletingId === perm.id || permRefreshing"
              @click="handleDeletePermission(perm)"
            >
              {{ permDeletingId === perm.id ? "删除中..." : "删 除" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button class="dialog-cancel-btn" @click="cancel">
        {{ activeTab === "basic" ? "取 消" : "关 闭" }}
      </Button>
      <PrimaryButton
        v-if="activeTab === 'basic'"
        class="dialog-confirm-btn"
        :loading="saving"
        @click="triggerSubmit"
      >
        {{ isEditMode ? "保 存" : "创 建" }}
      </PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.dialog-form-grid {
  display: grid;
  gap: 0.95rem;
}

.selector-stack {
  display: grid;
  gap: 0.45rem;
}

.selector-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--foreground);
}

.loading-state {
  min-height: 14rem;
  display: grid;
  place-items: center;
  color: var(--foreground-muted);
  font-size: 0.9rem;
}

.sandbox-area {
  display: grid;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.8rem;
  background: rgb(0 104 119 / 0.04);
  border: 1px solid rgb(0 104 119 / 0.12);
}

.sandbox-actions {
  display: flex;
  justify-content: flex-end;
}

.image-selector-shell {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, white);
  background: transparent;
  box-shadow: 0 12px 30px rgb(0 104 119 / 0.08);
}

.image-selector-trigger {
  display: flex;
  width: 100%;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  padding: 0.55rem 0.75rem;
  color: var(--foreground);
  text-align: left;
  font-size: 0.95rem;
}

.image-selector-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.image-selector-icon {
  display: flex;
  height: 1.1rem;
  width: 1.1rem;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}

.hidden-submit {
  display: none;
}

.hidden-file-input {
  display: none;
}

.dialog-avatar-area {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
}

.avatar-upload-btn {
  position: relative;
  overflow: hidden;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 999px;
  border: 1.5px dashed color-mix(in srgb, var(--primary) 40%, transparent);
  background: radial-gradient(
    circle at 30% 22%,
    rgb(255 255 255 / 0.92),
    rgb(230 248 252 / 0.88)
  );
  color: var(--primary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  box-shadow: 0 8px 18px rgb(0 104 119 / 0.1);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease,
    border-color 150ms ease;
}

.avatar-upload-btn:hover {
  transform: translateY(-1px);
  border-color: var(--primary);
  box-shadow: 0 12px 24px rgb(0 104 119 / 0.18);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-plus {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  background: var(--primary);
}

.avatar-hint {
  margin: 0;
  font-size: 0.68rem;
  color: var(--foreground-muted, #8b8f99);
  letter-spacing: 0.02em;
}

:deep(.dialog-cancel-btn) {
  padding: 0.55rem 1.4rem;
}

:deep(.dialog-confirm-btn) {
  width: auto;
  min-width: 5.5rem;
  padding: 0.55rem 1.4rem;
  font-size: 0.875rem;
  box-shadow: none;
}

@media (max-width: 640px) {
  .dialog-form-grid {
    gap: 0.85rem;
  }

  .sandbox-area {
    padding: 0.65rem 0.75rem;
  }
}

/* ── Tabs ── */
.dialog-tabs {
  margin: -0.25rem -1.75rem 1.75rem;
  padding: 0 1.75rem;
  border-bottom: none;
}

/* ── Shared tab panel ── */
.tab-panel {
  display: grid;
  gap: 0.85rem;
}

.tab-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tab-panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--foreground);
}

.tab-panel-actions {
  display: flex;
  gap: 0.5rem;
}

.tab-state {
  min-height: 8rem;
  display: grid;
  place-items: center;
  color: var(--foreground-muted);
  font-size: 0.875rem;
  text-align: center;
}

.tab-state--error {
  color: #c0392b;
}

/* ── Item list (shared by MCP + Permissions) ── */
.item-list {
  display: grid;
  gap: 0.5rem;
  max-height: min(50vh, 22rem);
  overflow-y: auto;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.65rem;
  background: rgb(0 104 119 / 0.04);
  border: 1px solid rgb(0 104 119 / 0.1);
}

.item-info {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 0.75rem;
  color: var(--foreground-muted);
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* ── Link buttons ── */
.link-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary);
  padding: 0.2rem 0.4rem;
  border-radius: 0.35rem;
  transition: background 0.15s;
  white-space: nowrap;
}

.link-btn:hover:not(:disabled) {
  background: rgb(0 104 119 / 0.08);
}

.link-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.link-btn--danger {
  color: #c0392b;
}

.link-btn--danger:hover:not(:disabled) {
  background: rgb(192 57 43 / 0.08);
}

/* ── File permission form ── */
.perm-form {
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 0.75rem;
  background: rgb(0 104 119 / 0.04);
  border: 1px solid rgb(0 104 119 / 0.14);
}

.perm-form-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--foreground);
}

.perm-form-fields {
  display: grid;
  gap: 0.65rem;
}

.perm-flags {
  display: flex;
  gap: 1.25rem;
}

.perm-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* ── Permission row ── */
.item-row--perm {
  align-items: flex-start;
}

.perm-paths {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-family: var(--font-mono, monospace);
  min-width: 0;
}

.perm-path,
.perm-mount {
  max-width: 12rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--foreground);
}

.perm-arrow {
  color: var(--foreground-muted);
  flex-shrink: 0;
}

.perm-badges {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.perm-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.perm-badge--on {
  background: rgb(0 200 100 / 0.12);
  color: #0a7a4a;
}

.perm-badge--off {
  background: rgb(150 150 150 / 0.12);
  color: #777;
}

.perm-badge--write {
  background: rgb(120 37 234 / 0.1);
  color: #7825ea;
}
</style>
