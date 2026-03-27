<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Input from "@/components/Input.vue";
import PaginatedListPanel from "@/components/PaginatedListPanel.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import type { SelectorItem } from "@/components/Selector.vue";

export type SelectOptionDialogOption = SelectorItem & {
  keywords?: string[];
};

export type SelectOptionDialogSearchParams = {
  keyword: string;
  rawKeyword: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
};

export type SelectOptionDialogSearchResult = {
  items: SelectOptionDialogOption[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    options?: SelectOptionDialogOption[];
    fetchOptions?: (
      params: SelectOptionDialogSearchParams,
    ) => Promise<SelectOptionDialogSearchResult | SelectOptionDialogOption[]>;
    modelValue?: string | number | null;
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
    title: "选择选项",
    description: "可按关键字检索后分页选择",
    options: () => [],
    modelValue: null,
    pageSize: 10,
    searchPlaceholder: "请输入关键字",
    emptyText: "暂无可选项",
    loadingText: "加载中...",
    noSearchHintText: "请输入更多关键字后再搜索",
    minKeywordLength: 0,
    debounceMs: 500,
    width: "46rem",
    searchOnInput: true,
    allowEmptyKeyword: true,
  },
);

const visible = ref(true);
const closing = ref(false);
const keyword = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<SelectOptionDialogOption[]>([]);
const page = ref(1);
const pageSize = ref(props.pageSize);
const total = ref(0);
const totalPages = ref(1);
const selectedId = ref<string | number | null>(props.modelValue);

const { resolve, reject } = useDialogContext<SelectOptionDialogOption>();
defineExpose(createDialogExpose<SelectOptionDialogOption>());

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let requestSeq = 0;
let activeAbortController: AbortController | null = null;

const canSearchNow = computed(() => {
  if (props.allowEmptyKeyword && normalizedKeyword.value.length === 0) {
    return true;
  }
  return normalizedKeyword.value.length >= props.minKeywordLength;
});

const selectedItem = computed(() => {
  if (selectedId.value === null || selectedId.value === undefined) {
    return null;
  }
  return items.value.find((item) => item.id === selectedId.value) ?? null;
});

const normalizedKeyword = computed(() => {
  const raw = keyword.value;
  if (props.normalizeKeyword) {
    return props.normalizeKeyword(raw);
  }
  return raw.trim();
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

function onModelValueChange(next: boolean) {
  if (!next) {
    cancel();
  }
}

function clearDebounce() {
  if (!debounceTimer) {
    return;
  }
  clearTimeout(debounceTimer);
  debounceTimer = null;
}

function clearResult() {
  items.value = [];
  total.value = 0;
  totalPages.value = 1;
  page.value = 1;
  error.value = null;
}

function defaultLocalSearch(
  sourceOptions: SelectOptionDialogOption[],
  kw: string,
): SelectOptionDialogOption[] {
  if (!kw) {
    return sourceOptions;
  }

  const lowerKeyword = kw.toLowerCase();
  return sourceOptions.filter((item) => {
    const candidates = [
      String(item.id),
      item.label,
      item.description || "",
      ...(item.keywords || []),
    ];
    return candidates.some((value) =>
      value.toLowerCase().includes(lowerKeyword),
    );
  });
}

async function executeSearch(targetPage = 1) {
  const searchKeyword = normalizedKeyword.value;

  if (!canSearchNow.value) {
    clearResult();
    return;
  }

  const queryContext = {
    keyword: searchKeyword,
    rawKeyword: keyword.value,
    page: targetPage,
    pageSize: pageSize.value,
  };

  if (props.canSearch) {
    const allowed = await props.canSearch(queryContext);
    if (!allowed) {
      clearResult();
      return;
    }
  }

  loading.value = true;
  error.value = null;

  const currentRequest = ++requestSeq;

  try {
    if (props.fetchOptions) {
      activeAbortController?.abort();
      activeAbortController = new AbortController();

      const result = await props.fetchOptions({
        ...queryContext,
        signal: activeAbortController.signal,
      });

      if (currentRequest !== requestSeq) {
        return;
      }

      const normalizedResult = Array.isArray(result)
        ? { items: result }
        : result;

      const nextItems = normalizedResult.items || [];
      const nextPageSize = normalizedResult.pageSize || pageSize.value;
      const nextTotal = normalizedResult.total ?? nextItems.length;
      const nextTotalPages =
        normalizedResult.totalPages ||
        Math.max(1, Math.ceil(nextTotal / nextPageSize));
      const nextPage = Math.min(
        Math.max(normalizedResult.page || targetPage, 1),
        Math.max(nextTotalPages, 1),
      );

      items.value = nextItems;
      page.value = nextPage;
      pageSize.value = nextPageSize;
      total.value = nextTotal;
      totalPages.value = Math.max(nextTotalPages, 1);
      return;
    }

    const source = props.options || [];
    const filtered = props.localSearch
      ? props.localSearch(source, searchKeyword)
      : defaultLocalSearch(source, searchKeyword);

    const calculatedTotal = filtered.length;
    const calculatedTotalPages = Math.max(
      1,
      Math.ceil(calculatedTotal / pageSize.value),
    );
    const nextPage = Math.min(Math.max(targetPage, 1), calculatedTotalPages);
    const start = (nextPage - 1) * pageSize.value;
    const end = start + pageSize.value;

    items.value = filtered.slice(start, end);
    page.value = nextPage;
    total.value = calculatedTotal;
    totalPages.value = calculatedTotalPages;
  } catch (cause) {
    if (currentRequest !== requestSeq) {
      return;
    }

    if (cause instanceof DOMException && cause.name === "AbortError") {
      return;
    }

    error.value = cause instanceof Error ? cause.message : "加载选项失败";
    items.value = [];
    total.value = 0;
    totalPages.value = 1;
  } finally {
    if (currentRequest === requestSeq) {
      loading.value = false;
    }
  }
}

function scheduleSearch(targetPage = 1) {
  const interval = Math.max(props.debounceMs, 0);
  clearDebounce();

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void executeSearch(targetPage);
  }, interval);
}

function handlePageChange(nextPage: number) {
  void executeSearch(nextPage);
}

function handleSelect(item: SelectOptionDialogOption) {
  if (item.disabled) {
    return;
  }
  selectedId.value = item.id;
}

function confirmSelection() {
  if (!selectedItem.value) {
    return;
  }
  if (selectedItem.value.disabled) {
    return;
  }
  close(() => resolve(selectedItem.value!));
}

watch(
  () => props.modelValue,
  (next) => {
    selectedId.value = next;
  },
  { immediate: true },
);

watch(
  () => keyword.value,
  () => {
    if (!props.searchOnInput) {
      return;
    }
    scheduleSearch(1);
  },
);

onMounted(() => {
  void executeSearch(1);
});

onUnmounted(() => {
  clearDebounce();
  activeAbortController?.abort();
});
</script>

<template>
  <Dialog
    v-model="visible"
    :width="width"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="dialog-header-wrap">
        <div class="dialog-title">{{ title }}</div>
        <div v-if="description" class="dialog-description">
          {{ description }}
        </div>
      </div>
    </template>

    <div class="toolbar">
      <Input v-model="keyword" :placeholder="searchPlaceholder" label="搜索" />
    </div>

    <div v-if="!canSearchNow" class="tip">{{ noSearchHintText }}</div>

    <PaginatedListPanel
      :loading="loading"
      :error="error"
      :has-data="items.length > 0"
      :items-count="items.length"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :total-pages="totalPages"
      :disabled="loading"
      :loading-text="loadingText"
      :empty-text="emptyText"
      :max-height="'46vh'"
      @page-change="handlePageChange"
    >
      <table class="option-table">
        <thead>
          <tr>
            <th class="cell-main">选项</th>
            <th class="cell-desc">描述</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="String(item.id)"
            class="option-row"
            :class="{
              selected: selectedId === item.id,
              disabled: item.disabled,
            }"
            @click="handleSelect(item)"
          >
            <td class="cell-main">
              <div class="main-label">{{ item.label }}</div>
              <div class="sub-id">#{{ item.id }}</div>
            </td>
            <td class="cell-desc">{{ item.description || "-" }}</td>
          </tr>
        </tbody>
      </table>
    </PaginatedListPanel>

    <template #footer>
      <Button @click="cancel">取 消</Button>
      <PrimaryButton
        :disabled="!selectedItem || !!selectedItem?.disabled"
        @click="confirmSelection"
      >
        选 择
      </PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-header-wrap {
  display: grid;
  gap: 0.25rem;
}

.dialog-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
}

.dialog-description {
  font-size: 0.82rem;
  color: var(--foreground-muted);
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.7rem;
  align-items: end;
  margin-bottom: 0.75rem;
}

.tip {
  margin-bottom: 0.75rem;
  border-radius: 0.6rem;
  background: rgb(90 102 109 / 0.1);
  color: var(--foreground-muted);
  font-size: 0.8rem;
  padding: 0.45rem 0.65rem;
}

.option-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.option-table th,
.option-table td {
  padding: 0.62rem 0.75rem;
  border-bottom: 1px solid rgb(0 104 119 / 0.1);
  text-align: left;
  vertical-align: middle;
}

.option-row {
  cursor: pointer;
  transition: background-color 140ms;
}

.option-row:hover {
  background: rgb(0 104 119 / 0.05);
}

.option-row.selected {
  background: rgb(0 104 119 / 0.1);
}

.option-row.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.main-label {
  font-weight: 600;
  color: var(--foreground);
}

.sub-id {
  font-size: 0.72rem;
  color: var(--foreground-muted);
}

.cell-main {
  width: 38%;
}

.cell-desc {
  width: 62%;
  color: var(--foreground-muted);
}

@media (max-width: 820px) {
  .toolbar {
    grid-template-columns: 1fr;
  }

  .option-table {
    font-size: 0.82rem;
  }
}
</style>
