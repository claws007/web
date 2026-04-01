<template>
  <section
    v-if="comments.length > 0"
    class="v bg-primary/8 px-3 rounded-md divide-y divide-primary/20 divide-dashed"
  >
    <article v-for="comment in comments" :key="comment.id" class="py-3">
      <div class="flex items-start gap-2">
        <div class="mt-0.5 shrink-0">
          <img
            v-if="getUserAvatarUrl(comment)"
            :src="getUserAvatarUrl(comment)!"
            :alt="getUserDisplayName(comment)"
            class="size-7 rounded-full object-cover"
          />
          <div
            v-else
            class="grid size-7 place-items-center rounded-full bg-cyan-500 text-xs font-semibold text-white"
          >
            {{ getUserDisplayName(comment).charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="min-w-0 flex-1 v">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0 flex items-center gap-2">
              <span class="truncate text-xs font-semibold text-gray-800">
                {{ getUserDisplayName(comment) }}
              </span>
              <TimeDisplay
                class="text-[11px] text-gray-400"
                :timestamp="comment.updatedAt || comment.createdAt"
              />
            </div>
            <div
              v-if="isOwnComment(comment)"
              class="flex shrink-0 items-center gap-2 text-[11px]"
            >
              <button
                class="cursor-pointer text-cyan-700 hover:opacity-70"
                :disabled="saving"
                @click.stop="editComment(comment)"
              >
                编辑
              </button>
              <button
                class="cursor-pointer text-red-600 hover:opacity-70"
                :disabled="saving"
                @click.stop="removeComment(comment)"
              >
                删除
              </button>
            </div>
          </div>
          <p
            :title="comment.content"
            class="whitespace-pre-wrap break-all text-xs leading-5 text-gray-700 line-clamp-2"
          >
            {{ comment.content }}
          </p>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { api, getImageUrlByFileId, type AgentTaskCommentResponse } from "@/api";
import TimeDisplay from "@/components/TimeDisplay.vue";
import { notify } from "@/components/notification";
import { dialogs } from "virtual:dialogs";
import { ref, watch } from "vue";
import { useUserStore } from "@/store/user";

const props = defineProps<{
  agentTaskId: number;
}>();

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const comments = ref<AgentTaskCommentResponse[]>([]);

async function loadComments() {
  loading.value = true;
  try {
    const res = await api.agentTask.getAgentTaskByIdComments(
      props.agentTaskId,
      {
        page: 1,
        pageSize: 100,
      },
    );
    comments.value = res.data.items ?? [];
  } catch (error) {
    notify.error(error instanceof Error ? error.message : "加载评论失败");
  } finally {
    loading.value = false;
  }
}

function getUserDisplayName(comment: AgentTaskCommentResponse) {
  return comment.user?.name || comment.user?.email || `User #${comment.userId}`;
}

function getUserAvatarUrl(comment: AgentTaskCommentResponse) {
  return getImageUrlByFileId(comment.user?.avatarFileId ?? null);
}

function isOwnComment(comment: AgentTaskCommentResponse) {
  return comment.userId === userStore.user?.id;
}

async function openCreateDialog() {
  const result = await dialogs.TextPromptDialog({
    title: "添加 Comment",
    description:
      "可用于修正方向、补充上下文，或给当前 AgentTask 添加额外信息。",
    placeholder: "输入 Comment 内容",
    confirmText: "添 加",
    required: true,
    rows: 5,
  });
  if (result.type !== "resolve") {
    return;
  }

  saving.value = true;
  try {
    const created = await api.agentTask.postAgentTaskByIdComments(
      props.agentTaskId,
      {
        content: result.value,
      },
    );
    comments.value = [created.data, ...comments.value];
    notify.success("Comment 已添加");
  } catch (error) {
    notify.error(error instanceof Error ? error.message : "添加 Comment 失败");
  } finally {
    saving.value = false;
  }
}

async function editComment(comment: AgentTaskCommentResponse) {
  const result = await dialogs.TextPromptDialog({
    title: "编辑 Comment",
    description: "更新这条补充说明。",
    placeholder: "输入 Comment 内容",
    initialValue: comment.content,
    confirmText: "保 存",
    required: true,
    rows: 5,
  });
  if (result.type !== "resolve") {
    return;
  }

  saving.value = true;
  try {
    const updated = await api.agentTask.putAgentTaskCommentByCommentId(
      comment.id,
      {
        content: result.value,
      },
    );
    comments.value = comments.value.map((item) =>
      item.id === comment.id ? updated.data : item,
    );
    notify.success("Comment 已更新");
  } catch (error) {
    notify.error(error instanceof Error ? error.message : "更新 Comment 失败");
  } finally {
    saving.value = false;
  }
}

async function removeComment(comment: AgentTaskCommentResponse) {
  dialogs
    .ConfirmDialog({
      title: "删除 Comment",
      content: "确定删除这条 Comment 吗？",
      confirmText: "删 除",
      confirmType: "danger",
    })
    .resolve(async () => {
      saving.value = true;
      try {
        await api.agentTask.deleteAgentTaskCommentByCommentId(comment.id);
        comments.value = comments.value.filter(
          (item) => item.id !== comment.id,
        );
        notify.success("Comment 已删除");
      } catch (error) {
        notify.error(
          error instanceof Error ? error.message : "删除 Comment 失败",
        );
      } finally {
        saving.value = false;
      }
    });
}

watch(() => props.agentTaskId, loadComments, { immediate: true });

defineExpose({
  openCreateDialog,
  reload: loadComments,
});
</script>
