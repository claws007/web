<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import JSZip from "jszip";
import { api, type SkillResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import Input from "@/components/Input.vue";
import Textarea from "@/components/Textarea.vue";
import { notify } from "@/components/notification";

type ExtractedFile = {
  path: string;
  fileName: string;
  bytes: ArrayBuffer;
  mimeType: string;
  size: number;
};

type ExistingSkillFile = {
  path: string;
  fileName: string;
  size: number | null;
};

const props = defineProps<{
  id?: number;
}>();

const visible = ref(true);
const closing = ref(false);
const loading = ref(false);
const submitting = ref(false);
const extracting = ref(false);

const name = ref("");
const description = ref("");
const zipFileInputRef = ref<HTMLInputElement | null>(null);
const zipFileName = ref<string | null>(null);
const extractedFiles = ref<ExtractedFile[]>([]);
const existingFiles = ref<ExistingSkillFile[]>([]);

const { resolve, reject } = useDialogContext<SkillResponse>();
defineExpose(createDialogExpose<SkillResponse>());

const isEdit = computed(() => typeof props.id === "number");
const title = computed(() => (isEdit.value ? "编辑 Skill" : "新建 Skill"));
const hasFiles = computed(() => extractedFiles.value.length > 0);
const hasExistingFiles = computed(() => existingFiles.value.length > 0);
const displayFiles = computed(() =>
  hasFiles.value
    ? extractedFiles.value.map((entry) => ({
        path: entry.path,
        fileName: entry.fileName,
        size: entry.size,
      }))
    : existingFiles.value,
);

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

function openZipPicker() {
  zipFileInputRef.value?.click();
}

function clearZip() {
  zipFileName.value = null;
  extractedFiles.value = [];
  if (zipFileInputRef.value) {
    zipFileInputRef.value.value = "";
  }
}

function toDisplayPath(path?: string | null, fallbackId?: number): string {
  const trimmed = path?.trim();
  if (trimmed) {
    return trimmed;
  }

  return fallbackId ? `file-${fallbackId}` : "file";
}

function toDisplayFileName(path: string): string {
  return path.split("/").pop() || path;
}

async function onZipChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".zip")) {
    notify.error("请选择 .zip 格式的文件");
    input.value = "";
    return;
  }

  extracting.value = true;
  extractedFiles.value = [];
  zipFileName.value = file.name;

  try {
    const zip = await JSZip.loadAsync(file);
    const entries: ExtractedFile[] = [];

    const fileEntries = Object.entries(zip.files).filter(
      ([, entry]) => !entry.dir,
    );

    for (const [path, entry] of fileEntries) {
      const bytes = await entry.async("arraybuffer");
      const fileName = path.split("/").pop() ?? path;
      // Guess mime type from extension
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      const mimeMap: Record<string, string> = {
        md: "text/markdown",
        txt: "text/plain",
        json: "application/json",
        js: "text/javascript",
        ts: "text/typescript",
        py: "text/x-python",
        yaml: "application/yaml",
        yml: "application/yaml",
        html: "text/html",
        css: "text/css",
        sh: "application/x-sh",
      };
      const mimeType = mimeMap[ext] ?? "application/octet-stream";
      entries.push({ path, fileName, bytes, mimeType, size: bytes.byteLength });
    }

    if (entries.length === 0) {
      notify.error("ZIP 文件中没有可用的文件");
      clearZip();
      return;
    }

    extractedFiles.value = entries;
    notify.success(`已解压 ${entries.length} 个文件`);
  } catch (err) {
    notify.error(err instanceof Error ? err.message : "ZIP 解压失败");
    clearZip();
  } finally {
    extracting.value = false;
  }
}

async function loadSkill() {
  if (!isEdit.value || props.id === undefined) {
    return;
  }

  loading.value = true;
  try {
    const res = await api.skill.getSkillById(props.id);
    name.value = res.data.name ?? "";
    description.value = res.data.description ?? "";
    existingFiles.value = (res.data.fileList?.files ?? [])
      .map((item) => {
        const path = toDisplayPath(item.file?.filePath, item.file?.id);
        return {
          path,
          fileName: toDisplayFileName(path),
          size: null,
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path, "zh-CN"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "加载 Skill 失败";
    notify.error(message);
    cancel();
  } finally {
    loading.value = false;
  }
}

function buildFormData(): FormData | null {
  const nextName = name.value.trim();
  if (!nextName) {
    notify.info("请输入 Skill 名称");
    return null;
  }

  const formData = new FormData();
  formData.append("name", nextName);
  const desc = description.value.trim();
  if (desc) {
    formData.append("description", desc);
  }

  for (const entry of extractedFiles.value) {
    formData.append(
      "files",
      new File([entry.bytes], entry.fileName, { type: entry.mimeType }),
    );
    formData.append("filePath", entry.path);
  }

  return formData;
}

async function submit() {
  if (submitting.value) {
    return;
  }

  const formData = buildFormData();
  if (!formData) {
    return;
  }

  submitting.value = true;
  try {
    let saved: SkillResponse;
    if (isEdit.value && props.id !== undefined) {
      const res = await api.skill.putSkillById(props.id, formData as never);
      saved = res.data;
      notify.success("Skill 更新成功");
    } else {
      const res = await api.skill.postSkill(formData as never);
      saved = res.data;
      notify.success("Skill 创建成功");
    }

    close(() => resolve(saved));
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存 Skill 失败";
    notify.error(message);
  } finally {
    submitting.value = false;
  }
}

onMounted(loadSkill);
</script>

<template>
  <Dialog
    v-model="visible"
    width="40rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="v gap-1">
        <div class="title">{{ title }}</div>
        <div class="subtitle">上传 ZIP 文件的所有内容将作为 Skill 文件保存</div>
      </div>
    </template>

    <div class="v gap-3">
      <Input
        v-model="name"
        label="名称"
        placeholder="请输入 Skill 名称"
        :validate-throttle-ms="0"
        :disabled="loading || submitting"
      />

      <Textarea
        v-model="description"
        label="描述"
        placeholder="可选：描述 Skill 的用途"
        :rows="3"
        :validate-throttle-ms="0"
        :disabled="loading || submitting"
      />

      <div class="v gap-1">
        <div class="field-label">Skill 文件（ZIP）</div>
        <div class="zip-upload-area">
          <template v-if="!hasFiles && !hasExistingFiles">
            <button
              class="zip-pick-btn"
              type="button"
              :disabled="loading || submitting || extracting"
              @click="openZipPicker"
            >
              <span class="zip-icon">📦</span>
              <span>{{ extracting ? "解压中..." : "选择 ZIP 文件" }}</span>
            </button>
            <p class="zip-hint">
              ZIP 内的目录结构将原样保存。若不上传，自动创建默认 SKILL.md。
            </p>
          </template>
          <template v-else>
            <div class="zip-info-bar">
              <span class="zip-file-name">
                {{ hasFiles ? `📦 ${zipFileName}` : "📁 已保存文件" }}
              </span>
              <span class="zip-count">{{ displayFiles.length }} 个文件</span>
              <button
                class="zip-clear-btn"
                type="button"
                :disabled="submitting || extracting"
                @click="hasFiles ? clearZip() : openZipPicker()"
              >
                {{ hasFiles ? "清除" : "上传 ZIP 覆盖" }}
              </button>
            </div>
            <ul class="zip-file-list">
              <li
                v-for="entry in displayFiles"
                :key="entry.path"
                class="zip-file-item"
              >
                <span class="zip-file-path">{{ entry.path }}</span>
                <span class="zip-file-size"
                  >{{
                    entry.size === null ? "-" : `${(entry.size / 1024).toFixed(1)} KB`
                  }}</span
                >
              </li>
            </ul>
            <p v-if="!hasFiles" class="zip-hint">
              当前显示的是已保存文件，上传 ZIP 后会按新 ZIP 内容提交更新。
            </p>
          </template>
        </div>
        <input
          ref="zipFileInputRef"
          type="file"
          accept=".zip"
          class="hidden-file-input"
          @change="onZipChange"
        />
      </div>
    </div>

    <template #footer>
      <Button :disabled="submitting" @click="cancel">取 消</Button>
      <PrimaryButton :loading="submitting || extracting" @click="submit">
        {{ isEdit ? "保 存" : "创 建" }}
      </PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
}

.subtitle {
  font-size: 0.82rem;
  color: var(--foreground-muted);
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--foreground-muted);
  margin-bottom: 0.15rem;
}

.zip-upload-area {
  border: 1.5px dashed color-mix(in srgb, var(--primary) 35%, transparent);
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--primary) 3%, transparent);
}

.zip-pick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--primary);
  font-weight: 500;
  padding: 0.25rem 0;
  transition: opacity 150ms ease;
}

.zip-pick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zip-pick-btn:not(:disabled):hover {
  opacity: 0.8;
}

.zip-icon {
  font-size: 1.1rem;
}

.zip-hint {
  margin: 0.4rem 0 0;
  font-size: 0.75rem;
  color: var(--foreground-muted);
  line-height: 1.5;
}

.zip-info-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.zip-file-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--foreground);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zip-count {
  font-size: 0.78rem;
  color: var(--foreground-muted);
  white-space: nowrap;
}

.zip-clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.78rem;
  color: var(--danger, #e53e3e);
  padding: 0;
  white-space: nowrap;
  transition: opacity 150ms ease;
}

.zip-clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zip-clear-btn:not(:disabled):hover {
  opacity: 0.7;
}

.zip-file-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 10rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.zip-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--foreground) 4%, transparent);
}

.zip-file-path {
  font-family: var(--font-mono, monospace);
  font-size: 0.78rem;
  color: var(--foreground);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zip-file-size {
  font-size: 0.72rem;
  color: var(--foreground-muted);
  white-space: nowrap;
}

.hidden-file-input {
  display: none;
}
</style>
