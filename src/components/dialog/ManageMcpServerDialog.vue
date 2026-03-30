<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type MCPServerResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import PaginatedListPanel from "@/components/PaginatedListPanel.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { dialogs } from "virtual:dialogs";
import { msg } from "@/utils/message";
import { notify } from "@/components/notification";

const visible = ref(true);
const closing = ref(false);
const loading = ref(false);
const refreshing = ref(false);
const deletingId = ref<number | null>(null);
const allServers = ref<MCPServerResponse[]>([]);
const error = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(10);
const { reject } = useDialogContext<void>();

defineExpose(createDialogExpose<void>());

const total = computed(() => allServers.value.length);
const totalPages = computed(() => {
  if (!total.value) {
    return 0;
  }

  return Math.ceil(total.value / pageSize.value);
});

const pagedServers = computed(() => {
  if (!allServers.value.length) {
    return [];
  }

  const start = (page.value - 1) * pageSize.value;
  return allServers.value.slice(start, start + pageSize.value);
});

const hasData = computed(() => total.value > 0);

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

function typeText(item: MCPServerResponse): string {
  return item.type === "STDIO" ? "STDIO" : "HTTP";
}

function isBuiltinServer(item: MCPServerResponse): boolean {
  return Boolean((item as { builtin?: boolean }).builtin);
}

function endpointText(item: MCPServerResponse): string {
  if (item.type === "STDIO") {
    const cmd = item.command?.trim();
    if (!cmd) {
      return "-";
    }

    const args = item.commandArguments?.trim();
    return args ? `${cmd} ${args}` : cmd;
  }

  return item.url?.trim() || "-";
}

function sortByIdAsc(items: MCPServerResponse[]): MCPServerResponse[] {
  return [...items].sort((a, b) => a.id - b.id);
}

function ensurePageWithinRange() {
  const safeMax = Math.max(totalPages.value, 1);
  if (page.value > safeMax) {
    page.value = safeMax;
  }
}

async function loadMcpServers(useSoftLoading = false) {
  if (useSoftLoading) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  error.value = null;
  try {
    const res = await api.mcpServer.getMcpServer();
    allServers.value = sortByIdAsc(res.data.items ?? []);
    ensurePageWithinRange();
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : "获取 MCP Server 列表失败，请稍后重试";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function handleCreate() {
  const result = await dialogs.EditOrCreateMcpServerDialog();
  if (result.type !== "resolve") {
    return;
  }

  await loadMcpServers(true);
  notify.success("MCP Server 创建成功");
}

async function handleEdit(id: number) {
  const target = allServers.value.find((item) => item.id === id);
  if (target && isBuiltinServer(target)) {
    notify.info("内置 MCP Server 不允许编辑");
    return;
  }

  const result = await dialogs.EditOrCreateMcpServerDialog({ id });
  if (result.type !== "resolve") {
    return;
  }

  await loadMcpServers(true);
  notify.success("MCP Server 更新成功");
}

async function handleDelete(server: MCPServerResponse) {
  if (isBuiltinServer(server)) {
    notify.info("内置 MCP Server 不允许删除");
    return;
  }

  const confirmed = await msg.confirm(
    `确认删除 MCP Server「${server.name || `#${server.id}`}」吗？该操作不可恢复。`,
    {
      title: "删除 MCP Server",
      confirmText: "删 除",
      confirmType: "danger",
    },
  );

  if (confirmed.type !== "resolve") {
    return;
  }

  deletingId.value = server.id;
  try {
    await api.mcpServer.deleteMcpServerById(server.id);
    await loadMcpServers(true);
    notify.success("MCP Server 删除成功");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "删除 MCP Server 失败，请稍后重试";
    notify.error(message);
  } finally {
    deletingId.value = null;
  }
}

async function handlePageChange(nextPage: number) {
  if (refreshing.value || loading.value) {
    return;
  }

  const safePage = Math.min(
    Math.max(nextPage, 1),
    Math.max(totalPages.value, 1),
  );
  if (safePage === page.value) {
    return;
  }

  page.value = safePage;
}

onMounted(loadMcpServers);
</script>

<template>
  <Dialog
    v-model="visible"
    width="60rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="v gap-1">
          <div class="title">MCP Server 管理</div>
          <div class="subtitle">统一维护 MCP Server 的连接配置</div>
        </div>
        <div class="header-actions">
          <Button @click="loadMcpServers(true)">刷 新</Button>
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
      :items-count="pagedServers.length"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :total-pages="totalPages"
      :disabled="refreshing"
      loading-text="正在加载 MCP Server 列表..."
      empty-text="暂无 MCP Server，点击右上角「新建」添加。"
      @page-change="handlePageChange"
    >
      <template #summary="{ displayRange }">
        共 {{ prettyNumber(total) }} 条，当前第
        {{ prettyNumber(displayRange.start) }} -
        {{ prettyNumber(displayRange.end) }} 条
      </template>

      <table class="mcp-server-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>类型</th>
            <th>连接信息</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedServers" :key="item.id">
            <td class="mono">{{ item.id }}</td>
            <td>
              <div class="server-name">
                {{ item.name || `MCP #${item.id}` }}
              </div>
              <div
                v-if="item.description"
                class="server-desc"
                :title="item.description"
              >
                {{ item.description }}
              </div>
            </td>
            <td>{{ typeText(item) }}</td>
            <td class="mono endpoint-cell" :title="endpointText(item)">
              {{ endpointText(item) }}
            </td>
            <td class="actions-cell">
              <button
                class="link-btn"
                :disabled="isBuiltinServer(item)"
                :title="
                  isBuiltinServer(item) ? '内置 MCP Server 不可编辑' : '编辑'
                "
                @click="handleEdit(item.id)"
              >
                编辑
              </button>
              <button
                class="link-btn link-btn--danger"
                :disabled="deletingId === item.id || isBuiltinServer(item)"
                :title="
                  isBuiltinServer(item) ? '内置 MCP Server 不可删除' : '删除'
                "
                @click="handleDelete(item)"
              >
                {{
                  isBuiltinServer(item)
                    ? "内置"
                    : deletingId === item.id
                      ? "删除中..."
                      : "删除"
                }}
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

.mcp-server-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.mcp-server-table th,
.mcp-server-table td {
  padding: 0.7rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgb(0 104 119 / 0.1);
  vertical-align: middle;
}

.mcp-server-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(246 250 252 / 0.95);
  color: var(--foreground-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.mcp-server-table tbody tr:hover {
  background: rgb(0 104 119 / 0.04);
}

.mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.8rem;
}

.server-name {
  font-weight: 600;
  color: var(--foreground);
}

.server-desc {
  margin-top: 0.16rem;
  font-size: 0.76rem;
  color: var(--foreground-muted);
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.endpoint-cell {
  max-width: 24rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

  .mcp-server-table {
    min-width: 44rem;
  }
}
</style>
