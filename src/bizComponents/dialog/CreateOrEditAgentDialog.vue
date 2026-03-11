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
            placeholder="Agent name"
            @enter="submit"
          />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Model <span class="text-danger">*</span>
          </div>
          <Select v-model="modelId" :options="modelOptions" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Description</div>
          <Textarea v-model="description" class="bg-transparent" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">Capacity</div>
          <Input
            v-model="capacity"
            placeholder="code,search,summarize"
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
import { useUserStore } from "@/store/user";
import type { Agent, AIModel } from "@/api";
import type { DialogType } from "@/components/dialog/dialog";

type FormResult = Agent;

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, FormResult>;
    id?: number | null;
    title?: string | null;
    width?: string;
    userId?: number | null;
  }>(),
  {
    width: "460px",
    id: null,
    title: null,
    userId: null,
  },
);

const userStore = useUserStore();

const name = ref("");
const modelId = ref<number | undefined>(undefined);
const description = ref("");
const capacity = ref("");

const models = ref<AIModel[]>([]);
const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit Agent" : "Create Agent"),
);
const modelOptions = computed(() =>
  models.value.map((model) => ({
    id: model.id,
    name: model.name,
  })),
);
const canSubmit = computed(
  () => !!name.value.trim() && typeof modelId.value === "number",
);

onMounted(async () => {
  await loadModels();

  if (isEdit.value && props.id) {
    await loadAgent(props.id);
  }
});

async function loadModels() {
  try {
    const response = await api.model.modelList();
    models.value = response.data || [];
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load model options.",
    );
  }
}

async function loadAgent(id: number) {
  try {
    const response = await api.agent.agentDetail(id);
    const agent = response.data;
    name.value = agent.name || "";
    modelId.value = agent.modelId;
    description.value = agent.description || "";
    capacity.value = agent.capacity || "";
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Failed to load agent details.",
    );
  }
}

async function submit() {
  errorMessage.value = "";

  if (!canSubmit.value) {
    errorMessage.value = "Name and model are required.";
    return;
  }

  isSubmitting.value = true;

  try {
    const savedAgent = await props.dialog.process(async () => {
      if (isEdit.value && props.id) {
        const response = await api.agent.agentUpdate(props.id, {
          name: name.value.trim(),
          description: toOptional(description.value),
          capacity: toOptional(capacity.value),
          modelId: modelId.value,
        });
        return response.data;
      }

      const finalUserId = props.userId || userStore.userId;
      if (!finalUserId) {
        throw new Error("User ID is required to create an agent.");
      }

      const response = await api.agent.agentCreate({
        name: name.value.trim(),
        description: toOptional(description.value),
        capacity: toOptional(capacity.value),
        modelId: modelId.value!,
        userId: finalUserId,
      });

      return response.data;
    });

    props.dialog.finish(savedAgent);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to save agent.");
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
