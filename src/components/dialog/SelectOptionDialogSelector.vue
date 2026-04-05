<script setup lang="ts">
import { computed } from "vue";
import { dialogs } from "virtual:dialogs";
import type {
  SelectOptionDialogOption,
  SelectOptionDialogSearchParams,
  SelectOptionDialogSearchResult,
} from "@/components/dialog/SelectOptionDialog.vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue?: string | number | null;
    enabled?: boolean;
    selectedPrefix?: string;
    enabledPlaceholder?: string;
    disabledPlaceholder?: string;
    title?: string;
    description?: string;
    options?: SelectOptionDialogOption[];
    fetchOptions?: (
      params: SelectOptionDialogSearchParams,
    ) => Promise<SelectOptionDialogSearchResult | SelectOptionDialogOption[]>;
    pageSize?: number;
    searchPlaceholder?: string;
    emptyText?: string;
    loadingText?: string;
    noSearchHintText?: string;
    minKeywordLength?: number;
    debounceMs?: number;
    width?: string;
    searchOnInput?: boolean;
    allowEmptyKeyword?: boolean;
    normalizeKeyword?: (keyword: string) => string;
    canSearch?: (
      params: Omit<SelectOptionDialogSearchParams, "signal">,
    ) => boolean | Promise<boolean>;
    localSearch?: (
      options: SelectOptionDialogOption[],
      keyword: string,
    ) => SelectOptionDialogOption[];
  }>(),
  {
    label: "选择项",
    modelValue: null,
    enabled: true,
    selectedPrefix: "已选择：",
    enabledPlaceholder: "请选择",
    disabledPlaceholder: "请先启用",
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string | number | null): void;
  (event: "change", value: string | number | null): void;
}>();

const displayText = computed(() => {
  const value = String(props.modelValue ?? "").trim();
  if (value) {
    return `${props.selectedPrefix}${value}`;
  }
  return props.enabled ? props.enabledPlaceholder : props.disabledPlaceholder;
});

const textClass = computed(() => {
  return props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue !== ""
    ? "text-foreground"
    : "text-[color-mix(in_srgb,var(--foreground)_55%,white)]";
});

async function handleTrigger() {
  if (!props.enabled) {
    return;
  }

  const result = await dialogs.SelectOptionDialog({
    title: props.title,
    description: props.description,
    options: props.options,
    fetchOptions: props.fetchOptions,
    modelValue: props.modelValue,
    pageSize: props.pageSize,
    searchPlaceholder: props.searchPlaceholder,
    emptyText: props.emptyText,
    loadingText: props.loadingText,
    noSearchHintText: props.noSearchHintText,
    minKeywordLength: props.minKeywordLength,
    debounceMs: props.debounceMs,
    width: props.width,
    searchOnInput: props.searchOnInput,
    allowEmptyKeyword: props.allowEmptyKeyword,
    normalizeKeyword: props.normalizeKeyword,
    canSearch: props.canSearch,
    localSearch: props.localSearch,
  });

  if (result.type !== "resolve" || !result.value) {
    return;
  }

  const nextValue = result.value.id ?? null;
  emit("update:modelValue", nextValue);
  emit("change", nextValue);
}
</script>

<template>
  <div class="selector-stack">
    <label class="form-label">{{ label }}</label>
    <section class="dialog-selector-shell">
      <button
        type="button"
        class="dialog-selector-trigger"
        :disabled="!enabled"
        @click="handleTrigger"
      >
        <span class="stretch min-w-0 text-left" :class="textClass">
          {{ displayText }}
        </span>
        <span class="dialog-selector-icon" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            class="h-full w-full fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M2.5 8h11" />
            <path d="m9 4.5 3.5 3.5L9 11.5" />
          </svg>
        </span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.selector-stack {
  display: grid;
  gap: 0.45rem;
}

.dialog-selector-shell {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, white);
  border-radius: 0.55rem;
  background: transparent;
  box-shadow: 0 12px 30px rgb(0 104 119 / 0.08);
}

.dialog-selector-trigger {
  display: flex;
  width: 100%;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  padding: 0.55rem 0.75rem;
  color: var(--foreground);
  text-align: left;
  font-size: 0.95rem;
}

.dialog-selector-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.dialog-selector-icon {
  display: flex;
  height: 1.1rem;
  width: 1.1rem;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}
</style>
