<template>
  <div class="home-page">
    <!-- 头部：标题 + 新建按钮 -->
    <section class="agents-section">
      <div class="section-header">
        <div class="v gap-1">
          <div class="text-xl font-bold">智能体列表</div>
          <div class="text-sm text-(--on-surface-variant)">Agents</div>
        </div>
        <button
          class="add-agent-btn"
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
      <div v-if="loading" class="state-placeholder">
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span class="loading-dot" />
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="state-placeholder state-error">
        {{ error }}
      </div>

      <!-- 空列表 -->
      <div
        v-else-if="agents.length === 0"
        class="state-placeholder state-empty"
      >
        暂无智能体，点击「新建」创建第一个 Agent
      </div>

      <!-- Agent 卡片列表 -->
      <div v-else class="agents-grid">
        <AgentCard v-for="agent in agents" :key="agent.id" :agent="agent" />
      </div>
    </section>
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

<style scoped>
.home-page {
  height: 100%;
  overflow-y: auto;
  padding: 2.5rem;
}

.agents-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-agent-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.2rem;
  padding: 0 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.add-agent-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.add-agent-btn:active {
  transform: translateY(0);
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}

/* ── 状态占位 ── */
.state-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 12rem;
  color: var(--on-surface-variant);
  font-size: 0.9rem;
}

.state-error {
  color: #c0392b;
}

.state-empty {
  flex-direction: column;
}

/* 加载点动画 */
.loading-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
