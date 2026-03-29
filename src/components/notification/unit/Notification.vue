<script setup lang="ts">
import type { NotificationResponse } from "@/api";
import Toast from "./Toast.vue";
import ProgressTaskCard from "./ProgressTask.vue";
import RequestInput from "./RequestInput.vue";
import AgentTaskResult from "./AgentTaskResult.vue";
import type {
  NotificationEntry,
  ProgressTask,
  RequestInputItem,
  ToastItem,
} from "../types";

function isAgentTaskResultEntry(
  entry: NotificationEntry,
): entry is RequestInputItem {
  return entry.kind === "request" && entry.source.type === "AGENT_TASK_RESULT";
}

function resolveAgentTaskResult(
  entry: NotificationEntry,
): NotificationResponse | null {
  if (!isAgentTaskResultEntry(entry)) {
    return null;
  }
  return entry.source;
}

defineProps<{
  entry: NotificationEntry;
  closing: boolean;
}>();
</script>

<template>
  <Toast
    v-if="entry.kind === 'toast'"
    :entry="entry as ToastItem"
    :closing="closing"
  />
  <ProgressTaskCard
    v-else-if="entry.kind === 'progress'"
    :entry="entry as ProgressTask"
    :closing="closing"
  />
  <AgentTaskResult
    v-else-if="isAgentTaskResultEntry(entry)"
    :entry="resolveAgentTaskResult(entry)!"
    :closing="closing"
  />
  <RequestInput v-else :entry="entry as RequestInputItem" :closing="closing" />
</template>
