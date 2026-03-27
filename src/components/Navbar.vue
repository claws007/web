<template>
  <header
    class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-[#ffffff55] backdrop-blur-md px-4"
  >
    <FlowPrimaryText>{{ currentCompanyName }}</FlowPrimaryText>
    <div class="flex items-center gap-2 md:gap-3">
      <DropdownMenu
        placement="bottom"
        :menus="settingMenus"
        @select="handleSettingMenuSelect"
      >
        <template #trigger="{ open }">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--primary)_18%,white)] bg-[rgb(255_255_255/0.22)] text-foreground shadow-[0_8px_24px_rgb(0_104_119/0.08)] backdrop-blur-md transition-colors duration-200 hover:bg-[rgb(255_255_255/0.32)]"
            :aria-expanded="open"
            aria-label="打开设置菜单"
            title="设置"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="transition-transform duration-200"
              :class="{ 'rotate-90': open }"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 7.2a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.25V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
          </button>
        </template>
      </DropdownMenu>

      <Button
        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-200 text-sm font-semibold text-orange-700"
        title="退出登录"
        @click="handleLogout"
      >
        {{ userInitial }}
      </Button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DropdownMenu, {
  type DropdownMenuItem,
} from "@/components/DropdownMenu.vue";
import { api, readStoredActiveCompanyId } from "@/api";
import { useUserStore } from "@/store/user";
import { RouteName } from "@/router/route-name";
import { msg } from "@/utils/message";
import { dialogs } from "virtual:dialogs";

const router = useRouter();
const userStore = useUserStore();
const activeCompanyId = ref<number | null>(readStoredActiveCompanyId());
const dockerAvailable = ref(true);
const dockerUnavailableReason = ref("");

const currentCompanyName = computed(() => {
  if (!userStore.companies.length) {
    return "选择公司";
  }

  const matched = userStore.companies.find(
    (company) => company.id === activeCompanyId.value,
  );

  return matched?.name || userStore.companies[0]?.name || "选择公司";
});

const settingMenus = computed<DropdownMenuItem[]>(() => [
  { key: "model-connector", label: "Model Connector" },
  {
    key: "docker-image",
    label: "Docker Image",
    disabled: !dockerAvailable.value,
    description: !dockerAvailable.value
      ? dockerUnavailableReason.value || "Docker 不可用"
      : undefined,
  },
  { key: "mcp-server", label: "MCP-Server" },
  { key: "skill", label: "Skill" },
]);

const userInitial = computed(() => {
  const name = userStore.user?.name || userStore.user?.email || "User";
  return name.charAt(0).toUpperCase();
});

function handleLogout() {
  userStore.logout();
  router.replace({ name: RouteName.Login });
}

async function handleSettingMenuSelect(menu: DropdownMenuItem) {
  if (menu.key === "model-connector") {
    await dialogs.ManageModelConnectorDialog();
    return;
  }

  if (menu.key === "docker-image") {
    if (!dockerAvailable.value) {
      await msg.info(dockerUnavailableReason.value || "Docker 不可用");
      return;
    }

    await dialogs.ManageDockerImageDialog();
    return;
  }

  await msg.info(`${menu.label} 功能开发中`);
}

async function detectDockerAvailability() {
  try {
    const res = await api.modelConnector.getDockerAvailability();
    dockerAvailable.value = Boolean(res.data.available);
    dockerUnavailableReason.value = res.data.available
      ? ""
      : res.data.error || "Docker 不可用";
  } catch (error) {
    dockerAvailable.value = false;
    dockerUnavailableReason.value =
      error instanceof Error ? error.message : "Docker 不可用";
  }
}

onMounted(async () => {
  if (!activeCompanyId.value && userStore.companies[0]?.id) {
    activeCompanyId.value = userStore.companies[0].id;
  }

  await detectDockerAvailability();
});
</script>

<style scoped></style>
