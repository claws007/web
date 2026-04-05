<script setup lang="ts">
import { computed } from "vue";
import { dialogs } from "virtual:dialogs";
import { api, getImageUrlByFileId, type AgentResponse } from "@/api";
import type { DropdownMenuItem } from "@/components/DropdownMenu.vue";
import type {
  SelectOptionDialogOption,
  SelectOptionDialogSearchResult,
} from "@/components/dialog/SelectOptionDialog.vue";

type AgentWithBuiltin = AgentResponse & {
  builtin?: boolean | null;
  builtinType?: "SYSTEM_ASSISTANT" | null;
};

export type AssignableAgent = {
  id: number;
  name: string;
  avatarFileId?: number | null;
  capacity?: string | null;
  extraPrompt?: string | null;
};

export type AgentAssignmentValue =
  | {
      mode: "auto";
      agent: null;
    }
  | {
      mode: "manual";
      agent: AssignableAgent;
    };

const props = withDefaults(
  defineProps<{
    modelValue?: AgentAssignmentValue;
    disabled?: boolean;
  }>(),
  {
    modelValue: () => ({ mode: "auto", agent: null }),
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: AgentAssignmentValue];
  change: [value: AgentAssignmentValue];
}>();

let cachedManualAgents: AssignableAgent[] | null = null;

const isManualSelected = computed(
  () => props.modelValue.mode === "manual" && Boolean(props.modelValue.agent),
);

const avatarUrl = computed(() => {
  if (props.modelValue.mode !== "manual") {
    return null;
  }
  return getImageUrlByFileId(props.modelValue.agent.avatarFileId);
});

const avatarText = computed(() => {
  if (props.modelValue.mode !== "manual") {
    return "A";
  }

  const value = props.modelValue.agent.name.trim();
  return value ? value.slice(0, 1).toUpperCase() : "A";
});

const triggerText = computed(() => {
  if (props.modelValue.mode === "manual") {
    return props.modelValue.agent.name;
  }
  return "自动分配";
});

const menus = computed<DropdownMenuItem[]>(() => [
  {
    key: "auto",
    label:
      props.modelValue.mode === "auto"
        ? "✓ 由系统助理自动分配"
        : "由系统助理自动分配",
    description: "使用内置系统助理自动接管任务分配",
  },
  {
    key: "manual",
    label: isManualSelected.value ? "✓ 选择员工" : "选择员工",
    description: "打开员工列表，选择一个具体 Agent",
  },
]);

function isBuiltinAssistantAgent(agent: AgentWithBuiltin) {
  return agent.builtinType === "SYSTEM_ASSISTANT";
}

function updateValue(nextValue: AgentAssignmentValue) {
  emit("update:modelValue", nextValue);
  emit("change", nextValue);
}

function toAssignableAgent(agent: AgentResponse): AssignableAgent {
  return {
    id: agent.id,
    name: agent.name?.trim() || `Agent #${agent.id}`,
    avatarFileId: agent.avatarFileId ?? null,
    capacity: agent.capacity ?? null,
    extraPrompt: agent.extraPrompt ?? null,
  };
}

async function loadManualAgents() {
  if (cachedManualAgents) {
    return cachedManualAgents;
  }

  const response = await api.agent.getAgent({ subAgents: false } as any);
  const allAgents = ((response.data?.items ?? []) as AgentWithBuiltin[])
    .filter((agent) => !isBuiltinAssistantAgent(agent))
    .map((agent) => toAssignableAgent(agent));

  cachedManualAgents = allAgents;
  return allAgents;
}

function buildAgentOptions(
  agents: AssignableAgent[],
  keyword: string,
  page: number,
  pageSize: number,
): SelectOptionDialogSearchResult {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredAgents = normalizedKeyword
    ? agents.filter((agent) => {
        const candidates = [
          agent.name,
          agent.capacity ?? "",
          agent.extraPrompt ?? "",
        ];
        return candidates.some((item) =>
          item.toLowerCase().includes(normalizedKeyword),
        );
      })
    : agents;

  const start = Math.max(0, (page - 1) * pageSize);
  const pagedAgents = filteredAgents.slice(start, start + pageSize);
  const items: Array<SelectOptionDialogOption & AssignableAgent> =
    pagedAgents.map((agent) => ({
      ...agent,
      id: agent.id,
      label: agent.name,
      description: agent.capacity || agent.extraPrompt || "暂无补充说明",
      keywords: [agent.name, agent.capacity ?? "", agent.extraPrompt ?? ""],
    }));

  return {
    items,
    total: filteredAgents.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filteredAgents.length / pageSize)),
  };
}

async function openAgentSelector() {
  try {
    const agents = await loadManualAgents();

    if (!agents.length) {
      await dialogs.MessageDialog({
        type: "error",
        content: "暂无可选员工，请先创建 Agent",
      });
      return;
    }

    const result = await dialogs.SelectOptionDialog({
      title: "选择员工",
      description: "分页搜索并绑定一个具体 Agent",
      modelValue:
        props.modelValue.mode === "manual" ? props.modelValue.agent.id : null,
      pageSize: 10,
      searchPlaceholder: "按名称或能力搜索员工",
      emptyText: "暂无匹配员工",
      loadingText: "正在加载员工列表...",
      debounceMs: 120,
      width: "42rem",
      fetchOptions: async ({ keyword, page, pageSize }) =>
        buildAgentOptions(agents, keyword, page, pageSize),
    });

    if (result.type !== "resolve" || !result.value) {
      return;
    }

    const selectedAgentId = Number(result.value.id);
    const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
    if (!selectedAgent) {
      return;
    }

    updateValue({
      mode: "manual",
      agent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        avatarFileId: selectedAgent.avatarFileId ?? null,
        capacity: selectedAgent.capacity ?? null,
        extraPrompt: selectedAgent.extraPrompt ?? null,
      },
    });
  } catch (cause) {
    await dialogs.MessageDialog({
      type: "error",
      content: cause instanceof Error ? cause.message : "加载员工列表失败",
    });
  }
}

async function handleMenuSelect(menu: DropdownMenuItem) {
  if (props.disabled) {
    return;
  }

  if (menu.key === "auto") {
    updateValue({ mode: "auto", agent: null });
    return;
  }

  await openAgentSelector();
}
</script>

<template>
  <DropdownMenu
    :menus="menus"
    :disabled="disabled"
    placement="bottom"
    @select="handleMenuSelect"
  >
    <template #trigger>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-foreground transition-colors duration-150 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
      >
        <span
          v-if="isManualSelected"
          class="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,white)] bg-white/80 px-2.5 py-1 text-foreground shadow-[0_10px_24px_rgb(0_104_119/0.08)]"
        >
          <span
            class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-[11px] font-semibold text-primary"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="triggerText"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ avatarText }}</span>
          </span>
          <span class="max-w-44 truncate">{{ triggerText }}</span>
        </span>
        <span v-else>{{ triggerText }}</span>
        <span class="text-xs text-foreground-muted">▾</span>
      </button>
    </template>
  </DropdownMenu>
</template>
