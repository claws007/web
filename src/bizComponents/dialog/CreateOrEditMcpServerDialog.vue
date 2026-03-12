<template>
  <Dialog :dialog :title="finalTitle" :width>
    <template #autoPadding>
      <div class="v gap-3">
        <div class="v gap-1">
          <div class="text-sm font-semibold">Name</div>
          <Input
            v-model="name"
            v-focus
            placeholder="MCP server name"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Type <span class="text-danger">*</span>
          </div>
          <Select v-model="type" :options="typeOptions" />
        </div>

        <template v-if="type === 'HTTP'">
          <div class="v gap-1">
            <div class="text-sm font-semibold">URL</div>
            <Input
              v-model="url"
              placeholder="https://example.com/mcp"
              @enter="submit"
            />
          </div>
          <div class="v gap-1">
            <div class="text-sm font-semibold">Headers (JSON)</div>
            <Textarea v-model="headersText" class="bg-transparent" />
          </div>
        </template>

        <div v-if="type === 'STDIO'" class="v gap-1">
          <div class="text-sm font-semibold">
            Command <span class="text-danger">*</span>
          </div>
          <Input v-model="command" placeholder="npx" @enter="submit" />
        </div>

        <div v-if="type === 'STDIO'" class="v gap-1">
          <div class="text-sm font-semibold">Command Arguments</div>
          <Input
            v-model="commandArguments"
            placeholder="-y @modelcontextprotocol/server-filesystem ./"
            @enter="submit"
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
import type { MCPServerResponse } from "@/api";
import type { DialogType } from "@/components/dialog/dialog";

type MCPServerType = Parameters<typeof api.mcpServer.postMcpServer>[0]["type"];
const MCP_SERVER_TYPES = [
  "HTTP",
  "STDIO",
] as const satisfies readonly MCPServerType[];

const DEFAULT_HTTP_HEADERS_TEMPLATE = JSON.stringify(
  {
    Authorization: "Bearer YOUR_TOKEN",
  },
  null,
  2,
);

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, MCPServerResponse>;
    id?: number | null;
    title?: string | null;
    width?: string;
  }>(),
  {
    id: null,
    title: null,
    width: "560px",
  },
);

const name = ref("");
const description = ref("");
const type = ref<MCPServerType>("HTTP");
const url = ref("");
const command = ref("");
const commandArguments = ref("");
const headersText = ref(DEFAULT_HTTP_HEADERS_TEMPLATE);

const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit MCP Server" : "Create MCP Server"),
);
const typeOptions = computed(() =>
  MCP_SERVER_TYPES.map((item) => ({
    id: item,
    name: item,
  })),
);
const canSubmit = computed(() => {
  return type.value === "STDIO" ? !!command.value.trim() : true;
});

onMounted(async () => {
  if (isEdit.value && props.id) {
    await loadMcpServer(props.id);
  }
});

async function loadMcpServer(id: number) {
  try {
    const response = await api.mcpServer.getMcpServerById(id);
    const mcpServer = response.data;
    name.value = mcpServer.name || "";
    description.value = mcpServer.description || "";
    type.value = mcpServer.type;
    url.value = mcpServer.url || "";
    command.value = mcpServer.command || "";
    commandArguments.value = mcpServer.commandArguments || "";
    headersText.value = JSON.stringify(mcpServer.headers || {}, null, 2);
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load MCP server detail.",
    );
  }
}

async function submit() {
  errorMessage.value = "";

  let finalUrl = "";
  if (type.value === "HTTP") {
    finalUrl = url.value.trim();
    if (finalUrl) {
      try {
        new URL(finalUrl);
      } catch {
        errorMessage.value = "URL must be a valid absolute URL.";
        return;
      }
    }
  }

  const finalCommand = command.value.trim();
  if (type.value === "STDIO" && !finalCommand) {
    errorMessage.value = "Command is required for STDIO type.";
    return;
  }

  let parsedHeaders: Record<string, any> | undefined;
  const finalHeadersText = headersText.value.trim();
  if (finalHeadersText) {
    try {
      const parsed = JSON.parse(finalHeadersText);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        errorMessage.value = "Headers must be a JSON object.";
        return;
      }
      parsedHeaders = parsed;
    } catch {
      errorMessage.value = "Headers must be valid JSON.";
      return;
    }
  }

  isSubmitting.value = true;
  try {
    const savedMcpServer = await props.dialog.process(async () => {
      const payload = {
        name: toOptional(name.value),
        description: toOptional(description.value),
        type: type.value,
        command: type.value === "STDIO" ? finalCommand : undefined,
        commandArguments:
          type.value === "STDIO"
            ? toOptional(commandArguments.value)
            : undefined,
        headers: type.value === "HTTP" ? parsedHeaders : undefined,
        ...(type.value === "HTTP" && finalUrl ? { url: finalUrl } : {}),
      };

      if (isEdit.value && props.id) {
        const response = await api.mcpServer.putMcpServerById(
          props.id,
          payload,
        );
        return response.data;
      }

      const response = await api.mcpServer.postMcpServer(payload);
      return response.data;
    });

    props.dialog.finish(savedMcpServer);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to save MCP server.");
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
