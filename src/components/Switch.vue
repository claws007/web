<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    disabled?: boolean;
  }>(),
  {
    modelValue: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [value: boolean];
}>();

const isActive = computed(() => props.modelValue);

function handleToggle(event: Event) {
  if (props.disabled) {
    return;
  }

  const next = (event.target as HTMLInputElement).checked;
  emit("update:modelValue", next);
  emit("change", next);
}
</script>

<template>
  <label class="switch" :class="{ 'is-disabled': disabled }">
    <input
      class="switch-native"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleToggle"
    />

    <span class="switch-track" :class="{ 'is-on': isActive }">
      <span class="switch-knob" />
    </span>

    <slot />
  </label>
</template>

<style scoped>
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.switch.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.switch-native {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.switch-track {
  --switch-flow: linear-gradient(132deg, #25d3e8 0%, #7a60f1 50%, #25d3e8 100%);
  width: 2.25rem;
  height: 1.3rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  padding: 0.12rem;
  border: 1.4px solid rgb(90 102 109 / 0.28);
  background-color: rgb(255 255 255 / 0.9);
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    border-color var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal),
    background-color var(--duration-gentle) var(--ease-crystal);
  overflow: hidden;
  position: relative;
}

.switch-track::after {
  content: "";
  position: absolute;
  top: -38%;
  left: -105%;
  width: 46%;
  height: 176%;
  transform: translateX(0) rotate(16deg);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgb(255 255 255 / 0.1) 45%,
    rgb(255 255 255 / 0.34) 50%,
    rgb(255 255 255 / 0.1) 55%,
    transparent 100%
  );
  opacity: 0;
  pointer-events: none;
}

.switch-track.is-on {
  border-color: transparent;
  background-image: var(--switch-flow);
  box-shadow:
    0 8px 24px rgb(76 147 244 / 0.24),
    0 0 0 1px rgb(255 255 255 / 0.16) inset;
}

.switch-track.is-on::after {
  opacity: 0.86;
  animation: switch-sheen 1.9s linear infinite;
}

.switch-knob {
  width: 0.92rem;
  height: 0.92rem;
  border-radius: 999px;
  background: white;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.18);
  transition: transform var(--duration-gentle) var(--ease-crystal);
  transform: translateX(0);
}

.switch-track.is-on .switch-knob {
  transform: translateX(0.95rem);
}

.switch:not(.is-disabled):hover .switch-track {
  transform: translateY(-1px);
  border-color: rgb(14 165 160 / 0.45);
}

@keyframes switch-sheen {
  from {
    transform: translateX(0) rotate(16deg);
  }
  to {
    transform: translateX(410%) rotate(16deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .switch-track,
  .switch-knob {
    transition-duration: 0.01ms;
  }

  .switch-track.is-on::after {
    animation: none;
    opacity: 0;
  }
}
</style>
