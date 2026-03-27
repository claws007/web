<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type AgentResponse, type AIModelConnectorResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import Checkbox from "@/components/Checkbox.vue";
import Selector, { type SelectorItem } from "@/components/Selector.vue";
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

const isEditMode = computed(() => typeof props.id === "number");

const computedTitle = computed(() => {
  return isEditMode.value ? "编辑 Agent" : "创建 Agent";
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
    width="34rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="dialog-header-title">{{ computedTitle }}</div>
    </template>

    <div v-if="bootLoading" class="loading-state">正在加载 Agent 数据...</div>

    <Form v-else :validators="formValidators" @submit="handleFormSubmit">
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

    <template #footer>
      <Button class="dialog-cancel-btn" @click="cancel"> 取 消 </Button>
      <PrimaryButton
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
</style>
