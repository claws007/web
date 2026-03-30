<script setup lang="ts">
import { computed } from "vue";

interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface Props {
  items: TabItem[];
  modelValue?: string;
  variant?: "default" | "icon";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const activeId = computed({
  get: () => props.modelValue || props.items[0]?.id || "",
  set: (value: string) => {
    emit("update:modelValue", value);
    emit("change", value);
  },
});

const handleTabClick = (tab: TabItem) => {
  if (!tab.disabled) {
    activeId.value = tab.id;
  }
};

const isIconVariant = computed(() => props.variant === "icon");

const getTabClass = (tab: TabItem) => {
  const isActive = activeId.value === tab.id;

  return [
    "group relative -mb-px inline-flex items-center justify-center gap-2 rounded-t-sm border border-transparent bg-transparent text-sm font-medium text-foreground-muted transition-all duration-300 ease-crystal outline-none",
    isIconVariant.value ? "flex-col gap-1 px-4 py-2" : "px-5 py-2",
    tab.disabled
      ? "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-foreground-muted"
      : "cursor-pointer hover:bg-primary/10 hover:text-primary",
    isActive
      ? "bg-surface-container-lowest text-primary shadow-[inset_0_-2px_0_var(--primary)]"
      : "",
  ];
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2 border-b border-outline-ghost">
      <button
        v-for="tab in items"
        :key="tab.id"
        type="button"
        :class="getTabClass(tab)"
        :disabled="tab.disabled"
        @click="handleTabClick(tab)"
      >
        <span
          v-if="tab.icon"
          class="inline-flex items-center justify-center text-[1.25rem]"
        >
          {{ tab.icon }}
        </span>
        <span v-if="variant === 'default'" class="whitespace-nowrap">{{
          tab.label
        }}</span>
        <span
          v-if="variant === 'icon'"
          class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-surface-container-low px-3 py-2 text-xs text-foreground opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-opacity duration-200 group-hover:opacity-100"
          >{{ tab.label }}</span
        >
      </button>
    </div>
  </div>
</template>
