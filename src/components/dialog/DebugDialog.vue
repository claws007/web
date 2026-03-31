<script setup lang="ts">
import { ref } from "vue";
import Dialog, { useDialogContext } from "@/components/Dialog.vue";
import Button from "@/components/dialog/Button.vue";

const props = defineProps<{
  data: unknown;
  title?: string;
}>();

const visible = ref(true);
const { resolve } = useDialogContext();

const jsonContent = JSON.stringify(props.data, null, 2);
const dialogTitle = props.title ?? "Debug Information";

function close() {
  visible.value = false;
  // wait for leave transition before unmounting
  setTimeout(() => resolve(), 220);
}
</script>

<template>
  <Dialog v-model="visible" width="32rem" @update:model-value="close">
    <template #header>
      <div class="debug-header">
        <span class="debug-icon">🔍</span>
        <span class="debug-label">{{ dialogTitle }}</span>
      </div>
    </template>

    <pre class="debug-content">{{ jsonContent }}</pre>

    <template #footer>
      <Button type="primary" @click="close">关 闭</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.debug-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.25rem;
}

.debug-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  background: rgb(99 102 241 / 0.1);
}

.debug-label {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.debug-content {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  background: #f8f8f8;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  max-height: 70vh;
  overflow: auto;
  color: #1f2937;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

@media (prefers-color-scheme: dark) {
  .debug-content {
    background: #1f2937;
    border-color: #374151;
    color: #e5e7eb;
  }
}
</style>
