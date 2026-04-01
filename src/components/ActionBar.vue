<script setup lang="ts">
import DropdownMenu, {
  type DropdownMenuItem,
} from "@/components/DropdownMenu.vue";
import type { Component } from "vue";

export type ActionBarItem = {
  key: string;
  title: string;
  ariaLabel: string;
  iconKey: string;
  icon: Component;
  danger?: boolean;
  rotateOnOpen?: boolean;
  disabled?: boolean;
  className?: string;
  menus?: DropdownMenuItem[];
  onClick?: () => void;
  onMenuSelect?: (menu: DropdownMenuItem) => void;
};

const props = withDefaults(
  defineProps<{
    items: ActionBarItem[];
    containerClass?: string;
    buttonClass?: string;
  }>(),
  {
    containerClass: "bg-white rounded-md shadow-md p-1 h gap-0.5",
    buttonClass:
      "text-on-surface-variant hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
  },
);

const baseButtonClass =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-45";

const dangerButtonClass =
  "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600";

function hasMenus(item: ActionBarItem): boolean {
  return Array.isArray(item.menus) && item.menus.length > 0;
}

function onItemClick(item: ActionBarItem) {
  if (item.disabled) {
    return;
  }
  item.onClick?.();
}

function onItemMenuSelect(item: ActionBarItem, menu: DropdownMenuItem) {
  if (item.disabled) {
    return;
  }
  item.onMenuSelect?.(menu);
}
</script>

<template>
  <div :class="props.containerClass">
    <template v-for="item in props.items" :key="item.key">
      <DropdownMenu
        v-if="hasMenus(item) && !item.disabled"
        placement="bottom"
        :menus="item.menus"
        @select="(menu) => onItemMenuSelect(item, menu)"
      >
        <template #trigger="{ open }">
          <button
            :class="[baseButtonClass, props.buttonClass, item.className]"
            :title="item.title"
            :aria-label="item.ariaLabel"
            :aria-expanded="open"
            :disabled="item.disabled"
            @click.stop
          >
            <component
              :is="item.icon"
              :icon-key="item.iconKey"
              aria-hidden="true"
              class="transition-transform duration-200"
              :class="{ 'rotate-90': open && item.rotateOnOpen }"
            />
          </button>
        </template>
      </DropdownMenu>

      <button
        v-else
        :class="[
          baseButtonClass,
          props.buttonClass,
          item.className,
          item.danger ? dangerButtonClass : '',
        ]"
        :title="item.title"
        :aria-label="item.ariaLabel"
        :disabled="item.disabled"
        @click.stop="onItemClick(item)"
      >
        <component
          :is="item.icon"
          :icon-key="item.iconKey"
          aria-hidden="true"
        />
      </button>
    </template>
  </div>
</template>
