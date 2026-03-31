<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type SkillResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import { notify } from "@/components/notification";

const props = defineProps<{
  id?: number;
}>();

const visible = ref(true);
const closing = ref(false);
const loading = ref(false);
const submitting = ref(false);

const name = ref("");
const description = ref("");

const { resolve, reject } = useDialogContext<SkillResponse>();
defineExpose(createDialogExpose<SkillResponse>());

const isEdit = computed(() => typeof props.id === "number");
const title = computed(() => (isEdit.value ? "编辑 Skill" : "新建 Skill"));

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

async function loadSkill() {
  if (!isEdit.value || props.id === undefined) {
    return;
  }

  loading.value = true;
  try {
    const res = await api.skill.getSkillById(props.id);
    name.value = res.data.name ?? "";
    description.value = res.data.description ?? "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "加载 Skill 失败";
    notify.error(message);
    cancel();
  } finally {
    loading.value = false;
  }
}

function buildPayload() {
  const nextName = name.value.trim();
  if (!nextName) {
    notify.info("请输入 Skill 名称");
    return null;
  }

  return {
    name: nextName,
    description: description.value.trim() || null,
  };
}

async function submit() {
  if (submitting.value) {
    return;
  }

  const payload = buildPayload();
  if (!payload) {
    return;
  }

  submitting.value = true;
  try {
    let saved: SkillResponse;
    if (isEdit.value && props.id !== undefined) {
      const res = await api.skill.putSkillById(props.id, payload);
      saved = res.data;
      notify.success("Skill 更新成功");
    } else {
      const res = await api.skill.postSkill(payload);
      saved = res.data;
      notify.success("Skill 创建成功");
    }

    close(() => resolve(saved));
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存 Skill 失败";
    notify.error(message);
  } finally {
    submitting.value = false;
  }
}

onMounted(loadSkill);
</script>

<template>
  <Dialog
    v-model="visible"
    width="36rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="v gap-1">
        <div class="title">{{ title }}</div>
        <div class="subtitle">仅编辑 Skill 的名称与描述</div>
      </div>
    </template>

    <div class="v gap-3">
      <Input
        v-model="name"
        label="名称"
        placeholder="请输入 Skill 名称"
        :validate-throttle-ms="0"
        :disabled="loading || submitting"
      />

      <Textarea
        v-model="description"
        label="描述"
        placeholder="可选：描述 Skill 的用途"
        :rows="4"
        :validate-throttle-ms="0"
        :disabled="loading || submitting"
      />
    </div>

    <template #footer>
      <Button :disabled="submitting" @click="cancel">取 消</Button>
      <PrimaryButton :loading="submitting" @click="submit">
        {{ isEdit ? "保 存" : "创 建" }}
      </PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
}

.subtitle {
  font-size: 0.82rem;
  color: var(--foreground-muted);
}
</style>
