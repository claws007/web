<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getImageUrlByFileId, type AgentResponse } from "@/api";

const props = defineProps<{
  agent: AgentResponse;
}>();

const avatarLoadFailed = ref(false);

watch(
  () => props.agent.avatarFileId,
  () => {
    avatarLoadFailed.value = false;
  },
);

const avatarUrl = computed(() => {
  if (avatarLoadFailed.value) {
    return null;
  }

  return getImageUrlByFileId(props.agent.avatarFileId);
});

const avatarText = computed(() => {
  const name = props.agent.name?.trim();
  if (!name) {
    return "AG";
  }

  return name.slice(0, 2).toUpperCase();
});

const agentName = computed(() => props.agent.name || "未命名 Agent");

const abilityIntro = computed(() => {
  return (
    props.agent.capacity?.trim() ||
    props.agent.description?.trim() ||
    "暂无能力简介"
  );
});

const modelName = computed(() => {
  return (
    props.agent.modelConnector?.name?.trim() || props.agent.model?.trim() || "-"
  );
});

const sandboxLabel = computed(() => {
  if (!props.agent.sandboxType || props.agent.sandboxType === "NONE") {
    return "无沙箱";
  }

  if (props.agent.sandboxType === "DOCKER") {
    return "Docker";
  }

  return props.agent.sandboxType;
});
</script>

<template>
  <article class="agent-card" role="region" :aria-label="agentName">
    <div class="agent-main">
      <div class="agent-avatar-wrap">
        <img
          v-if="avatarUrl"
          class="agent-avatar-image"
          :src="avatarUrl"
          :alt="`${agentName} 头像`"
          @error="avatarLoadFailed = true"
        />
        <div v-else class="agent-avatar" aria-hidden="true">
          {{ avatarText }}
        </div>
      </div>

      <div class="agent-content">
        <h3 class="agent-name" :title="agentName">{{ agentName }}</h3>
        <p class="agent-intro" :title="abilityIntro">{{ abilityIntro }}</p>
      </div>
    </div>

    <div class="agent-meta">
      <span class="meta-chip" :title="`模型: ${modelName}`"
        >模型: {{ modelName }}</span
      >
      <span class="meta-chip">{{ sandboxLabel }}</span>
    </div>
  </article>
</template>

<style scoped>
.agent-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  border-radius: 1rem;
  padding: 1rem;
  background: linear-gradient(
    160deg,
    rgb(255 255 255 / 0.9),
    rgb(242 250 252 / 0.88)
  );
  border: 1px solid rgb(34 211 238 / 0.2);
  box-shadow: 0 14px 36px -26px rgb(0 104 119 / 0.55);
  backdrop-filter: blur(8px);
}

.agent-main {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  min-width: 0;
}

.agent-avatar-wrap {
  flex-shrink: 0;
  width: 2.7rem;
  height: 2.7rem;
}

.agent-avatar,
.agent-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 999px;
}

.agent-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.agent-avatar-image {
  display: block;
  object-fit: cover;
  border: 1px solid rgb(34 211 238 / 0.25);
}

.agent-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.agent-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--on-surface);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-intro {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.86rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.agent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
  color: rgb(16 67 77);
  background: rgb(224 248 253 / 0.95);
  border: 1px solid rgb(164 48 115 / 0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .agent-card {
    padding: 0.9rem;
  }

  .agent-avatar-wrap {
    width: 2.4rem;
    height: 2.4rem;
  }
}
</style>
