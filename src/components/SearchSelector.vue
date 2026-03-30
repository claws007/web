<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import Input from "@/components/Input.vue";
import Dropdown from "@/components/Dropdown.vue";
import type { SelectorItem } from "@/components/Selector.vue";

interface Props {
  modelValue?: string | null;
  search: (keyword: string) => Promise<SelectorItem[]>;
  strict?: boolean;
  label?: string;
  placeholder?: string;
  selectorPlaceholder?: string;
  emptyText?: string;
  minKeywordLength?: number;
  debounceMs?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  strict: false,
  label: "搜索",
  placeholder: "请输入关键字搜索",
  selectorPlaceholder: "请选择搜索结果",
  emptyText: "暂无结果",
  minKeywordLength: 1,
  debounceMs: 300,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string, item?: SelectorItem];
}>();

const keyword = ref(props.modelValue || "");
const loading = ref(false);
const items = ref<SelectorItem[]>([]);
const selectedId = ref<string | number | null>(null);
const isOpen = ref(false);
const hasSearched = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const triggerWidth = ref(0);
const panelMaxHeight = ref(320);

let searchTimer: number | null = null;
let searchSeq = 0;
let suppressNextKeywordSearch = false;
const MIN_DROPDOWN_WIDTH = 320;
const MIN_DROPDOWN_HEIGHT = 160;
const FLOAT_OFFSET = 8;
const VIEWPORT_PADDING = 8;
let resizeObserver: ResizeObserver | null = null;

const selectedItem = computed(
  () => items.value.find((item) => item.id === selectedId.value) ?? null,
);

watch(
  () => props.modelValue,
  (next) => {
    const nextValue = next || "";
    if (keyword.value !== nextValue) {
      suppressNextKeywordSearch = true;
      keyword.value = nextValue;
    }

    if (!nextValue) {
      selectedId.value = null;
      return;
    }

    const hit = items.value.find((item) => String(item.id) === nextValue);
    if (hit) {
      selectedId.value = hit.id;
    } else if (!props.strict) {
      selectedId.value = nextValue;
    }
  },
  { immediate: true },
);

watch(
  () => keyword.value,
  (next) => {
    if (suppressNextKeywordSearch) {
      suppressNextKeywordSearch = false;
      return;
    }

    if (!props.strict) {
      emit("update:modelValue", next);
      emit("change", next);
    }

    if (searchTimer !== null) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }

    const query = next.trim();
    if (query.length < props.minKeywordLength) {
      items.value = [];
      hasSearched.value = false;
      isOpen.value = false;
      if (props.strict) {
        selectedId.value = null;
      }
      return;
    }

    searchTimer = window.setTimeout(() => {
      void performSearch(query);
    }, props.debounceMs);
  },
  { immediate: true },
);

async function performSearch(query: string) {
  const currentSeq = ++searchSeq;
  loading.value = true;
  hasSearched.value = true;
  isOpen.value = false;
  try {
    const result = await props.search(query);
    if (currentSeq !== searchSeq) {
      return;
    }

    items.value = result;

    if (props.strict) {
      const hit = result.find(
        (item) => String(item.id) === (props.modelValue || ""),
      );
      selectedId.value = hit?.id ?? null;
    }
  } finally {
    if (currentSeq === searchSeq) {
      loading.value = false;
      const currentQuery = keyword.value.trim();
      if (currentQuery.length >= props.minKeywordLength) {
        isOpen.value = true;
      }
    }
  }
}

function handleSelectChange(value: string | number, item: SelectorItem) {
  const selected = String(value);
  selectedId.value = value;
  suppressNextKeywordSearch = true;
  keyword.value = selected;
  isOpen.value = false;
  emit("update:modelValue", selected);
  emit("change", selected, item);
}

const selectedLabel = computed(() => {
  if (selectedItem.value) {
    return selectedItem.value.label;
  }

  if (!props.strict && keyword.value.trim()) {
    return keyword.value.trim();
  }

  return "";
});

const hasKeyword = computed(() => keyword.value.trim().length > 0);

function openDropdownFromInput() {
  if (loading.value) {
    return;
  }

  const query = keyword.value.trim();
  if (query.length < props.minKeywordLength || !hasSearched.value) {
    return;
  }

  isOpen.value = true;
}

const dropdownMinWidth = computed(() => {
  return Math.max(triggerWidth.value, MIN_DROPDOWN_WIDTH);
});

const dropdownPanelStyle = computed<CSSProperties>(() => {
  return {
    minWidth: `${dropdownMinWidth.value}px`,
    maxWidth: "min(92vw, 36rem)",
    maxHeight: `${panelMaxHeight.value}px`,
    overflowY: "auto" as const,
  };
});

function updateTriggerMetrics() {
  const rect = triggerRef.value?.getBoundingClientRect();
  if (!rect) {
    return;
  }

  triggerWidth.value = Math.round(rect.width);

  const availableToBottom =
    window.innerHeight - rect.bottom - FLOAT_OFFSET - VIEWPORT_PADDING;
  panelMaxHeight.value = Math.max(
    MIN_DROPDOWN_HEIGHT,
    Math.floor(availableToBottom),
  );
}

onMounted(() => {
  updateTriggerMetrics();

  if (triggerRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      updateTriggerMetrics();
    });
    resizeObserver.observe(triggerRef.value);
  }

  window.addEventListener("resize", updateTriggerMetrics, { passive: true });
  window.addEventListener("scroll", updateTriggerMetrics, {
    passive: true,
    capture: true,
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  window.removeEventListener("resize", updateTriggerMetrics);
  window.removeEventListener("scroll", updateTriggerMetrics, {
    capture: true,
  });
});
</script>

<template>
  <div class="grid gap-2">
    <div class="grid gap-1.5">
      <Dropdown
        v-model="isOpen"
        placement="bottom"
        :disable-flip="true"
        :close-on-content-click="false"
        :trigger-on-click="false"
        :panel-style="dropdownPanelStyle"
      >
        <template #trigger="{ open }">
          <div
            ref="triggerRef"
            class="relative w-full"
            @mousedown="openDropdownFromInput"
            @focusin="openDropdownFromInput"
          >
            <Input v-model="keyword" :label="label" :placeholder="placeholder">
              <template v-if="hasKeyword" #icon>
                <span
                  class="inline-flex h-4 w-4 items-center justify-center text-primary transition-transform duration-200 ease-crystal"
                >
                  <svg
                    v-if="loading"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    class="search-loading-spinner h-full w-full fill-none stroke-current stroke-2"
                  >
                    <circle cx="12" cy="12" r="9" class="opacity-25" />
                    <path d="M21 12a9 9 0 0 0-9-9" class="opacity-95" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    class="h-full w-full fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]"
                    :class="{ 'rotate-180': open }"
                  >
                    <path d="M3 6.5 8 11l5-4.5" />
                  </svg>
                </span>
              </template>
            </Input>
          </div>
        </template>

        <template #default>
          <div class="flex flex-col gap-1 p-1">
            <div
              v-if="!loading && items.length === 0"
              class="rounded-md border border-dashed border-[color-mix(in_srgb,var(--outline-ghost)_78%,white)] bg-[color-mix(in_srgb,var(--surface)_86%,white)] px-3 py-4 text-center text-sm text-foreground-muted"
            >
              {{ emptyText }}
            </div>

            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-left transition-colors duration-200 ease-crystal hover:bg-black/5"
              :class="{
                'bg-[color-mix(in_srgb,var(--secondary-soft)_70%,white)]':
                  selectedItem?.id === item.id,
                'cursor-not-allowed opacity-45 hover:bg-transparent':
                  item.disabled,
              }"
              :disabled="item.disabled"
              @click="handleSelectChange(item.id, item)"
            >
              <span class="min-w-0">
                <span class="block truncate text-sm text-foreground">{{
                  item.label
                }}</span>
                <span
                  v-if="item.description"
                  class="mt-0.5 block truncate text-xs text-foreground-muted"
                >
                  {{ item.description }}
                </span>
              </span>

              <span
                class="h-4 w-4 text-[color-mix(in_srgb,var(--secondary)_70%,black)] opacity-0 transition-opacity duration-200"
                :class="{ 'opacity-100': selectedItem?.id === item.id }"
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  class="h-full w-full fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]"
                >
                  <path d="m3.2 8.4 2.8 2.8 6-6" />
                </svg>
              </span>
            </button>
          </div>
        </template>
      </Dropdown>

      <div v-if="selectedLabel" class="text-xs text-foreground-muted">
        当前值：{{ selectedLabel }}
      </div>

      <div v-if="!strict" class="text-xs text-[rgb(66_95_105/0.9)]">
        可直接输入任意值或选择搜索结果
      </div>
      <div
        v-if="selectedItem?.description"
        class="text-xs text-[rgb(47_62_69/0.9)]"
      >
        {{ selectedItem.description }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-loading-spinner {
  animation: search-selector-spin 0.8s linear infinite;
}

@keyframes search-selector-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
