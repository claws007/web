<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import AgentAssignmentSelect, {
  type AgentAssignmentValue,
} from "@/components/AgentAssignmentSelect.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";

const props = withDefaults(
  defineProps<{
    taskId: number;
    taskContent: string;
    defaultValue?: AgentAssignmentValue;
  }>(),
  {
    defaultValue: () => ({ mode: "auto", agent: null }),
  },
);

const visible = ref(true);
const closing = ref(false);
const selection = ref<AgentAssignmentValue>(props.defaultValue);

const { resolve, reject } = useDialogContext<AgentAssignmentValue>();

defineExpose(createDialogExpose<AgentAssignmentValue>());

const selectionSummary = computed(() => {
  if (selection.value.mode === "auto") {
    return "由系统助理自动接管当前任务分配。";
  }

  return `将直接分配给 ${selection.value.agent.name}。`;
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

function confirm() {
  close(() => resolve(selection.value));
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
    width="32rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="flex flex-col gap-2">
        <div class="text-lg font-semibold text-foreground">分配任务</div>
        <div class="text-sm leading-6 text-foreground-muted">
          为 Task #{{ taskId }} 选择一个具体 Agent，或交给系统助理自动处理。
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div
        class="rounded-2xl border border-[rgb(0_104_119/0.14)] bg-[rgb(255_255_255/0.72)] px-4 py-3 shadow-[0_18px_40px_rgb(0_104_119/0.06)]"
      >
        <div
          class="mb-2 text-xs font-medium tracking-[0.08em] text-foreground-muted uppercase"
        >
          分配方式
        </div>
        <AgentAssignmentSelect v-model="selection" />
      </div>

      <div class="rounded-2xl bg-primary/6 px-4 py-3 text-sm text-foreground">
        {{ selectionSummary }}
      </div>

      <div class="rounded-2xl border border-dashed border-primary/18 px-4 py-3">
        <div
          class="mb-1 text-xs font-medium tracking-[0.08em] text-foreground-muted uppercase"
        >
          任务内容
        </div>
        <p class="text-sm leading-6 text-foreground-muted wrap-break-word">
          {{ taskContent || "-" }}
        </p>
      </div>
    </div>

    <template #footer>
      <Button @click="cancel">取 消</Button>
      <PrimaryButton @click="confirm">确 认</PrimaryButton>
    </template>
  </Dialog>
</template>
