<!--
Input Dialog Pattern
File: src/components/dialog/commonDialog/YourInputDialog.vue
Returns: string
Use: Single text input, password, email, number input
-->

<template>
  <Dialog :dialog :title :width>
    <template #autoPadding>
      <div v-if="content" class="text-light mb-4">
        {{ content }}
      </div>
      <Input
        v-model="inputValue"
        v-focus
        :type
        :placeholder
        :disabled
        @keypress.enter="dialog.finish(inputValue)"
        class="text-md size-full resize-none bg-transparent outline-none"
      />
      <div v-if="quickOptions.length" class="h gap-2 text-xs mt-3">
        <div
          v-for="option in quickOptions"
          :key="option.value"
          @click="inputValue = option.value"
          :class="[
            'cursor-pointer rounded border px-2 py-1 duration-300 hover:opacity-75',
            option.danger ? 'bg-danger border-0 text-white' : '',
            option.primary ? 'bg-primary border-0 text-white' : '',
          ]"
        >
          {{ option.label }}
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish(inputValue)" type="primary">
        {{ $t("resolve") }}
      </Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DialogType } from "../dialog";

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, string>;
    title?: string | null;
    content?: string | null;
    value?: string | null;
    placeholder?: string;
    type?: "text" | "password" | "email" | "number";
    disabled?: boolean;
    width?: string;
    quickOptions?: Array<{
      label: string;
      value: string;
      danger?: boolean;
      primary?: boolean;
    }>;
  }>(),
  {
    width: "350px",
    type: "text",
    quickOptions: () => [],
  },
);

const inputValue = ref(props.value || "");
</script>
