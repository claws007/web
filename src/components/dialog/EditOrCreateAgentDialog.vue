<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type AgentResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import Checkbox from "@/components/Checkbox.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
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

const isEditMode = computed(() => typeof props.id === "number");

const computedTitle = computed(() => {
  return isEditMode.value ? "编辑 Agent" : "创建 Agent";
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
  model: [required("请输入模型名称")],
  modelConnectorId: [
    required("请输入模型连接器 ID"),
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!/^\d+$/.test(text)) {
        return "模型连接器 ID 必须是正整数";
      }
      return Number(text) > 0 ? true : "模型连接器 ID 必须大于 0";
    },
  ],
  containerImage: [
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!useDockerSandbox.value) {
        return true;
      }
      return text.length > 0 ? true : "启用 Docker 沙箱时必须填写镜像";
    },
  ],
};

defineExpose(createDialogExpose<AgentResponse>());

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
  const sandboxType: "NONE" | "DOCKER" = useDockerSandbox.value
    ? "DOCKER"
    : "NONE";

  const payload = {
    name: name.value.trim(),
    description: description.value.trim() || "",
    capacity: capacity.value.trim() || "",
    model: model.value.trim(),
    modelConnectorId: Number(modelConnectorId.value),
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

onMounted(loadAgentById);
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

        <Input
          v-model="model"
          label="模型"
          placeholder="例如：gpt-4.1"
          field-name="model"
        />

        <Input
          v-model="modelConnectorId"
          label="模型连接器 ID"
          placeholder="例如：1"
          field-name="modelConnectorId"
        />

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
          <Input
            v-model="containerImage"
            label="容器镜像"
            placeholder="例如：alpine:latest"
            field-name="containerImage"
          />
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
