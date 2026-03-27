<script setup lang="ts">
import { computed, ref } from "vue";
import Dropdown from "@/components/Dropdown.vue";

export interface SelectorItem {
  id: string | number;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
}

interface Props {
  modelValue?: string | number | null;
  items: SelectorItem[];
  placeholder?: string;
  emptyText?: string;
  actionText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: "选择一个选项",
  emptyText: "暂无可选项",
  actionText: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  change: [value: string | number, item: SelectorItem];
  action: [];
}>();

const isExpanded = ref(false);

const selectedItem = computed(
  () => props.items.find((item) => item.id === props.modelValue) ?? null,
);

const hasSelection = computed(() => Boolean(selectedItem.value));

defineSlots<{
  selected?(props: {
    selectedItem: SelectorItem | null;
    placeholder: string;
    hasSelection: boolean;
    open: boolean;
  }): unknown;
}>();

function selectItem(item: SelectorItem, closeDropdown?: () => void) {
  if (item.disabled) {
    return;
  }

  emit("update:modelValue", item.id);
  emit("change", item.id, item);
  isExpanded.value = false;
  closeDropdown?.();
}

function emitAction() {
  emit("action");
}
</script>

<template>
  <section
    class="overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--primary)_18%,white)] bg-transparent shadow-[0_12px_30px_rgb(0_104_119/0.08)]"
  >
    <Dropdown v-model="isExpanded" class="w-full" placement="bottom">
      <template #trigger="{ open }">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-2 px-3 text-foreground"
          :aria-expanded="open"
        >
          <slot
            name="selected"
            :selected-item="selectedItem"
            :placeholder="placeholder"
            :has-selection="hasSelection"
            :open="open"
          >
            <span class="stretch min-w-0 text-left">
              <span
                class="block truncate text-[0.95rem] leading-[1.2]"
                :class="
                  hasSelection
                    ? 'font-normal text-foreground'
                    : 'text-[color-mix(in_srgb,var(--foreground)_55%,white)]'
                "
              >
                {{ selectedItem?.label || placeholder }}
              </span>
              <span
                v-if="selectedItem?.description"
                class="mt-[0.15rem] block truncate text-[0.7rem] font-normal uppercase tracking-[0.03em] text-foreground-muted"
              >
                {{ selectedItem.description }}
              </span>
            </span>
          </slot>
          <span
            class="flex h-[1.1rem] w-[1.1rem] items-center justify-center text-primary transition-transform duration-200 ease-crystal"
            :class="{ 'rotate-180': open }"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              class="h-full w-full fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d="M3 6.5 8 11l5-4.5" />
            </svg>
          </span>
        </button>
      </template>

      <template #default="{ closeDropdown }">
        <div class="flex flex-col gap-[0.35rem] p-1">
          <div
            v-if="items.length === 0"
            class="mx-1 my-[0.15rem] rounded-xl border border-dashed border-[color-mix(in_srgb,var(--outline-ghost)_78%,white)] bg-[color-mix(in_srgb,var(--surface)_86%,white)] px-3 py-4 text-center"
          >
            <div class="text-[1rem] leading-none text-foreground-muted">∅</div>
            <div
              class="mt-1.5 text-[0.82rem] font-normal text-foreground-muted"
            >
              {{ emptyText }}
            </div>
          </div>

          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-[0.7rem] text-left text-foreground transition-colors duration-200 ease-crystal hover:bg-[color-mix(in_srgb,var(--secondary-soft)_55%,white)]"
            :class="{
              'bg-[color-mix(in_srgb,var(--secondary-soft)_70%,white)]':
                selectedItem?.id === item.id,
              'cursor-not-allowed opacity-45 hover:bg-transparent':
                item.disabled,
            }"
            :disabled="item.disabled"
            @click="selectItem(item, closeDropdown)"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary text-[0.8rem] text-white"
              :style="item.color ? { backgroundColor: item.color } : undefined"
            >
              {{ item.icon || "◆" }}
            </span>

            <span class="flex min-w-0 flex-col">
              <span class="leading-[1.2] font-normal">
                {{ item.label }}
                <span
                  v-if="selectedItem?.id === item.id"
                  class="text-secondary"
                >
                  （当前选中）
                </span>
              </span>
              <span
                class="mt-[0.2rem] text-[0.75rem] font-normal uppercase tracking-[0.02em] text-foreground-muted"
              >
                {{ item.description || placeholder }}
              </span>
            </span>

            <span
              class="h-[1.4rem] w-[1.4rem] scale-90 text-[color-mix(in_srgb,var(--secondary)_70%,black)] opacity-0 transition-all duration-200 ease-crystal"
              :class="{
                'scale-100 opacity-100': selectedItem?.id === item.id,
              }"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                class="h-full w-full fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]"
              >
                <path d="m3.2 8.4 2.8 2.8 6-6" />
              </svg>
            </span>
          </button>

          <button
            v-if="actionText"
            type="button"
            class="mt-[0.2rem] cursor-pointer border-0 border-t border-t-outline-ghost bg-transparent px-[0.65rem] pb-[0.45rem] pt-[0.9rem] font-normal tracking-[0.02em] text-primary transition-colors duration-200 ease-crystal hover:text-[color-mix(in_srgb,var(--primary)_68%,black)]"
            @click="emitAction"
          >
            + {{ actionText }}
          </button>
        </div>
      </template>
    </Dropdown>
  </section>
</template>
