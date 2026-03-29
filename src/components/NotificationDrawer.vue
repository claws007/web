<script setup lang="ts">
import { api, type NotificationResponse } from "@/api";
import { computed, onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const tabItems = [
  { id: "pending", label: "未处理" },
  { id: "resolved", label: "已处理" },
];

const activeTab = ref<"pending" | "resolved">("pending");
const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<NotificationResponse[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);

const isPendingTab = computed(() => activeTab.value === "pending");
const hasData = computed(() => items.value.length > 0);
const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function normalizeContent(content: string) {
  return content?.trim() || "-";
}

function getTypeLabel(type: NotificationResponse["type"]) {
  const map: Record<NotificationResponse["type"], string> = {
    REQUEST_INPUT: "输入请求",
    REQUEST_SELECT_SINGLE: "单选请求",
    REQUEST_SELECT_MULTI: "多选请求",
    REQUEST_CONFIRM: "确认请求",
    COMMAND_PROGRESS: "命令进度",
    AGENT_TASK_RESULT: "任务结果",
  };
  return map[type] || type;
}

async function loadNotifications(targetPage = page.value) {
  loading.value = true;
  error.value = null;

  try {
    const res = await api.notification.getNotification({
      page: targetPage,
      pageSize: pageSize.value,
      pending: isPendingTab.value,
    });

    items.value = res.data.items || [];
    page.value = res.data.page || targetPage;
    pageSize.value = res.data.pageSize || pageSize.value;
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 0;
  } catch (err) {
    items.value = [];
    total.value = 0;
    totalPages.value = 0;
    error.value = err instanceof Error ? err.message : "通知加载失败";
  } finally {
    loading.value = false;
  }
}

function handlePageChange(nextPage: number) {
  if (nextPage === page.value) {
    return;
  }
  void loadNotifications(nextPage);
}

function closeDrawer() {
  drawerVisible.value = false;
}

function syncGlobalNotificationVisibility(open: boolean) {
  document.body.classList.toggle("notification-drawer-open", open);
}

watch(
  () => props.modelValue,
  (open) => {
    syncGlobalNotificationVisibility(Boolean(open));
    if (open) {
      void loadNotifications(1);
    }
  },
  { immediate: true },
);

watch(activeTab, () => {
  if (!props.modelValue) {
    return;
  }
  void loadNotifications(1);
});

onUnmounted(() => {
  syncGlobalNotificationVisibility(false);
});
</script>

<template>
  <Drawer v-model="drawerVisible" width="38rem">
    <template #header>
      <div class="notify-drawer-header">
        <div>
          <h3 class="notify-drawer-title">通知中心</h3>
          <p class="notify-drawer-subtitle">支持分页查看未处理与已处理通知</p>
        </div>
        <button class="notify-close" type="button" @click="closeDrawer">
          关闭
        </button>
      </div>
    </template>

    <Tabs v-model="activeTab" :items="tabItems" />

    <div class="notify-body">
      <PaginatedListPanel
        :loading="loading"
        :error="error"
        :has-data="hasData"
        :items-count="items.length"
        :page="page"
        :page-size="pageSize"
        :total="total"
        :total-pages="totalPages"
        empty-text="暂无通知"
        loading-text="正在加载通知..."
        @page-change="handlePageChange"
      >
        <ul class="notify-list">
          <li v-for="item in items" :key="item.id" class="notify-item">
            <div class="notify-item-top">
              <div class="notify-item-title-wrap">
                <h4 class="notify-item-title">
                  {{ item.title || "未命名通知" }}
                </h4>
                <span class="notify-item-type">{{
                  getTypeLabel(item.type)
                }}</span>
              </div>
              <span
                class="notify-item-state"
                :class="item.state === 'PENDING' ? 'is-pending' : 'is-resolved'"
              >
                {{ item.state === "PENDING" ? "未处理" : "已处理" }}
              </span>
            </div>

            <p class="notify-item-content">
              {{ normalizeContent(item.content) }}
            </p>

            <div class="notify-item-meta">
              <span>更新时间：{{ formatDateTime(item.updatedAt) }}</span>
              <span v-if="item.resolvedAt">
                处理时间：{{ formatDateTime(item.resolvedAt) }}
              </span>
            </div>
          </li>
        </ul>
      </PaginatedListPanel>
    </div>
  </Drawer>
</template>

<style scoped>
.notify-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.notify-drawer-title {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--foreground);
}

.notify-drawer-subtitle {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--foreground-muted);
}

.notify-close {
  height: 2rem;
  border: 1px solid rgb(0 104 119 / 0.2);
  background: #fff;
  color: var(--foreground);
  border-radius: 999px;
  padding: 0 0.75rem;
  font-size: 0.78rem;
  cursor: pointer;
}

.notify-body {
  margin-top: 0.75rem;
}

.notify-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notify-item {
  border-bottom: 1px solid rgb(0 104 119 / 0.12);
  padding: 0.8rem 0.9rem;
}

.notify-item:last-child {
  border-bottom: none;
}

.notify-item-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.notify-item-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.notify-item-title {
  margin: 0;
  font-size: 0.92rem;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notify-item-type {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgb(0 104 119 / 0.18);
  background: rgb(0 104 119 / 0.06);
  color: var(--primary);
  font-size: 0.7rem;
  padding: 0.08rem 0.45rem;
}

.notify-item-state {
  flex-shrink: 0;
  font-size: 0.72rem;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.notify-item-state.is-pending {
  color: #b45309;
  background: rgb(251 191 36 / 0.16);
  border-color: rgb(251 191 36 / 0.35);
}

.notify-item-state.is-resolved {
  color: #166534;
  background: rgb(34 197 94 / 0.14);
  border-color: rgb(34 197 94 / 0.34);
}

.notify-item-content {
  margin: 0.55rem 0;
  font-size: 0.84rem;
  color: var(--foreground);
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.notify-item-meta {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  font-size: 0.74rem;
  color: var(--foreground-muted);
}

@media (max-width: 768px) {
  .notify-item-top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
