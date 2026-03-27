<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    page: number;
    totalPages: number;
    disabled?: boolean;
    showFirstLast?: boolean;
  }>(),
  {
    disabled: false,
    showFirstLast: true,
  },
);

const emit = defineEmits<{
  change: [page: number];
}>();

const normalizedTotalPages = computed(() => Math.max(1, props.totalPages || 1));
const canPrevPage = computed(() => props.page > 1);
const canNextPage = computed(() => props.page < normalizedTotalPages.value);

function goTo(targetPage: number) {
  if (props.disabled) {
    return;
  }

  const nextPage = Math.min(
    Math.max(targetPage, 1),
    normalizedTotalPages.value,
  );
  if (nextPage === props.page) {
    return;
  }

  emit("change", nextPage);
}
</script>

<template>
  <div class="pagination-actions">
    <button
      v-if="showFirstLast"
      class="pager-btn"
      :disabled="!canPrevPage || disabled"
      @click="goTo(1)"
    >
      首页
    </button>
    <button
      class="pager-btn"
      :disabled="!canPrevPage || disabled"
      @click="goTo(page - 1)"
    >
      上一页
    </button>
    <div class="pager-current">第 {{ page }} / {{ normalizedTotalPages }} 页</div>
    <button
      class="pager-btn"
      :disabled="!canNextPage || disabled"
      @click="goTo(page + 1)"
    >
      下一页
    </button>
    <button
      v-if="showFirstLast"
      class="pager-btn"
      :disabled="!canNextPage || disabled"
      @click="goTo(normalizedTotalPages)"
    >
      末页
    </button>
  </div>
</template>

<style scoped>
.pagination-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.pager-current {
  min-width: 6rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--foreground-muted);
}

.pager-btn {
  height: 1.85rem;
  padding: 0 0.6rem;
  border: 1px solid rgb(0 104 119 / 0.2);
  border-radius: 999px;
  background: #fff;
  color: var(--foreground);
  font-size: 0.78rem;
  cursor: pointer;
  transition: background-color 150ms;
}

.pager-btn:hover:not(:disabled) {
  background: rgb(0 104 119 / 0.05);
}

.pager-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
</style>
