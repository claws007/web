<script setup lang="ts">
import { computed, ref } from "vue";
import { api, type AgentFilePermissionResponse } from "@/api";
import Dialog, {
  createDialogExpose,
  useDialogContext,
} from "@/components/Dialog.vue";
import Input from "@/components/Input.vue";
import Switch from "@/components/Switch.vue";
import Button from "@/components/dialog/Button.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { notify } from "@/components/notification";

const props = defineProps<{
  agentId: number;
  permission?: AgentFilePermissionResponse;
}>();

const visible = ref(true);
const closing = ref(false);
const saving = ref(false);
const { resolve, reject } = useDialogContext<void>();

defineExpose(createDialogExpose<void>());

const isEditMode = computed(() => Boolean(props.permission));

const pathText = ref(props.permission?.path ?? "");
const mountPathText = ref(props.permission?.mountPath ?? "");
const canRead = ref(props.permission?.enabled ?? true);
const canWrite = ref(props.permission?.writable ?? false);

const title = computed(() => {
  return isEditMode.value ? "编辑文件权限" : "添加文件权限";
});

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

async function handleSave() {
  const path = pathText.value.trim();
  const mountPath = mountPathText.value.trim();

  if (!path) {
    notify.error("请输入宿主机路径");
    return;
  }

  if (!mountPath) {
    notify.error("请输入容器挂载路径");
    return;
  }

  saving.value = true;
  try {
    if (props.permission) {
      await api.agentFilePermission.putAgentFilePermissionById(
        props.permission.id,
        {
          path,
          mountPath,
          enabled: canRead.value,
          writable: canWrite.value,
        },
      );
      notify.success("文件权限已更新");
    } else {
      await api.agentFilePermission.postAgentFilePermission({
        agentId: props.agentId,
        path,
        mountPath,
        enabled: canRead.value,
        writable: canWrite.value,
      });
      notify.success("文件权限已添加");
    }

    close(() => resolve());
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存失败，请稍后重试";
    notify.error(message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog
    v-model="visible"
    width="34rem"
    @update:model-value="onModelValueChange"
  >
    <template #header>
      <div class="title">{{ title }}</div>
    </template>

    <div class="form-grid">
      <Input
        v-model="pathText"
        label="宿主机路径"
        placeholder="/host/path/to/dir"
      />
      <Input
        v-model="mountPathText"
        label="挂载路径"
        placeholder="/mount/path/in/container"
      />

      <div class="flags">
        <div class="flag-item">
          <Switch v-model="canRead" />
          <span>可读（enabled）</span>
        </div>
        <div class="flag-item">
          <Switch v-model="canWrite" />
          <span>可写（writable）</span>
        </div>
      </div>
    </div>

    <template #footer>
      <Button @click="cancel">取 消</Button>
      <PrimaryButton :loading="saving" @click="handleSave">保 存</PrimaryButton>
    </template>
  </Dialog>
</template>

<style scoped>
.title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--foreground);
}

.form-grid {
  display: grid;
  gap: 0.8rem;
}

.flags {
  display: flex;
  gap: 1.2rem;
  align-items: center;
  padding-top: 0.1rem;
}

.flag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.83rem;
  color: var(--foreground);
}
</style>
