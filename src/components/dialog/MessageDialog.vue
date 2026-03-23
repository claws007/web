<script setup lang="ts">
import { ref } from "vue";
import Dialog, { useDialogContext } from "@/components/Dialog.vue";
import Button from "@/components/dialog/Button.vue";

const props = defineProps<{
  content: string;
  type?: "info" | "success" | "error";
}>();

const visible = ref(true);
const { resolve } = useDialogContext();

const iconMap = {
  info: "ℹ",
  success: "✓",
  error: "✕",
} as const;

const labelMap = {
  info: "提示",
  success: "成功",
  error: "错误",
} as const;

function close() {
  visible.value = false;
  // wait for leave transition before unmounting
  setTimeout(() => resolve(), 220);
}
</script>

<template>
  <Dialog v-model="visible" width="22rem" @update:model-value="close">
    <template #header>
      <div class="msg-header">
        <span class="msg-icon" :class="`msg-icon--${type ?? 'info'}`">
          {{ iconMap[type ?? "info"] }}
        </span>
        <span class="msg-label">{{ labelMap[type ?? "info"] }}</span>
      </div>
    </template>

    <p class="msg-content">{{ content }}</p>

    <template #footer>
      <Button type="primary" @click="close">确 认</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.msg-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.25rem;
}

.msg-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.msg-icon--info {
  background: rgb(0 104 119 / 0.1);
  color: var(--primary);
}

.msg-icon--success {
  background: rgb(22 163 74 / 0.1);
  color: #16a34a;
}

.msg-icon--error {
  background: rgb(220 38 38 / 0.1);
  color: #dc2626;
}

.msg-label {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.msg-content {
  font-size: 0.9rem;
  line-height: var(--leading-body, 1.6);
  color: var(--foreground-muted);
}
</style>
