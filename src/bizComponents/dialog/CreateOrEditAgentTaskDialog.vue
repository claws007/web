<template>
  <Dialog :dialog :title="finalTitle" :width>
    <template #autoPadding>
      <div class="v gap-3">
        <div class="v gap-1">
          <div class="text-sm font-semibold">
            Content <span class="text-danger">*</span>
          </div>
          <Textarea v-model="content" v-focus class="bg-transparent" />
        </div>

        <div class="v gap-1">
          <div class="text-sm font-semibold">AC (Acceptance Criteria)</div>
          <Textarea v-model="ac" class="bg-transparent" />
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
import type { AgentTaskResponse } from "@/api";
import type { DialogType } from "@/components/dialog/dialog";

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, AgentTaskResponse>;
    id?: number | null;
    agentId?: number | null;
    title?: string | null;
    width?: string;
  }>(),
  {
    id: null,
    agentId: null,
    title: null,
    width: "560px",
  },
);

const content = ref("");
const ac = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit Task" : "Create Task"),
);
const canSubmit = computed(() => {
  if (!content.value.trim()) {
    return false;
  }

  if (isEdit.value) {
    return true;
  }

  return typeof props.agentId === "number" && props.agentId > 0;
});

onMounted(async () => {
  if (isEdit.value && props.id) {
    await loadTask(props.id);
  }
});

async function loadTask(id: number) {
  try {
    const response = await api.agentTask.getAgentTaskById(id);
    const task = response.data;
    content.value = task.content || "";
    ac.value = task.ac || "";
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to load task detail.");
  }
}

async function submit() {
  errorMessage.value = "";

  const finalContent = content.value.trim();
  if (!finalContent) {
    errorMessage.value = "Content is required.";
    return;
  }

  if (!isEdit.value && (!props.agentId || props.agentId <= 0)) {
    errorMessage.value = "Agent is required for creating task.";
    return;
  }

  isSubmitting.value = true;
  try {
    const savedTask = await props.dialog.process(async () => {
      if (isEdit.value && props.id) {
        const response = await api.agentTask.putAgentTaskById(props.id, {
          content: finalContent,
          ac: toOptional(ac.value),
        });
        return response.data;
      }

      const response = await api.agent.postAgentByIdTasks(props.agentId!, {
        content: finalContent,
        ac: toOptional(ac.value),
      });
      return response.data;
    });

    props.dialog.finish(savedTask);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to save task.");
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
