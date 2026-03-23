<script setup lang="ts">
import { ref } from "vue";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    confirmType?: "primary" | "danger";
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }>(),
  {
    title: "请确认",
    confirmText: "确 认",
    cancelText: "取 消",
    confirmType: "primary",
  },
);

const visible = ref(true);
const closing = ref(false);
const { resolve, reject } = useDialogContext<boolean>();

defineExpose(createDialogExpose<boolean>());

function close(afterLeave?: () => void) {
  if (closing.value) {
    return;
  }
  closing.value = true;
  visible.value = false;
  // wait for leave transition before unmounting
  setTimeout(() => afterLeave?.(), 220);
}

function cancel() {
  props.onCancel?.();
  close(() => reject("cancel"));
}

async function confirm() {
  await props.onConfirm?.();
  close(() => resolve(true));
}

function onModelValueChange(value: boolean) {
  if (!value) {
    cancel();
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    width="24rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="confirm-header">
        <span class="confirm-icon" :class="`confirm-icon--${confirmType}`"
          >?</span
        >
        <span class="confirm-title">{{ title }}</span>
      </div>
    </template>

    <p class="confirm-content">{{ content }}</p>

    <template #footer>
      <Button class="confirm-cancel-btn" @click="cancel">
        {{ cancelText }}
      </Button>
      <PrimaryButton
        class="confirm-primary-btn"
        :class="{ 'confirm-primary-btn--danger': confirmType === 'danger' }"
        @click="confirm"
      >
        {{ confirmText }}
      </PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.confirm-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.25rem;
}

.confirm-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}

.confirm-icon--primary {
  background: rgb(0 104 119 / 0.1);
  color: var(--primary);
}

.confirm-icon--danger {
  background: rgb(220 38 38 / 0.1);
  color: #dc2626;
}

.confirm-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.confirm-content {
  font-size: 0.9rem;
  line-height: var(--leading-body, 1.6);
  color: var(--foreground-muted);
}

:deep(.confirm-cancel-btn) {
  padding: 0.55rem 1.4rem;
}

:deep(.confirm-primary-btn) {
  width: auto;
  padding: 0.55rem 1.4rem;
  font-size: 0.875rem;
  box-shadow: none;
}

:deep(.confirm-primary-btn--danger) {
  background: #dc2626;
  box-shadow: none;
}
</style>
