<template>
  <div class="h-full overflow-y-auto p-10 h items-stretch">
    <!-- 头部：标题 + 新建按钮 -->
    <section class="flex flex-col gap-6 flex-2">
      <div class="flex items-center justify-between">
        <div class="v gap-1">
          <div class="text-xl font-bold">智能体列表</div>
          <div class="text-sm text-(--on-surface-variant)">Agents</div>
        </div>
        <button
          class="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border-0 bg-linear-to-br from-primary to-secondary px-4 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
          title="新建 Agent"
          aria-label="新建 Agent"
          @click="dialogs.EditOrCreateAgentDialog()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>新建</span>
        </button>
      </div>

      <!-- 加载中 -->
      <div
        v-if="loading"
        class="flex min-h-48 items-center justify-center gap-2 text-sm text-(--on-surface-variant)"
      >
        <span class="size-2.5 animate-pulse rounded-full bg-primary" />
        <span
          class="size-2.5 animate-pulse rounded-full bg-primary [animation-delay:0.2s]"
        />
        <span
          class="size-2.5 animate-pulse rounded-full bg-primary [animation-delay:0.4s]"
        />
      </div>

      <!-- 错误 -->
      <div
        v-else-if="error"
        class="flex min-h-48 items-center justify-center gap-2 text-sm text-[#c0392b]"
      >
        {{ error }}
      </div>

      <!-- 空列表 -->
      <div
        v-else-if="agents.length === 0"
        class="flex min-h-48 flex-col items-center justify-center gap-2 text-sm text-(--on-surface-variant)"
      >
        暂无智能体，点击「新建」创建第一个 Agent
      </div>

      <!-- Agent 卡片列表 -->
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4"
      >
        <AgentCard v-for="agent in agents" :key="agent.id" :agent="agent" />
      </div>
    </section>
    <div class="flex-5">hello</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, type AgentResponse } from "@/api";
import AgentCard from "@/components/AgentCard.vue";
import { dialogs } from "virtual:dialogs";

const agents = ref<AgentResponse[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function fetchAgents() {
  loading.value = true;
  error.value = null;

  try {
    const res = await api.agent.getAgent({ subAgents: false });
    agents.value = res.data?.items ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "获取智能体列表失败，请重试";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAgents);
</script>
