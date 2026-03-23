<template>
  <header
    class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-[#ffffff55] backdrop-blur-md px-4"
  >
    <PrimaryButton>{{ currentCompanyName }}</PrimaryButton>
    <div class="flex items-center gap-2 md:gap-3">
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
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { readStoredActiveCompanyId, setStoredActiveCompanyId } from "@/api";
import { useUserStore } from "@/store/user";
import { RouteName } from "@/router/route-name";

const router = useRouter();
const userStore = useUserStore();
const activeCompanyId = ref<number | null>(readStoredActiveCompanyId());

const currentCompanyName = computed(() => {
  if (!userStore.companies.length) {
    return "选择公司";
  }

  const matched = userStore.companies.find(
    (company) => company.id === activeCompanyId.value,
  );

  return matched?.name || userStore.companies[0]?.name || "选择公司";
});

const userInitial = computed(() => {
  const name = userStore.user?.name || userStore.user?.email || "User";
  return name.charAt(0).toUpperCase();
});

function handleLogout() {
  userStore.logout();
  router.replace({ name: RouteName.Login });
}

onMounted(() => {
  if (!activeCompanyId.value && userStore.companies[0]?.id) {
    activeCompanyId.value = userStore.companies[0].id;
  }
});
</script>

<style scoped></style>
