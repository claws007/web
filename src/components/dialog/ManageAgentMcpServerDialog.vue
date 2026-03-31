<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  api,
  type AgentMcpServerRelationResponse,
  type MCPServerResponse,
} from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import PaginatedListPanel from "@/components/PaginatedListPanel.vue";
import Button from "@/components/dialog/Button.vue";
import Switch from "@/components/Switch.vue";
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

const mcpServers = ref<MCPServerResponse[]>([]);
const relationByServerId = ref<Map<number, AgentMcpServerRelationResponse>>(
  new Map(),
);
const togglingServerIds = ref<Set<number>>(new Set());

const { reject, resolve } = useDialogContext<void>();
defineExpose(createDialogExpose<void>());

const title = computed(() => {
  return props.agentName
    ? `${props.agentName} · MCP Server`
    : "Agent MCP Server";
});

const total = computed(() => mcpServers.value.length);
const totalPages = computed(() => {
  if (!total.value) {
    return 0;
  }

  return Math.ceil(total.value / pageSize.value);
});

const pagedServers = computed(() => {
  if (!mcpServers.value.length) {
    return [];
  }

  const start = (page.value - 1) * pageSize.value;
  return mcpServers.value.slice(start, start + pageSize.value);
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

function prettyNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}

function ensurePageWithinRange() {
  const maxPage = Math.max(totalPages.value, 1);
  if (page.value > maxPage) {
    page.value = maxPage;
  }
}

function updateTogglingId(serverId: number, next: boolean) {
  const copied = new Set(togglingServerIds.value);
  if (next) {
    copied.add(serverId);
  } else {
    copied.delete(serverId);
  }
  togglingServerIds.value = copied;
}

async function loadData(useSoftLoading = false) {
  if (useSoftLoading) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  error.value = null;

  try {
    const [serversRes, relationsRes] = await Promise.all([
      api.mcpServer.getMcpServer(),
      api.agentMcpServer.getAgentMcpServerAgentByAgentId(props.agentId),
    ]);

    const allServers = (serversRes.data.items ?? []).sort(
      (a, b) => a.id - b.id,
    );

    mcpServers.value = allServers;

    const nextMap = new Map<number, AgentMcpServerRelationResponse>();
    for (const rel of relationsRes.data.items ?? []) {
      nextMap.set(rel.mcpServerId, rel);
    }
    relationByServerId.value = nextMap;

    ensurePageWithinRange();
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : "加载 MCP Server 配置失败，请稍后重试";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function onToggleServer(server: MCPServerResponse, enabled: boolean) {
  if (togglingServerIds.value.has(server.id)) {
    return;
  }

  updateTogglingId(server.id, true);
  try {
    const relation = relationByServerId.value.get(server.id);

    if (enabled && !relation) {
      const created = await api.agentMcpServer.postAgentMcpServer({
        agentId: props.agentId,
        mcpServerId: server.id,
      });
      const nextMap = new Map(relationByServerId.value);
      nextMap.set(server.id, created.data);
      relationByServerId.value = nextMap;
      return;
    }

    if (!enabled && relation) {
      await api.agentMcpServer.deleteAgentMcpServerById(relation.id);
      const nextMap = new Map(relationByServerId.value);
      nextMap.delete(server.id);
      relationByServerId.value = nextMap;
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "更新 MCP Server 绑定失败，请稍后重试";
    notify.error(message);
    await loadData(true);
  } finally {
    updateTogglingId(server.id, false);
  }
}

function isEnabled(serverId: number): boolean {
  return relationByServerId.value.has(serverId);
}

function isToggling(serverId: number): boolean {
  return togglingServerIds.value.has(serverId);
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
    width="58rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="v gap-1">
          <div class="title">{{ title }}</div>
          <div class="subtitle">分页管理 Agent 可调用的基础 MCP Server</div>
        </div>
        <Button :disabled="refreshing" @click="loadData(true)">刷 新</Button>
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
      empty-text="暂无可管理的 MCP Server。"
      @page-change="handlePageChange"
    >
      <template #summary="{ displayRange }">
        共 {{ prettyNumber(total) }} 条，当前第
        {{ prettyNumber(displayRange.start) }} -
        {{ prettyNumber(displayRange.end) }} 条
      </template>

      <table class="mcp-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>类型</th>
            <th>描述</th>
            <th class="th-switch">启用</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="server in pagedServers" :key="server.id">
            <td class="mono">{{ server.id }}</td>
            <td>{{ server.name || `MCP #${server.id}` }}</td>
            <td>{{ server.type }}</td>
            <td class="desc" :title="server.description || '-'">
              {{ server.description || "-" }}
            </td>
            <td class="switch-cell">
              <Switch
                :model-value="isEnabled(server.id)"
                :disabled="isToggling(server.id)"
                @update:model-value="onToggleServer(server, $event)"
              />
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

.title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--foreground);
}

.subtitle {
  font-size: 0.82rem;
  color: var(--foreground-muted);
}

.mcp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.mcp-table th,
.mcp-table td {
  padding: 0.62rem 0.7rem;
  border-bottom: 1px solid rgb(0 104 119 / 0.09);
  text-align: left;
  vertical-align: middle;
}

.mcp-table th {
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

.desc {
  max-width: 16rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.th-switch,
.switch-cell {
  text-align: center;
  width: 5.5rem;
}
</style>
