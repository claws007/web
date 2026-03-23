<script setup lang="ts">
import { computed, ref } from "vue";

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
  title?: string;
  placeholder?: string;
  expanded?: boolean;
  actionText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  title: "请选择",
  placeholder: "选择一个选项",
  expanded: undefined,
  actionText: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  change: [value: string | number, item: SelectorItem];
  "update:expanded": [value: boolean];
  action: [];
}>();

const innerExpanded = ref(true);

const isExpanded = computed({
  get: () =>
    typeof props.expanded === "boolean" ? props.expanded : innerExpanded.value,
  set: (value: boolean) => {
    if (typeof props.expanded !== "boolean") {
      innerExpanded.value = value;
    }
    emit("update:expanded", value);
  },
});

const selectedItem = computed(
  () => props.items.find((item) => item.id === props.modelValue) ?? null,
);

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function selectItem(item: SelectorItem) {
  if (item.disabled) {
    return;
  }

  emit("update:modelValue", item.id);
  emit("change", item.id, item);
}

function emitAction() {
  emit("action");
}
</script>

<template>
  <section class="selector">
    <button
      type="button"
      class="selector-trigger"
      :aria-expanded="isExpanded"
      @click="toggleExpanded"
    >
      <span class="selector-title">{{ title }}</span>
      <span
        class="selector-arrow"
        :class="{ 'selector-arrow--expanded': isExpanded }"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 6.5 8 11l5-4.5" />
        </svg>
      </span>
    </button>

    <transition name="selector-panel">
      <div v-if="isExpanded" class="selector-panel">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="selector-item"
          :class="{
            'selector-item--active': selectedItem?.id === item.id,
            'selector-item--disabled': item.disabled,
          }"
          :disabled="item.disabled"
          @click="selectItem(item)"
        >
          <span
            class="selector-item-icon"
            :style="item.color ? { backgroundColor: item.color } : undefined"
          >
            {{ item.icon || "◆" }}
          </span>

          <span class="selector-item-main">
            <span class="selector-item-label">
              {{ item.label }}
              <span
                v-if="selectedItem?.id === item.id"
                class="selector-item-current"
              >
                （当前选中）
              </span>
            </span>
            <span class="selector-item-description">
              {{ item.description || placeholder }}
            </span>
          </span>

          <span
            class="selector-item-check"
            :class="{
              'selector-item-check--show': selectedItem?.id === item.id,
            }"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m3.2 8.4 2.8 2.8 6-6" />
            </svg>
          </span>
        </button>

        <button
          v-if="actionText"
          type="button"
          class="selector-action"
          @click="emitAction"
        >
          + {{ actionText }}
        </button>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.selector {
  border: 1px solid color-mix(in srgb, var(--primary) 18%, white);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface-container-lowest) 88%, white);
  box-shadow: 0 12px 30px rgb(0 104 119 / 0.08);
  overflow: hidden;
}

.selector-trigger {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: var(--foreground);
}

.selector-title {
  font-size: 1.05rem;
  font-weight: 600;
}

.selector-arrow {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  transition: transform var(--duration-gentle) var(--ease-crystal);
}

.selector-arrow svg,
.selector-item-check svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.selector-arrow--expanded {
  transform: rotate(180deg);
}

.selector-panel {
  margin: 0.25rem 0.9rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--secondary) 18%, white);
  border-radius: calc(var(--radius-lg) - 0.25rem);
  background: color-mix(in srgb, var(--surface) 92%, white);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.selector-item {
  border: 0;
  background: transparent;
  width: 100%;
  border-radius: 0.75rem;
  padding: 0.7rem 0.75rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  text-align: left;
  color: var(--foreground);
  cursor: pointer;
  transition: background-color var(--duration-gentle) var(--ease-crystal);
}

.selector-item:hover:not(.selector-item--disabled) {
  background: color-mix(in srgb, var(--secondary-soft) 55%, white);
}

.selector-item--active {
  background: color-mix(in srgb, var(--secondary-soft) 70%, white);
}

.selector-item--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.selector-item-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.selector-item-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.selector-item-label {
  font-weight: 700;
  line-height: 1.2;
}

.selector-item-current {
  color: var(--secondary);
}

.selector-item-description {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--foreground-muted);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.selector-item-check {
  width: 1.4rem;
  height: 1.4rem;
  color: color-mix(in srgb, var(--secondary) 70%, black);
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity var(--duration-gentle) var(--ease-crystal),
    transform var(--duration-gentle) var(--ease-crystal);
}

.selector-item-check--show {
  opacity: 1;
  transform: scale(1);
}

.selector-action {
  margin-top: 0.2rem;
  border: 0;
  border-top: 1px solid var(--outline-ghost);
  background: transparent;
  color: var(--primary);
  padding: 0.9rem 0.65rem 0.45rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.selector-action:hover {
  color: color-mix(in srgb, var(--primary) 68%, black);
}

.selector-panel-enter-active,
.selector-panel-leave-active {
  transition:
    opacity var(--duration-gentle) var(--ease-crystal),
    transform var(--duration-gentle) var(--ease-crystal);
}

.selector-panel-enter-from,
.selector-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
