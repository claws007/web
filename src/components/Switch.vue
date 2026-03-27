<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

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

const trackRef = ref<HTMLSpanElement | null>(null);
const isHovered = ref(false);
const isActive = computed(() => props.modelValue);

let pos = 0;
let raf = 0;
let lastTs = 0;

const SPEED_NORMAL = 7;
const SPEED_HOVER = 20;

function tick(ts: DOMHighResTimeStamp) {
  const delta = lastTs === 0 ? 0 : ts - lastTs;
  lastTs = ts;

  if (isActive.value && trackRef.value) {
    const speed = isHovered.value ? SPEED_HOVER : SPEED_NORMAL;
    pos = (pos + speed * delta * 0.0025) % 400;
    trackRef.value.style.backgroundPosition = `${pos.toFixed(3)}% 50%`;
  }

  raf = requestAnimationFrame(tick);
}

function handleToggle(event: Event) {
  if (props.disabled) {
    return;
  }

  const next = (event.target as HTMLInputElement).checked;
  emit("update:modelValue", next);
  emit("change", next);

  if (!next && trackRef.value) {
    pos = 0;
    trackRef.value.style.backgroundPosition = "0% 50%";
  }
}

watch(isActive, (active) => {
  if (active || !trackRef.value) {
    return;
  }

  pos = 0;
  trackRef.value.style.backgroundPosition = "0% 50%";
});

onMounted(() => {
  raf = requestAnimationFrame(tick);
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
});
</script>

<template>
  <label
    class="switch"
    :class="{ 'is-disabled': disabled }"
    @mouseenter="isHovered = !disabled"
    @mouseleave="isHovered = false"
  >
    <input
      class="switch-native"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleToggle"
    />

    <span ref="trackRef" class="switch-track" :class="{ 'is-on': modelValue }">
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
  background-size: 400% 100%;
  background-position: 0% 50%;
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    border-color var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal),
    background-color var(--duration-gentle) var(--ease-crystal);
}

.switch-track.is-on {
  border-color: transparent;
  background-image: var(--switch-flow);
  box-shadow:
    0 8px 24px rgb(76 147 244 / 0.24),
    0 0 0 1px rgb(255 255 255 / 0.16) inset;
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
</style>
