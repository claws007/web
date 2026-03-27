<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type AIModelConnectorResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import PaginatedListPanel from "@/components/PaginatedListPanel.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { dialogs } from "virtual:dialogs";
import { msg } from "@/utils/message";

const visible = ref(true);
const closing = ref(false);
const loading = ref(false);
const refreshing = ref(false);
const deletingId = ref<number | null>(null);
const connectors = ref<AIModelConnectorResponse[]>([]);
const error = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);
const { reject } = useDialogContext<void>();

defineExpose(createDialogExpose<void>());

const hasData = computed(() => connectors.value.length > 0);

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

function onModelValueChange(value: boolean) {
  if (!value) {
    cancel();
  }
}

function prettyNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  return value.toLocaleString("zh-CN");
}

function getApiKeyPreview(connector: AIModelConnectorResponse): string {
  const raw = String(connector.params?.apiKey ?? "").trim();
  if (!raw) {
    return "未配置";
  }

  if (raw.length <= 8) {
    return "已配置";
  }

  return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
}

async function loadConnectors(useSoftLoading = false, targetPage = page.value) {
  const safePage = Math.max(1, targetPage);

  if (useSoftLoading) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;

  try {
    const res = await api.modelConnector.getModelConnector({
      page: safePage,
      pageSize: pageSize.value,
    });
    connectors.value = res.data.items ?? [];
    page.value = res.data.page ?? safePage;
    pageSize.value = res.data.pageSize ?? pageSize.value;
    total.value = res.data.total ?? connectors.value.length;
    totalPages.value = res.data.totalPages ?? 0;
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : "获取 Model Connector 列表失败，请稍后重试";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function handleCreate() {
  const result = await dialogs.EditOrCreateModelConnectorDialog();
  if (result.type !== "resolve") {
    return;
  }

  await loadConnectors(true, 1);
  await msg.success("Model Connector 创建成功");
}

async function handleEdit(id: number) {
  const result = await dialogs.EditOrCreateModelConnectorDialog({ id });
  if (result.type !== "resolve") {
    return;
  }

  await loadConnectors(true, page.value);
  await msg.success("Model Connector 更新成功");
}

async function handleDelete(connector: AIModelConnectorResponse) {
  const confirmed = await msg.confirm(
    `确认删除连接器「${connector.name || `#${connector.id}`}」吗？该操作不可恢复。`,
    {
      title: "删除 Model Connector",
      confirmText: "删 除",
      confirmType: "danger",
    },
  );

  if (confirmed.type !== "resolve") {
    return;
  }

  deletingId.value = connector.id;
  try {
    await api.modelConnector.deleteModelConnectorById(connector.id);
    const fallbackPage =
      connectors.value.length === 1 && page.value > 1 ? page.value - 1 : page.value;
    await loadConnectors(true, fallbackPage);
    await msg.success("Model Connector 删除成功");
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "删除 Model Connector 失败，请稍后重试";
    await msg.error(message);
  } finally {
    deletingId.value = null;
  }
}

async function handlePageChange(nextPage: number) {
  if (refreshing.value || loading.value) {
    return;
  }

  const safePage = Math.min(Math.max(nextPage, 1), Math.max(totalPages.value, 1));
  if (safePage === page.value) {
    return;
  }

  await loadConnectors(true, safePage);
}

onMounted(async () => {
  await loadConnectors();
});
</script>

<template>
  <Dialog
    v-model="visible"
    width="56rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="v gap-1">
          <div class="title">Model Connector 管理</div>
          <div class="subtitle">统一查看与维护连接器配置</div>
        </div>
        <div class="header-actions">
          <Button @click="loadConnectors(true)">刷 新</Button>
          <PrimaryButton :loading="refreshing" @click="handleCreate">
            新 建
          </PrimaryButton>
        </div>
      </div>
    </template>

    <PaginatedListPanel
      :loading="loading"
      :error="error"
      :has-data="hasData"
      :items-count="connectors.length"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :total-pages="totalPages"
      :disabled="refreshing"
      loading-text="正在加载 Model Connector 列表..."
      empty-text="暂无 Model Connector，点击右上角「新建」添加。"
      @page-change="handlePageChange"
    >
      <template #summary="{ displayRange }">
        共 {{ prettyNumber(total) }} 条，当前第 {{ prettyNumber(displayRange.start) }} -
        {{ prettyNumber(displayRange.end) }} 条
      </template>

      <table class="connector-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>类型</th>
            <th>并发</th>
            <th>API Key</th>
            <th>累计 Token</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in connectors" :key="item.id">
            <td class="mono">{{ item.id }}</td>
            <td>{{ item.name || `连接器 #${item.id}` }}</td>
            <td>{{ item.type || "-" }}</td>
            <td class="mono">{{ item.concurrency ?? 1 }}</td>
            <td class="mono">{{ getApiKeyPreview(item) }}</td>
            <td class="mono">{{ prettyNumber(item.totalTokens) }}</td>
            <td class="actions-cell">
              <button class="link-btn" @click="handleEdit(item.id)">
                编辑
              </button>
              <button
                class="link-btn link-btn--danger"
                :disabled="deletingId === item.id"
                @click="handleDelete(item)"
              >
                {{ deletingId === item.id ? "删除中..." : "删除" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </PaginatedListPanel>

    <template #footer>
      <Button @click="cancel">关 闭</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.header-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
}

.subtitle {
  font-size: 0.82rem;
  color: var(--foreground-muted);
}

.connector-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.connector-table th,
.connector-table td {
  padding: 0.7rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgb(0 104 119 / 0.1);
  vertical-align: middle;
}

.connector-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(246 250 252 / 0.95);
  color: var(--foreground-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.connector-table tbody tr:hover {
  background: rgb(0 104 119 / 0.04);
}

.mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.8rem;
}

.th-actions,
.actions-cell {
  text-align: right;
}

.actions-cell {
  white-space: nowrap;
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.15rem 0.35rem;
}

.link-btn:hover {
  text-decoration: underline;
}

.link-btn + .link-btn {
  margin-left: 0.5rem;
}

.link-btn--danger {
  color: #c0392b;
}

.link-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  text-decoration: none;
}

@media (max-width: 900px) {
  .header-wrap {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-end;
  }
}
</style>
