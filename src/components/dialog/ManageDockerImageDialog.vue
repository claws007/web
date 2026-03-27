<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  api,
  type DockerAvailabilityResponse,
  type DockerLocalImageResponse,
} from "@/api";
import Dialog from "@/components/Dialog.vue";
import PaginatedListPanel from "@/components/PaginatedListPanel.vue";
import SearchSelector from "@/components/SearchSelector.vue";
import type { SelectorItem } from "@/components/Selector.vue";
import Input from "@/components/Input.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { msg } from "@/utils/message";
import { subscribeCommandProgressRealtime } from "@/services/command-progress-realtime";

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(true);
const loading = ref(false);
const pulling = ref(false);
const deletingImage = ref<string | null>(null);
const localKeyword = ref("");
const pullImageName = ref("");
const availability = ref<DockerAvailabilityResponse | null>(null);

const localItems = ref<DockerLocalImageResponse[]>([]);
const localPage = ref(1);
const localPageSize = ref(10);
const localTotal = ref(0);
const localTotalPages = ref(0);
let localSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeProgressRealtime: (() => void) | null = null;

const availabilityText = computed(() => {
  if (!availability.value) {
    return "检测中...";
  }

  if (!availability.value.available) {
    return `不可用：${availability.value.error || "未知错误"}`;
  }

  const client = availability.value.clientVersion || "unknown";
  const server = availability.value.serverVersion || "unknown";
  return `可用 (Client ${client} / Server ${server})`;
});

function close() {
  visible.value = false;
  setTimeout(() => emit("close"), 200);
}

function onModelValueChange(next: boolean) {
  if (!next) {
    close();
  }
}

async function loadAvailability() {
  try {
    const res = await api.modelConnector.getDockerAvailability();
    availability.value = res.data;
  } catch (error) {
    availability.value = {
      available: false,
      error: error instanceof Error ? error.message : "检测失败",
    };
  }
}

async function loadLocalImages(page = localPage.value) {
  loading.value = true;
  try {
    const res = await api.modelConnector.getDockerImages({
      page,
      pageSize: localPageSize.value,
      keyword: localKeyword.value.trim() || undefined,
    });

    localItems.value = res.data.items || [];
    localPage.value = res.data.page || page;
    localPageSize.value = res.data.pageSize || localPageSize.value;
    localTotal.value = res.data.total || 0;
    localTotalPages.value = res.data.totalPages || 0;
  } catch (error) {
    await msg.error(
      error instanceof Error ? error.message : "加载本地镜像失败",
    );
  } finally {
    loading.value = false;
  }
}

async function searchDockerHubOptions(
  keyword: string,
): Promise<SelectorItem[]> {
  const q = keyword.trim();
  if (!q) {
    return [];
  }

  try {
    const res = await api.modelConnector.searchDockerHub({
      q,
      page: 1,
      pageSize: 20,
    });

    return (res.data.items || []).map((item) => {
      const imageName = item.namespace
        ? `${item.namespace}/${item.name}:latest`
        : `${item.name}:latest`;

      return {
        id: imageName,
        label: imageName,
        description: item.shortDescription || `★${item.starCount || 0}`,
      } satisfies SelectorItem;
    });
  } catch (error) {
    await msg.error(
      error instanceof Error ? error.message : "搜索 Docker Hub 失败",
    );
    return [];
  }
}

async function pullImage(target?: string) {
  const image = (target ?? pullImageName.value).trim();
  if (!image) {
    await msg.error("请输入镜像名，例如 nginx:latest");
    return;
  }

  pulling.value = true;
  try {
    await api.modelConnector.pullDockerImage({ image });
    pullImageName.value = image;
    // 不需要notify，因为websocket会有回调
    // notify.success(`开始拉取镜像：${image}`);
  } catch (error) {
    await msg.error(error instanceof Error ? error.message : "拉取镜像失败");
  } finally {
    pulling.value = false;
  }
}

async function removeLocalImage(image: string) {
  const target = image.trim();
  if (!target) {
    return;
  }

  const confirmed = await msg.confirm(
    `确认删除本地镜像「${target}」吗？该操作可能影响依赖该镜像的任务执行。`,
    {
      title: "删除 Docker 镜像",
      confirmText: "删 除",
      confirmType: "danger",
    },
  );

  if (confirmed.type !== "resolve") {
    return;
  }

  deletingImage.value = target;
  try {
    await api.modelConnector.removeDockerImage({ image: target, force: true });
    await msg.success(`镜像删除成功：${target}`);
    await loadLocalImages(localPage.value);
  } catch (error) {
    await msg.error(error instanceof Error ? error.message : "删除镜像失败");
  } finally {
    deletingImage.value = null;
  }
}

async function handleLocalPageChange(nextPage: number) {
  await loadLocalImages(nextPage);
}

function clearLocalSearchDebounceTimer() {
  if (!localSearchDebounceTimer) {
    return;
  }
  clearTimeout(localSearchDebounceTimer);
  localSearchDebounceTimer = null;
}

function scheduleLocalSearch() {
  clearLocalSearchDebounceTimer();
  localSearchDebounceTimer = setTimeout(() => {
    localSearchDebounceTimer = null;
    void loadLocalImages(1);
  }, 320);
}

watch(localKeyword, () => {
  scheduleLocalSearch();
});

onMounted(async () => {
  unsubscribeProgressRealtime = subscribeCommandProgressRealtime((event) => {
    if (event.commandType !== "docker_pull" || event.status !== "success") {
      return;
    }

    void loadLocalImages(1);
  });

  await loadAvailability();
  await loadLocalImages(1);
});

onUnmounted(() => {
  clearLocalSearchDebounceTimer();
  if (unsubscribeProgressRealtime) {
    unsubscribeProgressRealtime();
    unsubscribeProgressRealtime = null;
  }
});
</script>

<template>
  <Dialog
    v-model="visible"
    width="64rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="header-wrap">
        <div class="title">Docker 镜像管理</div>
        <div class="availability" :class="{ error: !availability?.available }">
          {{ availabilityText }}
        </div>
      </div>
    </template>

    <div class="top-actions">
      <div class="pull-row">
        <SearchSelector
          v-model="pullImageName"
          :search="searchDockerHubOptions"
          label="拉取镜像"
          placeholder="输入关键词后搜索，例如 nginx"
          selector-placeholder="选择镜像（将按 latest 拉取）"
          :strict="false"
        />
        <PrimaryButton :loading="pulling" @click="pullImage()">
          拉 取
        </PrimaryButton>
      </div>
    </div>

    <div class="panel">
      <div class="panel-toolbar">
        <Input
          v-model="localKeyword"
          label="本地筛选"
          placeholder="repository/tag"
        />
      </div>

      <PaginatedListPanel
        :loading="loading"
        :has-data="localItems.length > 0"
        :items-count="localItems.length"
        :page="localPage"
        :page-size="localPageSize"
        :total="localTotal"
        :total-pages="localTotalPages"
        :disabled="pulling || deletingImage !== null"
        :max-height="'45vh'"
        loading-text="正在加载本地镜像..."
        empty-text="暂无本地镜像"
        @page-change="handleLocalPageChange"
      >
        <table class="image-table">
          <thead>
            <tr>
              <th>镜像名</th>
              <th>ID</th>
              <th>大小</th>
              <th>创建时间</th>
              <th class="th-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in localItems"
              :key="`${item.fullName}-${item.imageId}`"
            >
              <td class="mono">{{ item.fullName }}</td>
              <td class="mono">{{ item.imageId }}</td>
              <td>{{ item.size || "-" }}</td>
              <td>{{ item.createdSince || "-" }}</td>
              <td class="th-right">
                <button
                  class="link-btn link-btn-danger"
                  :disabled="deletingImage === item.fullName"
                  @click="removeLocalImage(item.fullName)"
                >
                  {{ deletingImage === item.fullName ? "删除中..." : "删除" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </PaginatedListPanel>
    </div>

    <template #footer>
      <Button @click="close">关 闭</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.title {
  font-size: 1.05rem;
  font-weight: 700;
}

.availability {
  font-size: 0.82rem;
  color: #0b875b;
}

.availability.error {
  color: #c0392b;
}

.top-actions {
  display: grid;
  gap: 0.9rem;
}

.pull-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: end;
}

.panel {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.65rem;
}

.panel-toolbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
  align-items: end;
}

.image-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.image-table th,
.image-table td {
  border-bottom: 1px solid rgb(0 104 119 / 0.1);
  padding: 0.6rem 0.7rem;
  text-align: left;
  vertical-align: middle;
}

.image-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(246 250 252 / 0.96);
  font-size: 0.75rem;
  color: var(--foreground-muted);
}

.th-right {
  text-align: right;
}

.mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.link-btn:hover {
  text-decoration: underline;
}

.link-btn + .link-btn {
  margin-left: 0.55rem;
}

.link-btn-danger {
  color: #c0392b;
}

.link-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  text-decoration: none;
}

@media (max-width: 900px) {
  .pull-row,
  .panel-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
