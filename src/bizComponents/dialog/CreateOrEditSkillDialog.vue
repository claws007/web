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
            placeholder="Skill name"
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
import type { DialogType } from "@/components/dialog/dialog";
import type { SkillResponse } from "@/api";

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, SkillResponse>;
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
const description = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => typeof props.id === "number" && props.id > 0);
const finalTitle = computed(
  () => props.title || (isEdit.value ? "Edit Skill" : "Create Skill"),
);
const canSubmit = computed(() => !!name.value.trim());

onMounted(async () => {
  if (isEdit.value && props.id) {
    await loadSkill(props.id);
  }
});

async function loadSkill(id: number) {
  try {
    const response = await api.skill.getSkillById(id);
    const skill = response.data;
    name.value = skill.name || "";
    description.value = skill.description || "";
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to load skill detail.");
  }
}

async function submit() {
  errorMessage.value = "";

  const finalName = name.value.trim();
  if (!finalName) {
    errorMessage.value = "Name is required.";
    return;
  }

  isSubmitting.value = true;
  try {
    const savedSkill = await props.dialog.process(async () => {
      if (isEdit.value && props.id) {
        const response = await api.skill.putSkillById(props.id, {
          name: finalName,
          description: description.value.trim() || undefined,
        });
        return response.data;
      }

      const response = await api.skill.postSkill({
        name: finalName,
        description: description.value.trim() || undefined,
      });
      return response.data;
    });

    props.dialog.finish(savedSkill);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, "Failed to save skill.");
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
