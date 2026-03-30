<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import ChatHistoryContainer from "@/components/ChatHistoryContainer.vue";
import Button from "@/components/dialog/Button.vue";

const props = defineProps<{
  agentTaskId: number;
}>();

const visible = ref(true);
const closing = ref(false);
const { reject, resolve } = useDialogContext<void>();

defineExpose(createDialogExpose<void>());

const title = computed(() => `AgentTask #${props.agentTaskId} 对话列表`);

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

function handleClose() {
  close(() => resolve());
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
    width="56rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="title">{{ title }}</div>
    </template>

    <ChatHistoryContainer :agent-task-id="agentTaskId" class="history-wrap" />

    <template #footer>
      <Button @click="handleClose">关 闭</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
}

.history-wrap {
  max-height: 62vh;
}
</style>
