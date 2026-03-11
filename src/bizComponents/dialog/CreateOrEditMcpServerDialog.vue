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
            URL <span class="text-danger">*</span>
          </div>
          <Input
            v-model="url"
            placeholder="https://example.com/mcp"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Description</div>
          <Textarea v-model="description" class="bg-transparent" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Params (JSON)</div>
          <Textarea v-model="paramsText" class="bg-transparent" />
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
const url = ref("");
const paramsText = ref("{}");

const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit MCP Server" : "Create MCP Server"),
);
const canSubmit = computed(() => !!url.value.trim());

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
    url.value = mcpServer.url || "";
    paramsText.value = JSON.stringify(mcpServer.params || {}, null, 2);
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load MCP server detail.",
    );
  }
}

async function submit() {
  errorMessage.value = "";

  const finalUrl = url.value.trim();
  if (!finalUrl) {
    errorMessage.value = "URL is required.";
    return;
  }

  try {
    new URL(finalUrl);
  } catch {
    errorMessage.value = "URL must be a valid absolute URL.";
    return;
  }

  let parsedParams: Record<string, any> | undefined;
  const finalParamsText = paramsText.value.trim();
  if (finalParamsText) {
    try {
      const parsed = JSON.parse(finalParamsText);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        errorMessage.value = "Params must be a JSON object.";
        return;
      }
      parsedParams = parsed;
    } catch {
      errorMessage.value = "Params must be valid JSON.";
      return;
    }
  }

  isSubmitting.value = true;
  try {
    const savedMcpServer = await props.dialog.process(async () => {
      const payload = {
        name: toOptional(name.value),
        description: toOptional(description.value),
        url: finalUrl,
        params: parsedParams,
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
