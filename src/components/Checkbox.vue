<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useFormContext } from "@/composables/useForm";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    label?: string;
    fieldName?: string;
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
const form = useFormContext();
const isActive = computed(() => props.modelValue || props.indeterminate);
const fieldError = ref<string | null>(null);

function onChange(event: Event) {
  if (props.disabled) return;
  const checked = (event.target as HTMLInputElement).checked;

  if (props.indeterminate) {
    emit("update:indeterminate", false);
    emit("update:modelValue", true);
    if (form && props.fieldName) {
      form.updateFieldTouched(props.fieldName, true);
      form.updateFieldValue(props.fieldName, true);
    }
    return;
  }

  emit("update:modelValue", checked);
  if (form && props.fieldName) {
    form.updateFieldTouched(props.fieldName, true);
    form.updateFieldValue(props.fieldName, checked);
  }
}

function syncNativeIndeterminate() {
  if (!inputRef.value) return;
  inputRef.value.indeterminate = !!props.indeterminate && !props.modelValue;
}

watch(() => [props.indeterminate, props.modelValue], syncNativeIndeterminate, {
  immediate: true,
});

onMounted(() => {
  syncNativeIndeterminate();
  if (form && props.fieldName) {
    if (!form.getField(props.fieldName)) {
      form.registerField(props.fieldName);
    }
    form.updateFieldValue(props.fieldName, props.modelValue);
    fieldError.value = form.getFieldError(props.fieldName);
  }
});

onUnmounted(() => {
  if (form && props.fieldName) {
    form.unregisterField(props.fieldName);
  }
});

watch(
  () => props.modelValue,
  (next) => {
    if (form && props.fieldName) {
      form.updateFieldValue(props.fieldName, next);
    }
  },
);

watch(
  () => (form && props.fieldName ? form.getFieldError(props.fieldName) : null),
  (nextError) => {
    fieldError.value = nextError;
  },
);

watch(
  () => (form ? form.submitValidationVersion : 0),
  () => {
    if (!form || !props.fieldName) return;
    fieldError.value = form.getFieldError(props.fieldName);
  },
);
</script>

<template>
  <label class="checkbox" :class="{ 'is-disabled': disabled }">
    <input
      ref="inputRef"
      class="checkbox-native"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />

    <span
      class="checkbox-box"
      :class="{
        'is-active': modelValue || indeterminate,
        'is-mixed': indeterminate && !modelValue,
        'is-error': !!fieldError,
      }"
      :title="fieldError ?? undefined"
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
  display: inline-grid;
  place-items: center;
  color: white;
  box-shadow: 0 2px 10px rgb(30 56 111 / 0.07);
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal),
    border-color var(--duration-gentle) var(--ease-crystal),
    background-color var(--duration-gentle) var(--ease-crystal);
  overflow: hidden;
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

.checkbox-box::after {
  content: "";
  position: absolute;
  top: -45%;
  left: -120%;
  width: 55%;
  height: 190%;
  transform: translateX(0) rotate(18deg);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgb(255 255 255 / 0.12) 45%,
    rgb(255 255 255 / 0.4) 50%,
    rgb(255 255 255 / 0.12) 55%,
    transparent 100%
  );
  opacity: 0;
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

.checkbox-box.is-active::after {
  opacity: 0.92;
  animation: checkbox-sheen 1.8s linear infinite;
}

.checkbox-box.is-error {
  border-color: rgb(220 38 38 / 0.85);
  box-shadow: 0 0 0 1px rgb(220 38 38 / 0.25);
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

@keyframes checkbox-sheen {
  from {
    transform: translateX(0) rotate(18deg);
  }
  to {
    transform: translateX(390%) rotate(18deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .checkbox-box,
  .checkbox-path,
  .checkbox-box::before {
    transition-duration: 0.01ms;
  }

  .checkbox-box.is-active::after {
    animation: none;
    opacity: 0;
  }
}
</style>
