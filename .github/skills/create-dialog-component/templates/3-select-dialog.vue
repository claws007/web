<!--
Select/List Dialog Pattern
File: src/components/dialog/commonDialog/YourSelectDialog.vue
Returns: T (selected item)
Use: Pick from list, option selection, radio buttons
-->

<template>
  <Dialog :dialog="dialog" :title="title ?? $t('select')" :width>
    <template #autoPadding>
      <div class="flex flex-col gap-2">
        <div
          v-for="option in options"
          :key="option.id"
          class="bg-light-2 cursor-pointer rounded p-3 duration-300 hover:opacity-80 active:opacity-60"
          @click="dialog.finish(option)"
        >
          <!-- Simple option display -->
          <div class="font-medium">{{ option.name }}</div>
          <div v-if="option.description" class="text-xs text-gray-500">
            {{ option.description }}
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type DialogType } from "@/components/dialog/dialog";

type Option = {
  name?: string;
  id?: string | number | symbol;
  description?: string;
  [key: string]: any;
};

withDefaults(
  defineProps<{
    dialog: DialogType<any, Option>;
    title?: string;
    width?: string;
    options?: Option[];
  }>(),
  {
    width: "350px",
    options: () => [],
  },
);
</script>
