<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  api,
  type DockerAvailabilityResponse,
  type DockerHubImageResponse,
  type DockerLocalImageResponse,
} from "@/api";
import Dialog from "@/components/Dialog.vue";
import PaginatedListPanel from "@/components/PaginatedListPanel.vue";
import Input from "@/components/Input.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { msg } from "@/utils/message";

const props = defineProps<{
  initialImage?: string;
}>();

const emit = defineEmits<{
  close: [];
  select: [image: string];
}>();

const visible = ref(true);
const mode = ref<"local" | "hub">("local");
const loading = ref(false);
const pulling = ref(false);
const localKeyword = ref("");
const hubKeyword = ref("");
const pullImageName = ref(props.initialImage ?? "");
const availability = ref<DockerAvailabilityResponse | null>(null);

const localItems = ref<DockerLocalImageResponse[]>([]);
const localPage = ref(1);
const localPageSize = ref(10);
const localTotal = ref(0);
const localTotalPages = ref(0);

const hubItems = ref<DockerHubImageResponse[]>([]);
const hubPage = ref(1);
const hubPageSize = ref(10);
const hubTotal = ref(0);
const hubTotalPages = ref(0);

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

async function searchDockerHub(page = hubPage.value) {
  const q = hubKeyword.value.trim();
  if (!q) {
    await msg.info("请输入 Docker Hub 搜索关键字");
    return;
  }

  loading.value = true;
  try {
    const res = await api.modelConnector.searchDockerHub({
      q,
      page,
      pageSize: hubPageSize.value,
    });

    hubItems.value = res.data.items || [];
    hubPage.value = res.data.page || page;
    hubPageSize.value = res.data.pageSize || hubPageSize.value;
    hubTotal.value = res.data.total || 0;
    hubTotalPages.value = res.data.totalPages || 0;
  } catch (error) {
    await msg.error(
      error instanceof Error ? error.message : "搜索 Docker Hub 失败",
    );
  } finally {
    loading.value = false;
  }
}

function chooseImage(image: string) {
  const target = image.trim();
  if (!target) {
    return;
  }

  emit("select", target);
  close();
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
    await msg.info(`已开始后台拉取镜像：${image}`);
  } catch (error) {
    await msg.error(error instanceof Error ? error.message : "拉取镜像失败");
  } finally {
    pulling.value = false;
  }
}

async function pullHubImageAndChoose(item: DockerHubImageResponse) {
  const image = item.namespace
    ? `${item.namespace}/${item.name}:latest`
    : `${item.name}:latest`;
  pullImageName.value = image;
  await pullImage(image);
}

async function handleLocalPageChange(nextPage: number) {
  await loadLocalImages(nextPage);
}

async function handleHubPageChange(nextPage: number) {
  await searchDockerHub(nextPage);
}

onMounted(async () => {
  await loadAvailability();
  await loadLocalImages(1);
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
        <div class="title">选择 Docker 镜像</div>
        <div class="availability" :class="{ error: !availability?.available }">
          {{ availabilityText }}
        </div>
      </div>
    </template>

    <div class="top-actions">
      <div class="mode-switch">
        <button
          class="mode-btn"
          :class="{ active: mode === 'local' }"
          @click="mode = 'local'"
        >
          本地镜像
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'hub' }"
          @click="mode = 'hub'"
        >
          Docker Hub
        </button>
      </div>

      <div class="pull-row">
        <Input
          v-model="pullImageName"
          label="拉取后选择"
          placeholder="例如：nginx:latest"
        />
        <PrimaryButton :loading="pulling" @click="pullImage()">
          拉取并选择
        </PrimaryButton>
      </div>
    </div>

    <div v-if="mode === 'local'" class="panel">
      <div class="panel-toolbar">
        <Input
          v-model="localKeyword"
          label="本地筛选"
          placeholder="repository/tag"
        />
        <Button @click="loadLocalImages(1)">查 询</Button>
      </div>

      <PaginatedListPanel
        :loading="loading"
        :has-data="localItems.length > 0"
        :items-count="localItems.length"
        :page="localPage"
        :page-size="localPageSize"
        :total="localTotal"
        :total-pages="localTotalPages"
        :disabled="pulling"
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
                <button class="link-btn" @click="chooseImage(item.fullName)">
                  选 择
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </PaginatedListPanel>
    </div>

    <div v-else class="panel">
      <div class="panel-toolbar">
        <Input
          v-model="hubKeyword"
          label="Docker Hub 搜索"
          placeholder="例如：nginx"
        />
        <Button @click="searchDockerHub(1)">搜 索</Button>
      </div>

      <PaginatedListPanel
        :loading="loading"
        :has-data="hubItems.length > 0"
        :items-count="hubItems.length"
        :page="hubPage"
        :page-size="hubPageSize"
        :total="hubTotal"
        :total-pages="hubTotalPages"
        :disabled="pulling"
        :max-height="'45vh'"
        loading-text="正在搜索 Docker Hub..."
        empty-text="暂无搜索结果"
        @page-change="handleHubPageChange"
      >
        <table class="image-table">
          <thead>
            <tr>
              <th>命名空间</th>
              <th>名称</th>
              <th>描述</th>
              <th>热度</th>
              <th class="th-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in hubItems"
              :key="`${item.namespace}-${item.name}`"
            >
              <td class="mono">{{ item.namespace }}</td>
              <td class="mono">{{ item.name }}</td>
              <td>{{ item.shortDescription || "-" }}</td>
              <td>
                ★{{ item.starCount || 0 }} / Pull {{ item.pullCount || 0 }}
              </td>
              <td class="th-right">
                <button class="link-btn" @click="pullHubImageAndChoose(item)">
                  拉取并选择
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

.mode-switch {
  display: inline-flex;
  gap: 0.5rem;
}

.mode-btn {
  border: 1px solid rgb(0 104 119 / 0.2);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  background: white;
  cursor: pointer;
  font-size: 0.82rem;
}

.mode-btn.active {
  background: rgb(0 104 119 / 0.09);
  border-color: rgb(0 104 119 / 0.35);
  font-weight: 700;
}

.pull-row {
  display: grid;
  grid-template-columns: 1fr auto;
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
  grid-template-columns: 1fr auto;
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
