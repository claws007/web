<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { api, getImageUrlByFileId, type SafeUserResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Input from "@/components/Input.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { useUserStore } from "@/store/user";
import { notify } from "@/components/notification";

const visible = ref(true);
const closing = ref(false);
const saving = ref(false);
const submitButtonRef = ref<HTMLButtonElement | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const avatarFile = ref<File | null>(null);
const avatarPreviewUrl = ref("");

const userStore = useUserStore();
const { resolve, reject } = useDialogContext<SafeUserResponse>();

const name = ref(userStore.user?.name ?? "");

const currentAvatarUrl = computed(() =>
  getImageUrlByFileId(userStore.user?.avatarFileId),
);

const displayAvatarUrl = computed(() => {
  if (avatarPreviewUrl.value) {
    return avatarPreviewUrl.value;
  }
  return currentAvatarUrl.value || "";
});

defineExpose(createDialogExpose<SafeUserResponse>());

function openAvatarPicker() {
  avatarInputRef.value?.click();
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  if (avatarPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
  }

  avatarFile.value = file;
  avatarPreviewUrl.value = URL.createObjectURL(file);
}

onBeforeUnmount(() => {
  if (avatarPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
  }
});

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
  if (saving.value || closing.value) {
    return;
  }
  submitButtonRef.value?.click();
}

async function handleSubmit() {
  saving.value = true;
  try {
    const res = await api.user.putUserMe({
      name: name.value.trim(),
      avatarFile: avatarFile.value ?? undefined,
    });

    close(() => resolve(res.data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新用户信息失败，请稍后重试";
    notify.error(message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog v-model="visible" width="30rem" @update:model-value="onModelValueChange">
    <template #header>
      <div class="dialog-header-title">编辑用户信息</div>
    </template>

    <div class="dialog-body">
      <div class="avatar-area">
        <button class="avatar-upload-btn" type="button" @click="openAvatarPicker">
          <img
            v-if="displayAvatarUrl"
            :src="displayAvatarUrl"
            alt="用户头像"
            class="avatar-preview"
          />
          <span v-else class="avatar-fallback">{{ (name || "U").charAt(0).toUpperCase() }}</span>
        </button>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="hidden-file-input"
          @change="onAvatarChange"
        />
        <p class="avatar-hint">点击头像可更换图片</p>
      </div>

      <Input v-model="name" label="用户名称" placeholder="请输入用户名称" />

      <button ref="submitButtonRef" type="button" class="hidden-submit" @click="handleSubmit" />
    </div>

    <template #footer>
      <Button class="dialog-cancel-btn" @click="cancel">取 消</Button>
      <PrimaryButton class="dialog-confirm-btn" :loading="saving" @click="triggerSubmit">
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

.avatar-area {
  display: grid;
  justify-items: center;
  gap: 0.55rem;
}

.avatar-upload-btn {
  display: inline-flex;
  height: 5.25rem;
  width: 5.25rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, white);
  background: rgb(255 255 255 / 0.26);
  box-shadow: 0 12px 30px rgb(0 104 119 / 0.12);
  cursor: pointer;
}

.avatar-preview {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--foreground);
}

.avatar-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--foreground-muted);
}

.hidden-file-input,
.hidden-submit {
  display: none;
}
</style>
