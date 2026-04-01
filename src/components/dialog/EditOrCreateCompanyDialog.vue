<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { api, getImageUrlByFileId, type CompanyResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { notify } from "@/components/notification";

const props = defineProps<{
  id?: number;
}>();

const visible = ref(true);
const closing = ref(false);
const loading = ref(false);
const saving = ref(false);

const brandInputRef = ref<HTMLInputElement | null>(null);
const brandFile = ref<File | null>(null);
const brandPreviewUrl = ref("");

const name = ref("");
const description = ref("");

const { resolve, reject } = useDialogContext<CompanyResponse>();
defineExpose(createDialogExpose<CompanyResponse>());

const isEditMode = computed(() => typeof props.id === "number");
const title = computed(() =>
  isEditMode.value ? "编辑 Company" : "创建 Company",
);

function openBrandPicker() {
  brandInputRef.value?.click();
}

function onBrandChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  if (brandPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(brandPreviewUrl.value);
  }

  brandFile.value = file;
  brandPreviewUrl.value = URL.createObjectURL(file);
}

onBeforeUnmount(() => {
  if (brandPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(brandPreviewUrl.value);
  }
});

async function loadCompany() {
  if (!isEditMode.value || props.id === undefined) {
    return;
  }

  loading.value = true;
  try {
    const res = await api.company.getCompanyByCompanyId(props.id);
    const company = res.data;
    name.value = company.name ?? "";
    description.value = company.description ?? "";

    const currentBrandUrl = getImageUrlByFileId(company.brandFileId);
    if (currentBrandUrl) {
      brandPreviewUrl.value = currentBrandUrl;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "加载 Company 信息失败";
    notify.error(message);
    cancel();
  } finally {
    loading.value = false;
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

async function handleSubmit() {
  const nextName = name.value.trim();
  if (!nextName) {
    notify.info("请输入 Company 名称");
    return;
  }

  saving.value = true;
  try {
    let saved: CompanyResponse;
    if (isEditMode.value && props.id !== undefined) {
      const res = await api.company.putCompanyByCompanyId(props.id, {
        name: nextName,
        description: description.value.trim(),
        brandFile: brandFile.value ?? undefined,
      });
      saved = res.data;
      notify.success("Company 更新成功");
    } else {
      const res = await api.company.postCompany({
        name: nextName,
        description: description.value.trim() || undefined,
        brandFile: brandFile.value ?? undefined,
      });
      saved = res.data;
      notify.success("Company 创建成功");
    }

    close(() => resolve(saved));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存 Company 失败，请稍后重试";
    notify.error(message);
  } finally {
    saving.value = false;
  }
}

onMounted(loadCompany);
</script>

<template>
  <Dialog
    v-model="visible"
    width="34rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="dialog-header-title">{{ title }}</div>
    </template>

    <div class="dialog-body">
      <div class="brand-area">
        <button class="brand-upload-btn" type="button" @click="openBrandPicker">
          <img
            v-if="brandPreviewUrl"
            :src="brandPreviewUrl"
            alt="Company 品牌图"
            class="brand-preview"
          />
          <span v-else class="brand-fallback">LOGO</span>
        </button>
        <input
          ref="brandInputRef"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="onBrandChange"
        />
        <p class="brand-hint">点击上传 Company Logo / 品牌图</p>
      </div>

      <Input
        v-model="name"
        label="名称"
        placeholder="请输入 Company 名称"
        :disabled="loading || saving"
      />

      <Textarea
        v-model="description"
        label="描述"
        placeholder="可选：请输入 Company 描述"
        :rows="3"
        :disabled="loading || saving"
      />
    </div>

    <template #footer>
      <Button :disabled="saving" @click="cancel">取 消</Button>
      <PrimaryButton :loading="saving" @click="handleSubmit">
        保 存
      </PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
}

.dialog-body {
  display: grid;
  gap: 0.9rem;
}

.brand-area {
  display: grid;
  justify-items: center;
  gap: 0.55rem;
}

.brand-upload-btn {
  display: inline-flex;
  height: 5.25rem;
  width: 5.25rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, white);
  background: rgb(255 255 255 / 0.26);
  box-shadow: 0 12px 30px rgb(0 104 119 / 0.12);
  cursor: pointer;
}

.brand-preview {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.brand-fallback {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--foreground-muted);
}

.brand-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--foreground-muted);
}

.hidden-input {
  display: none;
}
</style>
