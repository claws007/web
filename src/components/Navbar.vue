<template>
  <header
    class="w-full flex h-16 items-center justify-between border-b border-primary/10 bg-black/3 backdrop-blur-md px-5"
  >
    <!-- <FlowPrimaryText class="text-xl font-bold">{{
      currentCompanyName
    }}</FlowPrimaryText> -->
    <!-- <FlowPrimaryBackground class="rounded-md p-1 px-3 font-bold">{{
      currentCompanyName
    }}</FlowPrimaryBackground> -->
    <div class="font-bold h items-center gap-1">
      <div>
        {{ currentCompanyName }}
      </div>
    </div>
    <div class="flex items-center gap-2 md:gap-3">
      <ActionBar
        :items="settingActionItems"
        container-class="flex items-center"
        button-class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--primary)_18%,white)] bg-[rgb(255_255_255/0.22)] text-foreground shadow-[0_8px_24px_rgb(0_104_119/0.08)] backdrop-blur-md transition-colors duration-200 hover:bg-[rgb(255_255_255/0.32)]"
      />

      <DropdownMenu
        placement="bottom"
        :menus="userMenus"
        @select="handleUserMenuSelect"
      >
        <template #trigger>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--primary)_20%,white)] bg-[rgb(255_255_255/0.22)] text-sm font-semibold text-foreground shadow-[0_8px_24px_rgb(0_104_119/0.08)] backdrop-blur-md transition-colors duration-200 hover:bg-[rgb(255_255_255/0.32)]"
            title="用户菜单"
            aria-label="用户菜单"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="用户头像"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ userInitial }}</span>
          </button>
        </template>
      </DropdownMenu>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { DropdownMenuItem } from "@/components/DropdownMenu.vue";
import ActionBar, { type ActionBarItem } from "@/components/ActionBar.vue";
import { SettingsIcon } from "@/components/icons";
import {
  api,
  getImageUrlByFileId,
  readStoredActiveCompanyId,
  setStoredActiveCompanyId,
} from "@/api";
import { useUserStore } from "@/store/user";
import { RouteName } from "@/router/route-name";
import { notify } from "@/components/notification";
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
  { key: "company", label: "Company" },
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

const settingActionItems = computed<ActionBarItem[]>(() => [
  {
    key: "settings",
    title: "设置",
    ariaLabel: "打开设置菜单",
    iconKey: "settings",
    icon: SettingsIcon,
    rotateOnOpen: true,
    menus: settingMenus.value,
    onMenuSelect: (menu) => {
      void handleSettingMenuSelect(menu);
    },
  },
]);

const userMenus = computed<DropdownMenuItem[]>(() => [
  { key: "edit-profile", label: "编辑用户信息" },
  { key: "logout", label: "退出登录" },
]);

const userInitial = computed(() => {
  const name = userStore.user?.name || userStore.user?.email || "User";
  return name.charAt(0).toUpperCase();
});

const avatarUrl = computed(() =>
  getImageUrlByFileId(userStore.user?.avatarFileId),
);

function handleLogout() {
  userStore.logout();
  router.replace({ name: RouteName.Login });
}

async function handleUserMenuSelect(menu: DropdownMenuItem) {
  if (menu.key === "edit-profile") {
    const result = await dialogs.EditUserInfoDialog();
    if (result?.type === "resolve" && result.value) {
      userStore.updateUserProfile(result.value);
    }
    return;
  }

  if (menu.key === "logout") {
    handleLogout();
  }
}

async function handleSettingMenuSelect(menu: DropdownMenuItem) {
  if (menu.key === "company") {
    const result = await dialogs.EditOrCreateCompanyDialog(
      activeCompanyId.value ? { id: activeCompanyId.value } : undefined,
    );
    if (result.type !== "resolve" || !result.value) {
      return;
    }

    const savedCompany = result.value;
    userStore.upsertCompany(savedCompany);

    if (!activeCompanyId.value) {
      activeCompanyId.value = savedCompany.id;
      setStoredActiveCompanyId(savedCompany.id);
    }

    return;
  }

  if (menu.key === "model-connector") {
    await dialogs.ManageModelConnectorDialog();
    return;
  }

  if (menu.key === "docker-image") {
    if (!dockerAvailable.value) {
      notify.info(dockerUnavailableReason.value || "Docker 不可用");
      return;
    }

    await dialogs.ManageDockerImageDialog();
    return;
  }

  if (menu.key === "mcp-server") {
    await dialogs.ManageMcpServerDialog();
    return;
  }

  if (menu.key === "skill") {
    await dialogs.ManageSkillDialog();
    return;
  }

  notify.info(`${menu.label} 功能开发中`);
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
