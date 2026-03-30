<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type AgentFilePermissionResponse } from "@/api";
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

const props = defineProps<{
  agentId: number;
  agentName?: string;
}>();

const visible = ref(true);
const closing = ref(false);

const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);

const page = ref(1);
const pageSize = ref(10);
const permissions = ref<AgentFilePermissionResponse[]>([]);

const deletingId = ref<number | null>(null);

const { reject, resolve } = useDialogContext<void>();
defineExpose(createDialogExpose<void>());

const title = computed(() => {
  return props.agentName ? `${props.agentName} · 文件权限` : "Agent 文件权限";
});

const total = computed(() => permissions.value.length);
const totalPages = computed(() => {
  if (!total.value) {
    return 0;
  }

  return Math.ceil(total.value / pageSize.value);
});

const pagedPermissions = computed(() => {
  if (!permissions.value.length) {
    return [];
  }

  const start = (page.value - 1) * pageSize.value;
  return permissions.value.slice(start, start + pageSize.value);
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

function ensurePageWithinRange() {
  const maxPage = Math.max(totalPages.value, 1);
  if (page.value > maxPage) {
    page.value = maxPage;
  }
}

function prettyNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}

async function loadData(useSoftLoading = false) {
  if (useSoftLoading) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  error.value = null;

  try {
    const res =
      await api.agentFilePermission.getAgentFilePermissionAgentByAgentId(
        props.agentId,
      );
    permissions.value = (res.data.items ?? []).sort((a, b) => a.id - b.id);
    ensurePageWithinRange();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "加载文件权限失败，请稍后重试";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function handleCreate() {
  const result = await dialogs.EditOrCreateAgentFilePermissionDialog({
    agentId: props.agentId,
  });

  if (result.type !== "resolve") {
    return;
  }

  await loadData(true);
}

async function handleEdit(item: AgentFilePermissionResponse) {
  const result = await dialogs.EditOrCreateAgentFilePermissionDialog({
    agentId: props.agentId,
    permission: item,
  });

  if (result.type !== "resolve") {
    return;
  }

  await loadData(true);
}

async function handleDelete(item: AgentFilePermissionResponse) {
  const confirmed = await msg.confirm(`确认删除路径「${item.path}」的权限？`, {
    title: "删除文件权限",
    confirmText: "删 除",
    confirmType: "danger",
  });

  if (confirmed.type !== "resolve") {
    return;
  }

  deletingId.value = item.id;
  try {
    await api.agentFilePermission.deleteAgentFilePermissionById(item.id);
    await loadData(true);
    notify.success("文件权限已删除");
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败，请稍后重试";
    notify.error(message);
  } finally {
    deletingId.value = null;
  }
}

async function handlePageChange(nextPage: number) {
  if (refreshing.value || loading.value) {
    return;
  }

  const safe = Math.min(Math.max(nextPage, 1), Math.max(totalPages.value, 1));
  if (safe === page.value) {
    return;
  }

  page.value = safe;
}

function handleClose() {
  close(() => resolve());
}

onMounted(loadData);
</script>

<template>
  <Dialog
    v-model="visible"
    width="62rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="v gap-1">
          <div class="title">{{ title }}</div>
          <div class="subtitle">
            管理 Agent 文件权限（enabled=可读，writable=可写）
          </div>
        </div>
        <div class="header-actions">
          <Button :disabled="refreshing" @click="loadData(true)">刷 新</Button>
          <PrimaryButton @click="handleCreate">添 加</PrimaryButton>
        </div>
      </div>
    </template>

    <PaginatedListPanel
      :loading="loading"
      :error="error"
      :has-data="hasData"
      :items-count="pagedPermissions.length"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :total-pages="totalPages"
      :disabled="refreshing"
      loading-text="正在加载文件权限..."
      empty-text="暂无文件权限，点击右上角添加。"
      @page-change="handlePageChange"
    >
      <template #summary="{ displayRange }">
        共 {{ prettyNumber(total) }} 条，当前第
        {{ prettyNumber(displayRange.start) }} -
        {{ prettyNumber(displayRange.end) }} 条
      </template>

      <table class="perm-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>宿主机路径</th>
            <th>挂载路径</th>
            <th class="th-center">可读</th>
            <th class="th-center">可写</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedPermissions" :key="item.id">
            <td class="mono">{{ item.id }}</td>
            <td class="mono path-cell" :title="item.path">{{ item.path }}</td>
            <td class="mono path-cell" :title="item.mountPath">
              {{ item.mountPath }}
            </td>
            <td class="th-center">{{ item.enabled ? "是" : "否" }}</td>
            <td class="th-center">{{ item.writable ? "是" : "否" }}</td>
            <td class="actions-cell">
              <button
                class="link-btn"
                :disabled="deletingId === item.id"
                @click="handleEdit(item)"
              >
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
      <Button @click="handleClose">关 闭</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--foreground);
}

.subtitle {
  font-size: 0.82rem;
  color: var(--foreground-muted);
}

.perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.perm-table th,
.perm-table td {
  padding: 0.62rem 0.7rem;
  border-bottom: 1px solid rgb(0 104 119 / 0.09);
  text-align: left;
  vertical-align: middle;
}

.perm-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(245 251 253 / 0.98);
  color: var(--foreground-muted);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.mono {
  font-family: var(--font-mono, monospace);
}

.path-cell {
  max-width: 15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.th-center {
  text-align: center;
}

.th-actions,
.actions-cell {
  width: 8rem;
}

.actions-cell {
  white-space: nowrap;
}

.link-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--primary);
  padding: 0.2rem 0.35rem;
  border-radius: 0.35rem;
}

.link-btn:hover:not(:disabled) {
  background: rgb(0 104 119 / 0.08);
}

.link-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.link-btn--danger {
  color: #c0392b;
}

.link-btn--danger:hover:not(:disabled) {
  background: rgb(192 57 43 / 0.08);
}
</style>
