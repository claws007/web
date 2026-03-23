<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    label?: string;
  }>(),
  {
    modelValue: false,
    indeterminate: false,
    disabled: false,
    label: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:indeterminate": [value: boolean];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const boxRef = ref<HTMLSpanElement | null>(null);
const isHovered = ref(false);
const isActive = computed(() => props.modelValue || props.indeterminate);

let pos = 0;
let raf = 0;
let lastTs = 0;

// Slower flow so gradient looks more diffuse instead of busy.
const SPEED_NORMAL = 7;
const SPEED_HOVER = 20;

function tick(ts: DOMHighResTimeStamp) {
  const delta = lastTs === 0 ? 0 : ts - lastTs;
  lastTs = ts;

  if (isActive.value && boxRef.value) {
    const speed = isHovered.value ? SPEED_HOVER : SPEED_NORMAL;
    pos = (pos + speed * delta * 0.0025) % 400;
    boxRef.value.style.backgroundPosition = `${pos.toFixed(3)}% 50%`;
  }

  raf = requestAnimationFrame(tick);
}

function onChange(event: Event) {
  if (props.disabled) return;
  const checked = (event.target as HTMLInputElement).checked;

  if (props.indeterminate) {
    emit("update:indeterminate", false);
    emit("update:modelValue", true);
    return;
  }

  emit("update:modelValue", checked);

  if (!checked && boxRef.value) {
    pos = 0;
    boxRef.value.style.backgroundPosition = "0% 50%";
  }
}

function syncNativeIndeterminate() {
  if (!inputRef.value) return;
  inputRef.value.indeterminate = !!props.indeterminate && !props.modelValue;
}

watch(() => [props.indeterminate, props.modelValue], syncNativeIndeterminate, {
  immediate: true,
});

watch(isActive, (active) => {
  if (active || !boxRef.value) return;
  pos = 0;
  boxRef.value.style.backgroundPosition = "0% 50%";
});

onMounted(() => {
  syncNativeIndeterminate();
  raf = requestAnimationFrame(tick);
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
});
</script>

<template>
  <label
    class="checkbox"
    :class="{ 'is-disabled': disabled }"
    @mouseenter="isHovered = !disabled"
    @mouseleave="isHovered = false"
  >
    <input
      ref="inputRef"
      class="checkbox-native"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />

    <span
      ref="boxRef"
      class="checkbox-box"
      :class="{
        'is-active': modelValue || indeterminate,
        'is-mixed': indeterminate && !modelValue,
      }"
      aria-hidden="true"
    >
      <svg
        class="checkbox-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          class="checkbox-path checkbox-path--check"
          d="M3.5 8.2L6.6 11.1L12.5 4.9"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          class="checkbox-path checkbox-path--dash"
          d="M4 8H12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <span v-if="label" class="checkbox-label">{{ label }}</span>
    <slot v-else />
  </label>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  user-select: none;
  color: var(--foreground-muted);
}

.checkbox.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.checkbox-native {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.checkbox-box {
  --checkbox-flow: linear-gradient(
    132deg,
    #25d3e8 0%,
    #7a60f1 50%,
    #25d3e8 100%
  );
  width: 1.3rem;
  height: 1.3rem;
  position: relative;
  border-radius: 0.42rem;
  border: 1.5px solid rgb(90 102 109 / 0.28);
  background-color: rgb(255 255 255 / 0.84);
  background-size: 400% 100%;
  background-position: 0% 50%;
  display: inline-grid;
  place-items: center;
  color: white;
  box-shadow: 0 2px 10px rgb(30 56 111 / 0.07);
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal),
    border-color var(--duration-gentle) var(--ease-crystal),
    background-color var(--duration-gentle) var(--ease-crystal);
}

.checkbox-box::before {
  content: "";
  position: absolute;
  inset: -0.34rem;
  border-radius: 0.72rem;
  background:
    radial-gradient(circle at 24% 24%, rgb(37 211 232 / 0.44), transparent 56%),
    radial-gradient(circle at 78% 80%, rgb(122 96 241 / 0.4), transparent 62%);
  filter: blur(9px);
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity var(--duration-gentle) var(--ease-crystal),
    transform var(--duration-gentle) var(--ease-crystal);
  pointer-events: none;
}

.checkbox-icon {
  width: 0.82rem;
  height: 0.82rem;
}

.checkbox-path {
  opacity: 0;
  transform-origin: center;
  transition:
    opacity var(--duration-gentle) var(--ease-crystal),
    transform var(--duration-gentle) var(--ease-crystal);
}

.checkbox-path--check {
  transform: scale(0.72);
}

.checkbox-path--dash {
  transform: scaleX(0.35);
}

.checkbox-box.is-active {
  border-color: transparent;
  box-shadow:
    0 8px 24px rgb(76 147 244 / 0.26),
    0 0 0 1px rgb(255 255 255 / 0.16) inset;
  background-image: var(--checkbox-flow);
}

.checkbox-box.is-active::before {
  opacity: 0.78;
  transform: scale(1);
}

.checkbox-box.is-active .checkbox-path--check {
  opacity: 1;
  transform: scale(1);
}

.checkbox-box.is-mixed .checkbox-path--check {
  opacity: 0;
  transform: scale(0.72);
}

.checkbox-box.is-mixed .checkbox-path--dash {
  opacity: 1;
  transform: scaleX(1);
}

.checkbox:not(.is-disabled):hover .checkbox-box {
  transform: translateY(-1px);
  border-color: rgb(14 165 160 / 0.5);
}

.checkbox-native:focus-visible + .checkbox-box {
  box-shadow: var(--shadow-focus);
}

.checkbox-label {
  font-size: 0.84rem;
  line-height: 1.2;
}
</style>
