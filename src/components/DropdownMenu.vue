<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import Dropdown from "@/components/Dropdown.vue";
import type { FloatPlacement } from "@/utils/useFloating";

export interface DropdownMenuItem {
  key: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    menus?: DropdownMenuItem[];
    placement?: FloatPlacement;
    disabled?: boolean;
    closeDelayMs?: number;
    closeOnClickOutside?: boolean;
    closeOnContentClick?: boolean;
  }>(),
  {
    menus: () => [],
    placement: "bottom",
    disabled: false,
    closeDelayMs: 120,
    closeOnClickOutside: true,
    closeOnContentClick: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  close: [];
  select: [menu: DropdownMenuItem];
}>();

const isOpen = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearCloseTimer() {
  if (!closeTimer) {
    return;
  }

  clearTimeout(closeTimer);
  closeTimer = null;
}

function openMenu() {
  clearCloseTimer();
  if (props.disabled || isOpen.value) {
    return;
  }

  isOpen.value = true;
  emit("update:modelValue", true);
  emit("open");
}

function closeMenu() {
  clearCloseTimer();
  if (!isOpen.value) {
    return;
  }

  isOpen.value = false;
  emit("update:modelValue", false);
  emit("close");
}

function scheduleClose() {
  clearCloseTimer();
  closeTimer = setTimeout(
    () => {
      closeMenu();
    },
    Math.max(0, props.closeDelayMs),
  );
}

function onOpen() {
  if (!isOpen.value) {
    isOpen.value = true;
    emit("update:modelValue", true);
  }
  emit("open");
}

function onClose() {
  clearCloseTimer();
  if (isOpen.value) {
    isOpen.value = false;
    emit("update:modelValue", false);
  }
  emit("close");
}

function handleMenuSelect(menu: DropdownMenuItem) {
  if (menu.disabled) {
    return;
  }

  closeMenu();
  emit("select", menu);
}

onUnmounted(() => {
  clearCloseTimer();
});
</script>

<template>
  <Dropdown
    v-model="isOpen"
    :placement="placement"
    :disabled="disabled"
    :close-on-click-outside="closeOnClickOutside"
    :close-on-content-click="closeOnContentClick"
    :trigger-on-click="false"
    @open="onOpen"
    @close="onClose"
  >
    <template #trigger="{ open }">
      <div
        class="inline-flex"
        @mouseenter="openMenu"
        @mouseleave="scheduleClose"
      >
        <slot name="trigger" :open="open" :open-menu="openMenu">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,white)] bg-[rgb(255_255_255/0.22)] px-3 py-2 text-sm text-foreground backdrop-blur-md"
          >
            <span>Menu</span>
            <span :class="{ 'rotate-180': open }" class="transition-transform">
              ▾
            </span>
          </button>
        </slot>
      </div>
    </template>

    <template #default>
      <div
        class="flex min-w-48 flex-col gap-1 p-1"
        role="menu"
        @mouseenter="openMenu"
        @mouseleave="scheduleClose"
      >
        <button
          v-for="menu in menus"
          :key="menu.key"
          type="button"
          class="flex cursor-pointer items-start rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-sm text-foreground transition-colors duration-200 hover:bg-[rgb(255_255_255/0.28)]"
          :class="{
            'cursor-not-allowed opacity-45 hover:bg-transparent': menu.disabled,
          }"
          :disabled="menu.disabled"
          @click="handleMenuSelect(menu)"
        >
          <span class="flex flex-col gap-0.5">
            <span>{{ menu.label }}</span>
            <span
              v-if="menu.description"
              class="text-xs text-foreground-muted"
            >
              {{ menu.description }}
            </span>
          </span>
        </button>
      </div>
    </template>
  </Dropdown>
</template>
