<script setup lang="ts">
import { ref } from "vue";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import Textarea from "@/components/Textarea.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    placeholder?: string;
    initialValue?: string;
    confirmText?: string;
    cancelText?: string;
    required?: boolean;
    rows?: number;
  }>(),
  {
    title: "请输入内容",
    description: "",
    placeholder: "请输入",
    initialValue: "",
    confirmText: "确 认",
    cancelText: "取 消",
    required: true,
    rows: 5,
  },
);

const visible = ref(true);
const closing = ref(false);
const value = ref(props.initialValue);
const errorMessage = ref<string | null>(null);
const { resolve, reject } = useDialogContext<string>();

defineExpose(createDialogExpose<string>());

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

function confirm() {
  const nextValue = value.value.trim();
  if (props.required && !nextValue) {
    errorMessage.value = "请输入内容";
    return;
  }
  errorMessage.value = null;
  close(() => resolve(nextValue));
}

function onModelValueChange(nextValue: boolean) {
  if (!nextValue) {
    cancel();
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    width="30rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="flex items-center gap-3 pb-1">
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary"
        >
          ✎
        </span>
        <div class="min-w-0">
          <div class="text-[1.05rem] font-bold text-(--foreground)">
            {{ title }}
          </div>
          <p
            v-if="description"
            class="mt-1 text-sm leading-6 text-(--foreground-muted)"
          >
            {{ description }}
          </p>
        </div>
      </div>
    </template>

    <div class="v gap-3">
      <Textarea
        v-model="value"
        :rows="rows"
        :placeholder="placeholder"
        :validate-throttle-ms="0"
      />
      <p v-if="errorMessage" class="text-sm text-[#dc2626]">
        {{ errorMessage }}
      </p>
    </div>

    <template #footer>
      <Button @click="cancel">{{ cancelText }}</Button>
      <PrimaryButton @click="confirm">{{ confirmText }}</PrimaryButton>
    </template>
  </Dialog>
</template>
