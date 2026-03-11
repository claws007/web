<template>
  <Dialog :dialog :title="finalTitle" :width>
    <template #autoPadding>
      <div class="v gap-3">
        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Name <span class="text-danger">*</span>
          </div>
          <Input
            v-model="name"
            v-focus
            placeholder="Model name"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Type <span class="text-danger">*</span>
          </div>
          <Select v-model="type" :options="typeOptions" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Params (JSON) <span class="text-danger">*</span>
          </div>
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
import type { AIModelResponse } from "@/api";
import type { DialogType } from "@/components/dialog/dialog";

type ModelType = Parameters<typeof api.model.postModel>[0]["type"];
const MODEL_TYPES = [
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "MISTRAL",
  "META",
  "DEEPSEEK",
  "ZHIPU",
  "QWEN",
  "BAIDU",
  "MOONSHOT",
] as const satisfies readonly ModelType[];

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, AIModelResponse>;
    id?: number | null;
    title?: string | null;
    width?: string;
  }>(),
  {
    id: null,
    title: null,
    width: "500px",
  },
);

const name = ref("");
const type = ref<ModelType | undefined>(undefined);
const paramsText = ref("{}");

const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit Model" : "Create Model"),
);
const typeOptions = computed(() =>
  MODEL_TYPES.map((item) => ({
    id: item,
    name: item,
  })),
);
const canSubmit = computed(
  () => !!name.value.trim() && !!type.value && !!paramsText.value.trim(),
);

onMounted(async () => {
  if (isEdit.value && props.id) {
    await loadModel(props.id);
  }
});

async function loadModel(id: number) {
  try {
    const response = await api.model.getModelById(id);
    const model = response.data;
    name.value = model.name || "";
    type.value = isModelType(model.type) ? model.type : undefined;
    paramsText.value = JSON.stringify(model.params || {}, null, 2);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to load model detail.");
  }
}

function isModelType(value: string): value is ModelType {
  return (MODEL_TYPES as readonly string[]).includes(value);
}

async function submit() {
  errorMessage.value = "";

  if (!canSubmit.value || !type.value) {
    errorMessage.value = "Name, type and params are required.";
    return;
  }

  const finalType = type.value;

  let parsedParams: object;
  try {
    const parsed = JSON.parse(paramsText.value);
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

  isSubmitting.value = true;
  try {
    const savedModel = await props.dialog.process(async () => {
      if (isEdit.value && props.id) {
        const response = await api.model.putModelById(props.id, {
          name: name.value.trim(),
          type: finalType,
          params: parsedParams,
        });
        return response.data;
      }

      const response = await api.model.postModel({
        name: name.value.trim(),
        type: finalType,
        params: parsedParams,
      });
      return response.data;
    });

    props.dialog.finish(savedModel);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to save model.");
  } finally {
    isSubmitting.value = false;
  }
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
