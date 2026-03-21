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
            placeholder="Model connector name"
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
            API Key <span class="text-danger">*</span>
          </div>
          <Input
            v-model="apiKey"
            placeholder="Enter provider API key"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Concurrency</div>
          <Input
            v-model.number="concurrency"
            type="number"
            placeholder="Enter concurrency value"
            @enter="submit"
          />
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
import type { AIModelConnectorResponse } from "@/api";
import type { DialogType } from "@/components/dialog/dialog";

type ModelConnectorType = string;

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, AIModelConnectorResponse>;
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
const type = ref<ModelConnectorType | undefined>(undefined);
const apiKey = ref("");
const concurrency = ref<number | undefined>(undefined);
const modelConnectorTypes = ref<ModelConnectorType[]>([]);

const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () =>
    props.title ||
    (isEdit.value ? "Edit Model Connector" : "Create Model Connector"),
);
const typeOptions = computed(() => {
  const types = modelConnectorTypes.value.slice();
  if (type.value && !types.includes(type.value)) {
    types.push(type.value);
  }

  return types.map((item) => ({
    id: item,
    name: item,
  }));
});
const canSubmit = computed(
  () => !!name.value.trim() && !!type.value && !!apiKey.value.trim(),
);

onMounted(async () => {
  await loadModelConnectorTypes();
  if (isEdit.value && props.id) {
    await loadModelConnector(props.id);
  }
});

async function loadModelConnectorTypes() {
  try {
    const response = await api.modelConnector.getModelConnectorTypes();
    modelConnectorTypes.value = (response.data?.types || []).filter(
      (item): item is string => typeof item === "string" && !!item.trim(),
    );
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load model connector types.",
    );
  }
}

async function loadModelConnector(id: number) {
  try {
    const response = await api.modelConnector.getModelConnectorById(id);
    const modelConnector = response.data;
    name.value = modelConnector.name || "";
    type.value = modelConnector.type || undefined;
    const params =
      typeof modelConnector.params === "object" &&
      modelConnector.params !== null
        ? (modelConnector.params as Record<string, unknown>)
        : {};
    apiKey.value = typeof params.apiKey === "string" ? params.apiKey : "";
    concurrency.value =
      typeof modelConnector.concurrency === "number"
        ? modelConnector.concurrency
        : undefined;
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load model connector detail.",
    );
  }
}

async function submit() {
  errorMessage.value = "";

  if (!canSubmit.value || !type.value) {
    errorMessage.value = "Name, type and API key are required.";
    return;
  }

  const finalType = type.value;
  const parsedParams = {
    apiKey: apiKey.value.trim(),
  };

  isSubmitting.value = true;
  try {
    const savedModelConnector = await props.dialog.process(async () => {
      if (isEdit.value && props.id) {
        const response = await api.modelConnector.putModelConnectorById(
          props.id,
          {
            name: name.value.trim(),
            type: finalType,
            params: parsedParams,
            ...(concurrency.value !== undefined && concurrency.value > 0
              ? { concurrency: concurrency.value }
              : {}),
          },
        );
        return response.data;
      }

      const response = await api.modelConnector.postModelConnector({
        name: name.value.trim(),
        type: finalType,
        params: parsedParams,
        ...(concurrency.value !== undefined && concurrency.value > 0
          ? { concurrency: concurrency.value }
          : {}),
      });
      return response.data;
    });

    props.dialog.finish(savedModelConnector);
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to save model connector.",
    );
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
