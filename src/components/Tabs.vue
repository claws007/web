<script setup lang="ts">
import { ref, computed } from "vue";

interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface Props {
  items: TabItem[];
  modelValue?: string;
  variant?: "default" | "icon";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const activeId = computed({
  get: () => props.modelValue || props.items[0]?.id || "",
  set: (value: string) => {
    emit("update:modelValue", value);
    emit("change", value);
  },
});

const handleTabClick = (tab: TabItem) => {
  if (!tab.disabled) {
    activeId.value = tab.id;
  }
};
</script>

<template>
  <div class="tabs" :class="`tabs--${variant}`">
    <div class="tabs-list">
      <button
        v-for="tab in items"
        :key="tab.id"
        class="tab"
        :class="{
          'tab--active': activeId === tab.id,
          'tab--disabled': tab.disabled,
        }"
        :disabled="tab.disabled"
        @click="handleTabClick(tab)"
      >
        <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
        <span v-if="variant === 'default'" class="tab-label">{{
          tab.label
        }}</span>
        <span v-if="variant === 'icon'" class="tab-label-tooltip">{{
          tab.label
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tabs-list {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--outline-ghost);
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--foreground-muted);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border-radius: var(--radius-md, 0.75rem) var(--radius-md, 0.75rem) 0 0;
  outline: none;

  /* Ghost border for accessibility */
  border: 1px solid transparent;
  margin-bottom: -1px;
}

.tab:hover:not(.tab--disabled) {
  color: var(--primary);
  background-color: var(--primary-soft);
}

.tab--active {
  color: var(--primary);
  background-color: var(--surface-container-lowest);
  border-color: transparent;
  box-shadow: inset 0 -2px 0 var(--primary);

  /* Rainbow edge effect on active tab */
  border-image: linear-gradient(
      90deg,
      transparent,
      rgb(34 211 238 / 0.3) 50%,
      transparent
    )
    1;
}

.tab--disabled {
  color: var(--foreground-muted);
  opacity: 0.5;
  cursor: not-allowed;
}

.tab--disabled:hover {
  background-color: transparent;
  color: var(--foreground-muted);
}

.tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.tab-label {
  white-space: nowrap;
}

.tab-label-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 0.75rem;
  background: var(--surface-container-low);
  color: var(--foreground);
  font-size: 0.75rem;
  border-radius: var(--radius-sm, 0.5rem);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.tabs--icon .tab:hover:not(.tab--disabled) .tab-label-tooltip {
  opacity: 1;
}

.tabs--default {
  /* Default style for standard tab layout */
}

.tabs--icon {
  /* Icon-based tab layout */
}

.tabs--icon .tab {
  padding: 0.75rem 1rem;
  flex-direction: column;
  gap: 0.25rem;
}

.tabs--icon .tab-label-tooltip {
  display: block;
}
</style>
