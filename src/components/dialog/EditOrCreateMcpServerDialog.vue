<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type MCPServerResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Form from "@/components/Form.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
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
const submitButtonRef = ref<HTMLButtonElement | null>(null);
const { resolve, reject } = useDialogContext<MCPServerResponse>();

const name = ref("");
const description = ref("");
const serverType = ref<"HTTP" | "STDIO">("HTTP");
const url = ref("");
const command = ref("");
const commandArguments = ref("");
const headersText = ref("");
const builtinReadonly = ref(false);

const typeOptions: SelectorItem[] = [
  {
    id: "HTTP",
    label: "HTTP",
    description: "通过 URL 连接远程 MCP Server",
    icon: "H",
  },
  {
    id: "STDIO",
    label: "STDIO",
    description: "通过本地命令启动 MCP Server",
    icon: "S",
  },
];

const isEditMode = computed(() => typeof props.id === "number");
const isHttpType = computed(() => serverType.value === "HTTP");
const isStdioType = computed(() => serverType.value === "STDIO");
const isBuiltinEditBlocked = computed(
  () => isEditMode.value && builtinReadonly.value,
);

const computedTitle = computed(() => {
  return isEditMode.value ? "编辑 MCP Server" : "创建 MCP Server";
});

const formValidators: Record<string, Validator[]> = {
  name: [required("请输入 MCP Server 名称"), minLength(2, "名称至少 2 个字符")],
  description: [
    (value: string) => {
      const text = String(value ?? "").trim();
      if (!text) {
        return true;
      }

      return text.length >= 2 ? true : "描述至少 2 个字符";
    },
  ],
};

defineExpose(createDialogExpose<MCPServerResponse>());

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

async function loadMcpServerById() {
  if (typeof props.id !== "number") {
    return;
  }

  bootLoading.value = true;
  try {
    const res = await api.mcpServer.getMcpServerById(props.id);
    const item = res.data;

    name.value = item.name ?? "";
    description.value = item.description ?? "";
    serverType.value = item.type;
    url.value = item.url ?? "";
    command.value = item.command ?? "";
    commandArguments.value = item.commandArguments ?? "";
    headersText.value = item.headers
      ? JSON.stringify(item.headers, null, 2)
      : "";
    builtinReadonly.value = Boolean((item as { builtin?: boolean }).builtin);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "获取 MCP Server 详情失败，请稍后重试";
    await msg.error(message);
  } finally {
    bootLoading.value = false;
  }
}

function parseHeadersInput(): Record<string, any> | undefined {
  const raw = headersText.value.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = JSON.parse(raw);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("请求头配置必须是 JSON 对象");
  }

  return parsed as Record<string, any>;
}

function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("HTTP 模式下 URL 仅支持 http/https 协议");
  }

  return parsed.toString();
}

async function handleFormSubmit() {
  if (isBuiltinEditBlocked.value) {
    await msg.info("内置 MCP Server 不允许编辑");
    return;
  }

  const type = serverType.value;
  const trimmedName = name.value.trim();

  if (!trimmedName) {
    await msg.error("请输入 MCP Server 名称");
    return;
  }

  let normalizedUrl = "";
  try {
    if (type === "HTTP") {
      normalizedUrl = normalizeHttpUrl(url.value);
      if (!normalizedUrl) {
        await msg.error("HTTP 模式下必须填写可访问的 URL");
        return;
      }
    }
  } catch (error) {
    await msg.error(error instanceof Error ? error.message : "URL 格式无效");
    return;
  }

  const trimmedCommand = command.value.trim();
  if (type === "STDIO" && !trimmedCommand) {
    await msg.error("STDIO 模式下必须填写启动命令");
    return;
  }

  let parsedHeaders: Record<string, any> | undefined;
  try {
    parsedHeaders = parseHeadersInput();
  } catch (error) {
    await msg.error(
      error instanceof Error ? error.message : "请求头 JSON 格式错误",
    );
    return;
  }

  const payload: Parameters<typeof api.mcpServer.postMcpServer>[0] = {
    name: trimmedName,
    description: description.value.trim() || null,
    type,
    url: type === "HTTP" ? normalizedUrl : null,
    command: type === "STDIO" ? trimmedCommand : null,
    commandArguments:
      type === "STDIO" ? commandArguments.value.trim() || null : null,
    headers: parsedHeaders,
  };

  saving.value = true;
  try {
    const res = isEditMode.value
      ? await api.mcpServer.putMcpServerById(props.id as number, payload)
      : await api.mcpServer.postMcpServer(payload);
    close(() => resolve(res.data));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "保存 MCP Server 失败，请稍后重试";
    await msg.error(message);
  } finally {
    saving.value = false;
  }
}

onMounted(loadMcpServerById);
</script>

<template>
  <Dialog
    v-model="visible"
    width="38rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="dialog-header-title">{{ computedTitle }}</div>
    </template>

    <div v-if="bootLoading" class="loading-state">
      正在加载 MCP Server 数据...
    </div>

    <Form v-else :validators="formValidators" @submit="handleFormSubmit">
      <div v-if="isBuiltinEditBlocked" class="readonly-tip">
        当前为内置 MCP Server，仅支持查看，不允许编辑或删除。
      </div>

      <div class="dialog-form-grid">
        <Input
          v-model="name"
          label="名称"
          placeholder="例如：GitHub MCP"
          field-name="name"
        />

        <Textarea
          v-model="description"
          label="描述"
          placeholder="说明这个 MCP Server 的用途（可选）"
          field-name="description"
          :rows="3"
        />

        <div class="selector-stack">
          <label class="selector-label">连接类型</label>
          <Selector v-model="serverType" :items="typeOptions" />
        </div>

        <Input
          v-if="isHttpType"
          v-model="url"
          label="服务 URL"
          placeholder="例如：https://example.com/mcp"
          field-name="url"
        />

        <Input
          v-if="isStdioType"
          v-model="command"
          label="启动命令"
          placeholder="例如：npx"
          field-name="command"
        />

        <Input
          v-if="isStdioType"
          v-model="commandArguments"
          label="命令参数"
          placeholder="例如：-y @modelcontextprotocol/server-github"
          field-name="commandArguments"
        />

        <Textarea
          v-model="headersText"
          label="请求头 JSON"
          placeholder='例如：{"Authorization":"Bearer <token>"}'
          field-name="headers"
          :rows="4"
        />
      </div>

      <button ref="submitButtonRef" type="submit" class="hidden-submit" />
    </Form>

    <template #footer>
      <Button class="dialog-cancel-btn" @click="cancel"> 取 消 </Button>
      <PrimaryButton
        class="dialog-confirm-btn"
        :disabled="isBuiltinEditBlocked"
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

.readonly-tip {
  margin-bottom: 0.8rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(245 158 11 / 0.36);
  background: rgb(255 247 237 / 0.95);
  color: rgb(146 64 14);
  font-size: 0.83rem;
  line-height: 1.45;
  padding: 0.55rem 0.7rem;
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
</style>
