<template>
  <Dialog :dialog :title="'文件列表管理'" :width>
    <template #autoPadding>
      <div class="h gap-3" style="min-height: 520px">
        <!-- Left panel: file tree + actions -->
        <div class="v gap-2" style="width: 320px; flex-shrink: 0">
          <!-- Action buttons -->
          <div class="h gap-1.5 items-center justify-end flex-wrap">
            <Button size="small" @click="handleCreateFile">创建文件</Button>
            <Button size="small" @click="handleCreateFolder">创建文件夹</Button>
            <Button size="small" type="primary" @click="triggerUpload"
              >上传</Button
            >
          </div>

          <!-- Hidden file input -->
          <input
            ref="fileInputRef"
            type="file"
            multiple
            style="display: none"
            @change="onFilesSelected"
          />

          <!-- Upload folder selector (appears after files are selected) -->
          <div
            v-if="pendingFiles.length > 0"
            class="v gap-2 rounded border p-2 bg-light-2 text-sm"
          >
            <div class="font-semibold">
              上传 {{ pendingFiles.length }} 个文件到：
            </div>
            <div
              class="overflow-y-auto border rounded bg-bg"
              style="max-height: 160px"
            >
              <!-- Root option -->
              <div
                :class="[
                  'h items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded text-sm',
                  uploadTargetPath === ''
                    ? 'bg-primary text-white'
                    : 'hover:bg-light-2',
                ]"
                @click="
                  uploadTargetPath = '';
                  uploadTargetNodeId = '';
                "
              >
                <AntdIcon icon="FolderOutlined" />
                / (根目录)
              </div>
              <Tree
                :loop-datas="folderTreeData"
                v-model="uploadTargetNodeId"
                expand-strategy="all"
              >
                <template #default="{ item }">
                  <div
                    :class="[
                      'h items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded text-sm w-full',
                      uploadTargetNodeId === item.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-light-2',
                    ]"
                    @click="
                      uploadTargetNodeId = item.id;
                      uploadTargetPath = item.data.path;
                    "
                  >
                    <AntdIcon icon="FolderOutlined" />
                    {{ item.data.name }}
                  </div>
                </template>
              </Tree>
            </div>
            <div class="h gap-2 justify-end">
              <Button size="small" @click="pendingFiles = []">取消</Button>
              <Button
                size="small"
                type="primary"
                :is-loading="isUploading"
                @click="confirmUpload"
                >确认上传</Button
              >
            </div>
          </div>

          <!-- File tree -->
          <div
            class="flex-1 overflow-y-auto border rounded"
            style="min-height: 360px"
          >
            <div v-if="isLoading" class="p-3 text-light text-sm">加载中...</div>
            <div
              v-else-if="treeData.length === 0"
              class="p-4 text-center text-light text-sm"
            >
              暂无文件，请创建或上传文件
            </div>
            <div v-else class="p-1">
              <Tree
                :loop-datas="treeData"
                v-model="selectedNodeId"
                expand-strategy="all"
              >
                <template #default="{ item }">
                  <div
                    :class="[
                      'h items-center gap-1.5 px-2 py-1 cursor-pointer rounded text-sm group/node w-full min-w-0',
                      selectedNodeId === item.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-light-2',
                    ]"
                    @click="onNodeClick(item)"
                  >
                    <Icon
                      :icon="
                        item.data.type === 'folder'
                          ? 'FolderOutlined'
                          : getFileIcon(item.data.name)
                      "
                      class="shrink-0 text-xs"
                    />
                    <span class="flex-1 truncate min-w-0">{{
                      item.data.name
                    }}</span>
                    <DefaultDropdownMenu
                      trigger="click"
                      placement="bottomRight"
                      :menus="
                        item.data.type === 'folder'
                          ? getFolderMenus(item)
                          : getFileMenus(item)
                      "
                    >
                      <div
                        :class="[
                          'opacity-0 group-hover/node:opacity-100 h items-center justify-center rounded px-1',
                          selectedNodeId === item.id
                            ? 'hover:bg-white/20'
                            : 'hover:bg-light-3',
                        ]"
                        @click.stop
                      >
                        <AntdIcon icon="MoreOutlined" />
                      </div>
                    </DefaultDropdownMenu>
                  </div>
                </template>
              </Tree>
            </div>
          </div>
        </div>

        <!-- Right panel: file editor -->
        <div
          class="v flex-1 border rounded overflow-hidden"
          style="min-width: 0"
        >
          <div
            v-if="!selectedFileEntry"
            class="h items-center justify-center flex-1 text-light text-sm"
          >
            选择文件以查看或编辑内容
          </div>
          <template v-else>
            <div
              class="h items-center justify-between gap-2 px-3 py-2 border-b bg-light-2 shrink-0"
            >
              <div class="text-sm font-semibold truncate">
                {{ getDisplayName(selectedFileEntry.file) }}
              </div>
              <div class="h gap-2">
                <Button size="small" @click="downloadSelectedFile">下载</Button>
                <Button
                  size="small"
                  type="primary"
                  :is-loading="isSaving"
                  @click="saveFileContent"
                  >保存</Button
                >
              </div>
            </div>
            <div
              v-if="isLoadingContent"
              class="h flex-1 items-center justify-center text-light text-sm"
            >
              加载内容中...
            </div>
            <ATextarea
              v-else
              v-model:value="editingContent"
              :bordered="false"
              :rows="20"
              class="flex-1 resize-none p-2 text-sm"
              style="font-family: monospace"
            />
          </template>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-2 rounded bg-[#fff1ef] px-3 py-2 text-sm text-danger"
      >
        {{ errorMessage }}
      </div>
    </template>

    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button type="primary" :is-loading="isSubmitting" @click="submit">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { api } from "@/api";
import type { DialogType } from "@/components/dialog/dialog";
import type { FileListFileResponse, FileResponse } from "@/api";
import { dialogs } from "@/components/dialog";
import type { LoopData } from "@/components/Loop.vue";
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileNodeData = {
  type: "folder" | "file";
  name: string;
  path: string;
  entry?: FileListFileResponse;
};
type FileTreeNode = LoopData<FileNodeData>;

// ─── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, number>;
    fileListId?: number | null;
    baseOnPath?: string | null;
    title?: string | null;
    width?: string;
  }>(),
  {
    fileListId: null,
    baseOnPath: null,
    title: null,
    width: "960px",
  },
);

// ─── State ────────────────────────────────────────────────────────────────────

const fileListId = ref<number | null>(props.fileListId ?? null);
const fileEntries = ref<FileListFileResponse[]>([]);
const localFolders = ref<string[]>([]); // virtual empty folders

const selectedNodeId = ref<string>("");
const editingContent = ref<string>("");
const isLoading = ref(false);
const isLoadingContent = ref(false);
const isSaving = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");

// Upload state
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingFiles = ref<File[]>([]);
const uploadTargetPath = ref<string>("");
const uploadTargetNodeId = ref<string>("");
const isUploading = ref(false);

// ─── Computed ─────────────────────────────────────────────────────────────────

const normalizedBaseOnPath = computed(() => normalizePath(props.baseOnPath));

const selectedFileEntry = computed<FileListFileResponse | null>(() => {
  if (!selectedNodeId.value.startsWith("file:")) return null;
  const entryId = parseInt(selectedNodeId.value.slice(5));
  return fileEntries.value.find((e) => e.id === entryId) ?? null;
});

const currentFolderPath = computed<string>(() => {
  if (!selectedNodeId.value) return "";
  if (selectedNodeId.value.startsWith("folder:")) {
    return selectedNodeId.value.slice(7);
  }
  if (selectedNodeId.value.startsWith("file:")) {
    const entry = selectedFileEntry.value;
    if (entry?.file.filePath) {
      const parts = entry.file.filePath.split("/");
      return parts.slice(0, -1).join("/");
    }
  }
  return "";
});

const allFolderPaths = computed<string[]>(() => {
  const paths = new Set<string>(localFolders.value);
  for (const entry of visibleFileEntries.value) {
    const fp = getRelativeFilePath(entry);
    if (fp && fp.includes("/")) {
      const parts = fp.split("/");
      for (let i = 1; i < parts.length; i++) {
        paths.add(parts.slice(0, i).join("/"));
      }
    }
  }
  return Array.from(paths).sort();
});

const visibleFileEntries = computed<FileListFileResponse[]>(() =>
  fileEntries.value.filter((entry) => getRelativeFilePath(entry) !== null),
);

const treeData = computed<FileTreeNode[]>(() =>
  buildFileTree(visibleFileEntries.value, localFolders.value),
);

const folderTreeData = computed<FileTreeNode[]>(() =>
  buildFolderTree(allFolderPaths.value),
);

// ─── Tree builders ────────────────────────────────────────────────────────────

function buildFileTree(
  entries: FileListFileResponse[],
  folders: string[],
): FileTreeNode[] {
  const folderMap = new Map<string, FileTreeNode>();
  const root: FileTreeNode[] = [];

  function getOrCreateFolder(folderPath: string): FileTreeNode {
    if (folderMap.has(folderPath)) return folderMap.get(folderPath)!;
    const parts = folderPath.split("/");
    const name = parts[parts.length - 1] ?? folderPath;
    const parentPath = parts.slice(0, -1).join("/");

    const node: FileTreeNode = {
      id: "folder:" + folderPath,
      data: { type: "folder", name, path: folderPath },
      children: [],
    };
    folderMap.set(folderPath, node);

    if (parentPath) {
      getOrCreateFolder(parentPath).children.push(node);
    } else {
      root.push(node);
    }
    return node;
  }

  for (const folder of folders) {
    getOrCreateFolder(folder);
  }

  for (const entry of entries) {
    const fp = getRelativeFilePath(entry);
    if (fp === null) {
      continue;
    }
    const name = fp
      ? fp.includes("/")
        ? (fp.split("/").pop() ?? fp)
        : fp
      : entry.file.objectName;

    const fileNode: FileTreeNode = {
      id: "file:" + entry.id,
      data: { type: "file", name, path: fp ?? entry.file.objectName, entry },
      children: [],
    };

    if (fp && fp.includes("/")) {
      const parentPath = fp.split("/").slice(0, -1).join("/");
      getOrCreateFolder(parentPath).children.push(fileNode);
    } else {
      root.push(fileNode);
    }
  }

  return root;
}

function buildFolderTree(folderPaths: string[]): FileTreeNode[] {
  const folderMap = new Map<string, FileTreeNode>();
  const root: FileTreeNode[] = [];

  for (const folderPath of folderPaths) {
    if (folderMap.has(folderPath)) continue;
    const parts = folderPath.split("/");
    const name = parts[parts.length - 1] ?? folderPath;
    const parentPath = parts.slice(0, -1).join("/");

    const node: FileTreeNode = {
      id: "folder:" + folderPath,
      data: { type: "folder", name, path: folderPath },
      children: [],
    };
    folderMap.set(folderPath, node);

    if (parentPath && folderMap.has(parentPath)) {
      folderMap.get(parentPath)!.children.push(node);
    } else {
      root.push(node);
    }
  }

  return root;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (fileListId.value != null) {
    await loadFiles();
  }
});

// ─── File list operations ─────────────────────────────────────────────────────

async function loadFiles() {
  if (fileListId.value == null) return;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await api.fileList.getFileListByListIdFiles(
      fileListId.value,
    );
    fileEntries.value = response.data;
  } catch {
    errorMessage.value = "加载文件列表失败。";
  } finally {
    isLoading.value = false;
  }
}

async function ensureFileListId(): Promise<number> {
  if (fileListId.value != null) return fileListId.value;
  const response = await api.fileList.postFileList({});
  fileListId.value = response.data.id;
  return fileListId.value;
}

// ─── Create file ──────────────────────────────────────────────────────────────

async function handleCreateFile() {
  const name = await dialogs
    .InputDialog({
      title: "创建文件",
      placeholder: "文件名（例如：readme.md）",
    })
    .finishPromise((value) => value);

  if (!name?.trim()) return;

  const fileName = name.trim();
  const folderPath = currentFolderPath.value;
  const virtualPath = folderPath ? `${folderPath}/${fileName}` : fileName;

  errorMessage.value = "";
  try {
    const listId = await ensureFileListId();

    const uploadResp = await api.file.postFileUpload({
      fileName,
      contentBase64: "",
      filePath: toFullPath(virtualPath),
    });

    await api.fileList.postFileListByListIdFiles(listId, {
      fileId: uploadResp.data.id,
    });

    await loadFiles();

    const newEntry = fileEntries.value.find(
      (e) => e.fileId === uploadResp.data.id,
    );
    if (newEntry) {
      selectedNodeId.value = "file:" + newEntry.id;
    }
  } catch {
    errorMessage.value = "创建文件失败。";
  }
}

// ─── Create folder ────────────────────────────────────────────────────────────

async function handleCreateFolder() {
  const name = await dialogs
    .InputDialog({
      title: "创建文件夹",
      placeholder: "文件夹名",
    })
    .finishPromise((value) => value);

  if (!name?.trim()) return;

  const folderName = name.trim();
  const parentPath = currentFolderPath.value;
  const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;

  if (!localFolders.value.includes(fullPath)) {
    localFolders.value = [...localFolders.value, fullPath];
  }

  selectedNodeId.value = "folder:" + fullPath;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

function triggerUpload() {
  fileInputRef.value?.click();
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  pendingFiles.value = Array.from(input.files);
  uploadTargetPath.value = currentFolderPath.value;
  uploadTargetNodeId.value = currentFolderPath.value
    ? "folder:" + currentFolderPath.value
    : "";
  input.value = "";
}

async function confirmUpload() {
  if (!pendingFiles.value.length) return;

  isUploading.value = true;
  errorMessage.value = "";
  try {
    const listId = await ensureFileListId();

    for (const file of pendingFiles.value) {
      const fileName = file.name;
      const virtualPath = uploadTargetPath.value
        ? `${uploadTargetPath.value}/${fileName}`
        : fileName;

      const contentBase64 = await fileToBase64(file);

      const uploadResp = await api.file.postFileUpload({
        fileName,
        contentBase64,
        contentType: file.type || undefined,
        filePath: toFullPath(virtualPath),
      });

      await api.fileList.postFileListByListIdFiles(listId, {
        fileId: uploadResp.data.id,
      });
    }

    pendingFiles.value = [];
    await loadFiles();
  } catch {
    errorMessage.value = "上传文件失败。";
  } finally {
    isUploading.value = false;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Node click ───────────────────────────────────────────────────────────────

function onNodeClick(item: FileTreeNode) {
  selectedNodeId.value = item.id;
}

// ─── File content ─────────────────────────────────────────────────────────────

watch(selectedFileEntry, async (entry) => {
  editingContent.value = "";
  if (!entry) return;

  isLoadingContent.value = true;
  try {
    const response = await api.file.getFileByIdDownload(entry.fileId);
    const blob = response.data as unknown as Blob;
    editingContent.value = await blob.text();
  } catch {
    editingContent.value = "";
  } finally {
    isLoadingContent.value = false;
  }
});

async function saveFileContent() {
  const entry = selectedFileEntry.value;
  if (!entry || fileListId.value == null) return;

  isSaving.value = true;
  errorMessage.value = "";
  try {
    const fp = entry.file.filePath ?? entry.file.objectName;
    const fileName = fp.includes("/") ? (fp.split("/").pop() ?? fp) : fp;
    const contentBase64 = btoa(
      unescape(encodeURIComponent(editingContent.value)),
    );

    const uploadResp = await api.file.postFileUpload({
      fileName,
      contentBase64,
      filePath: fp,
    });

    await api.fileList.postFileListByListIdFiles(fileListId.value, {
      fileId: uploadResp.data.id,
    });

    const oldEntryId = entry.id;
    const oldFileId = entry.fileId;
    await api.fileList.deleteFileListByListIdFilesByEntryId(
      fileListId.value,
      oldEntryId,
    );
    await api.file.deleteFileById(oldFileId);

    await loadFiles();

    const newEntry = fileEntries.value.find(
      (e) => e.fileId === uploadResp.data.id,
    );
    if (newEntry) {
      selectedNodeId.value = "file:" + newEntry.id;
    }
  } catch {
    errorMessage.value = "保存文件失败。";
  } finally {
    isSaving.value = false;
  }
}

async function downloadSelectedFile() {
  const entry = selectedFileEntry.value;
  if (!entry) return;

  try {
    const response = await api.file.getFileByIdDownload(entry.fileId);
    const blob = response.data as unknown as Blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getDisplayName(entry.file);
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    errorMessage.value = "下载文件失败。";
  }
}

// ─── CRUD context menus ───────────────────────────────────────────────────────

function getFileMenus(item: FileTreeNode): Menu[] {
  return [
    {
      name: "重命名",
      click: () => handleRenameFile(item),
    },
    {
      name: "下载",
      click: () => {
        selectedNodeId.value = item.id;
        downloadSelectedFile();
      },
    },
    { divider: true },
    {
      name: "删除",
      danger: true,
      click: () => handleDeleteFile(item),
    },
  ];
}

function getFolderMenus(item: FileTreeNode): Menu[] {
  return [
    {
      name: "在此创建文件",
      click: () => {
        selectedNodeId.value = item.id;
        handleCreateFile();
      },
    },
    {
      name: "在此创建子文件夹",
      click: () => {
        selectedNodeId.value = item.id;
        handleCreateFolder();
      },
    },
    { divider: true },
    {
      name: "删除文件夹",
      danger: true,
      click: () => handleDeleteFolder(item),
    },
  ];
}

async function handleRenameFile(item: FileTreeNode) {
  const entry = item.data.entry;
  if (!entry) return;

  const currentName = getDisplayName(entry.file);
  const newName = await dialogs
    .InputDialog({
      title: "重命名文件",
      value: currentName,
      placeholder: "新文件名",
    })
    .finishPromise((value) => value);

  if (!newName?.trim() || newName.trim() === currentName) return;

  const trimmedName = newName.trim();
  errorMessage.value = "";
  try {
    const listId = await ensureFileListId();
    const fp = entry.file.filePath ?? entry.file.objectName;
    const parentPath = fp.includes("/")
      ? fp.split("/").slice(0, -1).join("/")
      : "";
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const contentResp = await api.file.getFileByIdDownload(entry.fileId);
    const blob = contentResp.data as unknown as Blob;
    const contentBase64 = await blobToBase64(blob);

    const uploadResp = await api.file.postFileUpload({
      fileName: trimmedName,
      contentBase64,
      filePath: newPath,
    });

    await api.fileList.postFileListByListIdFiles(listId, {
      fileId: uploadResp.data.id,
    });
    await api.fileList.deleteFileListByListIdFilesByEntryId(listId, entry.id);
    await api.file.deleteFileById(entry.fileId);

    await loadFiles();

    const newEntry = fileEntries.value.find(
      (e) => e.fileId === uploadResp.data.id,
    );
    if (newEntry) selectedNodeId.value = "file:" + newEntry.id;
  } catch {
    errorMessage.value = "重命名文件失败。";
  }
}

async function handleDeleteFile(item: FileTreeNode) {
  const entry = item.data.entry;
  if (!entry) return;

  const confirmed = await dialogs
    .ConfirmDialog({
      title: "删除文件",
      content: `确认删除文件「${getDisplayName(entry.file)}」？此操作无法撤销。`,
    })
    .finallyPromise((isFinished) => isFinished);

  if (!confirmed) return;

  errorMessage.value = "";
  try {
    const listId = await ensureFileListId();
    await api.fileList.deleteFileListByListIdFilesByEntryId(listId, entry.id);
    await api.file.deleteFileById(entry.fileId);
    if (selectedNodeId.value === item.id) selectedNodeId.value = "";
    await loadFiles();
  } catch {
    errorMessage.value = "删除文件失败。";
  }
}

async function handleDeleteFolder(item: FileTreeNode) {
  const folderPath = item.data.path;
  const fullFolderPath = toFullPath(folderPath);

  const confirmed = await dialogs
    .ConfirmDialog({
      title: "删除文件夹",
      content: `确认删除文件夹「${item.data.name}」及其所有内容？此操作无法撤销。`,
    })
    .finallyPromise((isFinished) => isFinished);

  if (!confirmed) return;

  errorMessage.value = "";
  try {
    const listId = await ensureFileListId();
    const toDelete = fileEntries.value.filter((e) => {
      const fp = normalizePath(e.file.filePath);
      if (!fp) {
        return false;
      }
      return fp === fullFolderPath || fp.startsWith(fullFolderPath + "/");
    });

    for (const entry of toDelete) {
      await api.fileList.deleteFileListByListIdFilesByEntryId(listId, entry.id);
      await api.file.deleteFileById(entry.fileId);
    }

    localFolders.value = localFolders.value.filter(
      (f) => f !== folderPath && !f.startsWith(folderPath + "/"),
    );

    if (
      selectedNodeId.value === item.id ||
      selectedNodeId.value.startsWith("folder:" + folderPath + "/") ||
      toDelete.some((e) => selectedNodeId.value === "file:" + e.id)
    ) {
      selectedNodeId.value = "";
    }

    await loadFiles();
  } catch {
    errorMessage.value = "删除文件夹失败。";
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submit() {
  isSubmitting.value = true;
  errorMessage.value = "";
  try {
    if (fileListId.value == null) {
      const response = await api.fileList.postFileList({});
      fileListId.value = response.data.id;
    }
    props.dialog.finish(fileListId.value!);
  } catch {
    errorMessage.value = "操作失败。";
    isSubmitting.value = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayName(file: FileResponse): string {
  const fp = file.filePath;
  if (!fp) return file.objectName;
  return fp.includes("/") ? (fp.split("/").pop() ?? fp) : fp;
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const textExts = [
    "txt",
    "md",
    "json",
    "js",
    "ts",
    "vue",
    "html",
    "css",
    "py",
    "java",
    "go",
    "rs",
    "cpp",
    "c",
    "h",
    "xml",
    "yaml",
    "yml",
    "toml",
    "sh",
    "bat",
    "sql",
  ];
  if (ext && textExts.includes(ext)) return "FileTextOutlined";
  return "FileOutlined";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function normalizePath(path?: string | null): string {
  if (!path) {
    return "";
  }

  return path
    .trim()
    .replace(/\\+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function getRelativeFilePath(entry: FileListFileResponse): string | null {
  const fullPath = normalizePath(entry.file.filePath);
  const objectName = normalizePath(entry.file.objectName);
  const basePath = normalizedBaseOnPath.value;

  if (!basePath) {
    return fullPath || objectName;
  }

  if (fullPath === basePath) {
    return "";
  }

  if (fullPath.startsWith(basePath + "/")) {
    return fullPath.slice(basePath.length + 1);
  }

  return null;
}

function toFullPath(relativePath: string): string {
  const normalizedRelativePath = normalizePath(relativePath);
  const basePath = normalizedBaseOnPath.value;

  if (!basePath) {
    return normalizedRelativePath;
  }

  return normalizedRelativePath
    ? `${basePath}/${normalizedRelativePath}`
    : basePath;
}
</script>
