<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, type SkillResponse } from "@/api";
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
const error = ref<string | null>(null);

const skills = ref<SkillResponse[]>([]);
const page = ref(1);
const pageSize = ref(10);

const { reject } = useDialogContext<void>();
defineExpose(createDialogExpose<void>());

const total = computed(() => skills.value.length);
const totalPages = computed(() => {
  if (!total.value) {
    return 0;
  }

  return Math.ceil(total.value / pageSize.value);
});

const pagedSkills = computed(() => {
  if (!skills.value.length) {
    return [];
  }

  const start = (page.value - 1) * pageSize.value;
  return skills.value.slice(start, start + pageSize.value);
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

function sortByIdAsc(items: SkillResponse[]): SkillResponse[] {
  return [...items].sort((a, b) => a.id - b.id);
}

function ensurePageWithinRange() {
  const safeMax = Math.max(totalPages.value, 1);
  if (page.value > safeMax) {
    page.value = safeMax;
  }
}

async function loadSkills(useSoftLoading = false) {
  if (useSoftLoading) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  error.value = null;
  try {
    const res = await api.skill.getSkill();
    skills.value = sortByIdAsc(res.data.items ?? []);
    ensurePageWithinRange();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "获取 Skill 列表失败，请稍后重试";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}


async function handleCreate() {
  const result = await dialogs.EditOrCreateSkillDialog();
  if (result.type !== "resolve") {
    return;
  }

  await loadSkills(true);
}

async function handleEdit(skill: SkillResponse) {
  const result = await dialogs.EditOrCreateSkillDialog({ id: skill.id });
  if (result.type !== "resolve") {
    return;
  }

  await loadSkills(true);
}

async function handleDelete(skill: SkillResponse) {
  const confirmed = await msg.confirm(
    `确认删除 Skill「${skill.name || `#${skill.id}`}」吗？该操作不可恢复。`,
    {
      title: "删除 Skill",
      confirmText: "删 除",
      confirmType: "danger",
    },
  );

  if (confirmed.type !== "resolve") {
    return;
  }

  deletingId.value = skill.id;
  try {
    await api.skill.deleteSkillById(skill.id);
    await loadSkills(true);
    notify.success("Skill 删除成功");
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除 Skill 失败";
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

onMounted(loadSkills);
</script>

<template>
  <Dialog
    v-model="visible"
    width="64rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="v gap-1">
          <div class="title">Skill 管理</div>
          <div class="subtitle">统一维护可分配给 Agent 的 Skill 能力</div>
        </div>
        <div class="header-actions">
          <Button @click="loadSkills(true)">刷 新</Button>
          <PrimaryButton @click="handleCreate">新 建</PrimaryButton>
        </div>
      </div>
    </template>

    <PaginatedListPanel
      :loading="loading"
      :error="error"
      :has-data="hasData"
      :items-count="pagedSkills.length"
      :page="page"
      :page-size="pageSize"
      :total="total"
      :total-pages="totalPages"
      :disabled="refreshing"
      loading-text="正在加载 Skill 列表..."
      empty-text="暂无 Skill，点击右上角新建。"
      @page-change="handlePageChange"
    >
      <template #summary="{ displayRange }">
        共 {{ prettyNumber(total) }} 条，当前第
        {{ prettyNumber(displayRange.start) }} -
        {{ prettyNumber(displayRange.end) }} 条
      </template>

      <table class="skill-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>描述</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedSkills" :key="item.id">
            <td class="mono">{{ item.id }}</td>
            <td>{{ item.name || `Skill #${item.id}` }}</td>
            <td class="desc" :title="item.description || '-'">
              {{ item.description || "-" }}
            </td>
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
      <Button @click="cancel">关 闭</Button>
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

.skill-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.skill-table th,
.skill-table td {
  padding: 0.62rem 0.7rem;
  border-bottom: 1px solid rgb(0 104 119 / 0.09);
  text-align: left;
  vertical-align: middle;
}

.skill-table th {
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
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

.desc {
  max-width: 30rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.15rem 0.45rem;
}

.link-btn:hover {
  text-decoration: underline;
}

.link-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.link-btn--danger {
  color: #dc2626;
}
</style>
