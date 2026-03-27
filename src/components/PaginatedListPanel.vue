<script setup lang="ts">
import { computed } from "vue";
import PaginationControls from "@/components/PaginationControls.vue";

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    error?: string | null;
    hasData: boolean;
    itemsCount: number;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    disabled?: boolean;
    loadingText?: string;
    emptyText?: string;
    maxHeight?: string;
  }>(),
  {
    loading: false,
    error: null,
    disabled: false,
    loadingText: "加载中...",
    emptyText: "暂无数据",
    maxHeight: "min(60vh, 34rem)",
  },
);

const emit = defineEmits<{
  pageChange: [page: number];
}>();

const displayRange = computed(() => {
  if (props.total <= 0 || props.itemsCount <= 0) {
    return { start: 0, end: 0 };
  }

  const start = (props.page - 1) * props.pageSize + 1;
  const end = Math.min(start + props.itemsCount - 1, props.total);
  return { start, end };
});

function handlePageChange(nextPage: number) {
  emit("pageChange", nextPage);
}
</script>

<template>
  <div v-if="loading" class="state">{{ loadingText }}</div>
  <div v-else-if="error" class="state state-error">{{ error }}</div>
  <div v-else-if="!hasData" class="state state-empty">{{ emptyText }}</div>

  <div v-else class="table-wrap" :style="{ maxHeight }">
    <slot />

    <div class="pagination-wrap">
      <div class="pagination-summary">
        <slot name="summary" :display-range="displayRange">
          共 {{ total.toLocaleString("zh-CN") }} 条，当前第
          {{ displayRange.start.toLocaleString("zh-CN") }} -
          {{ displayRange.end.toLocaleString("zh-CN") }} 条
        </slot>
      </div>

      <PaginationControls
        :page="page"
        :total-pages="totalPages"
        :disabled="disabled"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.state {
  min-height: 14rem;
  display: grid;
  place-items: center;
  color: var(--foreground-muted);
  font-size: 0.9rem;
}

.state-error {
  color: #c0392b;
}

.state-empty {
  color: var(--foreground-muted);
}

.table-wrap {
  overflow: auto;
  border-radius: 0.85rem;
  border: 1px solid rgb(0 104 119 / 0.16);
  background: rgb(255 255 255 / 0.68);
}

.pagination-wrap {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-top: 1px solid rgb(0 104 119 / 0.12);
  background: rgb(246 250 252 / 0.98);
}

.pagination-summary {
  color: var(--foreground-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .table-wrap {
    max-height: min(56vh, 30rem) !important;
  }

  .pagination-wrap {
    flex-direction: column;
    align-items: flex-end;
  }

  .pagination-summary {
    width: 100%;
    text-align: left;
  }
}
</style>
