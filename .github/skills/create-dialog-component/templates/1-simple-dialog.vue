<!-- 
Simple Dialog Pattern (ConfirmDialog)
File: src/components/dialog/commonDialog/YourDialog.vue
Returns: void (finish) or void (close)
Use: Yes/No confirmation, simple message, info dialogs
-->

<template>
  <Dialog :dialog :title :width resolve-by-enter>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
    </template>
    <template #footer>
      <Button @click="cancel()">{{ $t("cancel") }}</Button>
      <Button @click="resolve()" :type="okType">{{ okText }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { type AnyDialogType } from "../dialog";

const props = withDefaults(
  defineProps<{
    dialog: AnyDialogType;
    title?: string | null;
    content?: string | null;
    width?: string;
    okText?: string;
    okType?: "primary" | "danger";
  }>(),
  {
    width: "280px",
    okText: "OK",
    okType: "primary",
  },
);

function resolve() {
  return props.dialog.finish();
}

function cancel() {
  return props.dialog.close();
}
</script>
