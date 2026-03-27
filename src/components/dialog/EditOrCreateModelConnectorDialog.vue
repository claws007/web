<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type AIModelConnectorResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import Selector, { type SelectorItem } from "@/components/Selector.vue";
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
const typeLoading = ref(false);
const submitButtonRef = ref<HTMLButtonElement | null>(null);
const { resolve, reject } = useDialogContext<AIModelConnectorResponse>();

const name = ref("");
const type = ref("");
const concurrency = ref("1");
const apiKey = ref("");
const typeOptions = ref<SelectorItem[]>([]);

const isEditMode = computed(() => typeof props.id === "number");

const computedTitle = computed(() => {
  return isEditMode.value ? "编辑 Model Connector" : "创建 Model Connector";
});

const selectedTypeOption = computed(() => {
  return (
    typeOptions.value.find((item) => String(item.id) === type.value) ?? null
  );
});

const formValidators: Record<string, Validator[]> = {
  name: [required("请输入连接器名称"), minLength(2, "名称至少 2 个字符")],
  concurrency: [
    required("请输入并发数"),
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!/^\d+$/.test(text)) {
        return "并发数必须是正整数";
      }

      return Number(text) > 0 ? true : "并发数必须大于 0";
    },
  ],
  apiKey: [
    required("请输入 API Key"),
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!text) {
        return "请输入 API Key";
      }

      return text.length >= 6 ? true : "API Key 至少 6 个字符";
    },
  ],
};

defineExpose(createDialogExpose<AIModelConnectorResponse>());

function ensureTypeOption(typeValue: string) {
  if (!typeValue) {
    return;
  }

  const exists = typeOptions.value.some(
    (item) => String(item.id) === typeValue,
  );
  if (exists) {
    return;
  }

  typeOptions.value.unshift({
    id: typeValue,
    label: typeValue,
    description: "当前类型",
    icon: "T",
  });
}

async function loadTypeOptions() {
  typeLoading.value = true;
  try {
    const res = await api.modelConnector.getModelConnectorTypes();
    typeOptions.value = (res.data.types ?? []).map((item) => ({
      id: item.code,
      label: item.label,
      description: item.code,
      icon: "T",
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "获取连接器类型失败，请稍后重试";
    await msg.error(message);
  } finally {
    typeLoading.value = false;
  }
}

async function loadModelConnectorById() {
  if (typeof props.id !== "number") {
    return;
  }

  bootLoading.value = true;
  try {
    const res = await api.modelConnector.getModelConnectorById(props.id);
    const connector = res.data;

    name.value = connector.name ?? "";
    type.value = connector.type ?? "";
    concurrency.value = String(connector.concurrency ?? 1);
    apiKey.value = String(connector.params?.apiKey ?? "");
    ensureTypeOption(type.value);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "获取 Model Connector 详情失败，请稍后重试";
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
  const typeValue = type.value.trim();
  if (!typeValue) {
    await msg.error("请选择连接器类型");
    return;
  }

  const apiKeyValue = apiKey.value.trim();
  if (!apiKeyValue) {
    await msg.error("请输入 API Key");
    return;
  }

  const concurrencyValue = Number(concurrency.value);
  if (!Number.isInteger(concurrencyValue) || concurrencyValue <= 0) {
    await msg.error("并发数必须是大于 0 的整数");
    return;
  }

  const payload = {
    name: name.value.trim(),
    type: typeValue,
    params: {
      apiKey: apiKeyValue,
    },
    concurrency: concurrencyValue,
  };

  saving.value = true;
  try {
    const res = isEditMode.value
      ? await api.modelConnector.putModelConnectorById(
          props.id as number,
          payload,
        )
      : await api.modelConnector.postModelConnector(payload);
    close(() => resolve(res.data));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "保存 Model Connector 失败，请稍后重试";
    await msg.error(message);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadTypeOptions();
  await loadModelConnectorById();
});
</script>

<template>
  <Dialog
    v-model="visible"
    width="36rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="dialog-header-title">{{ computedTitle }}</div>
    </template>

    <div v-if="bootLoading" class="loading-state">
      正在加载 Model Connector 数据...
    </div>

    <Form v-else :validators="formValidators" @submit="handleFormSubmit">
      <div class="dialog-form-grid">
        <Input
          v-model="name"
          label="名称"
          placeholder="例如：OpenAI Production"
          field-name="name"
        />

        <div class="selector-stack">
          <label class="selector-label">连接器类型</label>
          <Selector
            v-model="type"
            :items="typeOptions"
            placeholder="请选择连接器类型"
          >
            <template #selected>
              <span
                class="stretch text-left"
                :class="
                  selectedTypeOption
                    ? 'text-foreground'
                    : 'text-[color-mix(in_srgb,var(--foreground)_55%,white)]'
                "
              >
                {{
                  typeLoading
                    ? "连接器类型（加载中...）"
                    : selectedTypeOption
                      ? `${selectedTypeOption.label}`
                      : "连接器类型"
                }}
              </span>
            </template>
          </Selector>
        </div>

        <Input
          v-model="concurrency"
          label="并发数"
          placeholder="例如：8"
          field-name="concurrency"
        />

        <Input
          v-model="apiKey"
          label="API Key"
          placeholder="请输入模型连接器 API Key"
          field-name="apiKey"
        />
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
}
</style>
