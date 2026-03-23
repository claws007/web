<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import Tooltip from "./Tooltip.vue";

/**
 * Validate function return value:
 *   undefined / null / true  → valid
 *   false                    → invalid (generic message)
 *   string                   → invalid, use as error message
 *   number                   → invalid, use as error code string
 */
type ValidateFn = (
  value: string,
) => undefined | null | boolean | string | number;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    type?: "text" | "password" | "email";
    /** RegExp, pattern string (converted via new RegExp), or validator function */
    validate?: RegExp | string | ValidateFn;
    /** Validation throttle interval in milliseconds. Set 0 to disable throttling. */
    validateThrottleMs?: number;
  }>(),
  {
    modelValue: "",
    type: "text",
    validateThrottleMs: 500,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const showPassword = ref(false);
const errorMessage = ref<string | null>(null);
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let pendingValidationValue: string | null = null;
let lastValidationAt = 0;

const resolvedType = computed(() => {
  if (props.type === "password" && showPassword.value) {
    return "text";
  }
  return props.type;
});

function runValidation(value: string) {
  if (!props.validate) {
    errorMessage.value = null;
    return;
  }

  const v = props.validate;

  if (typeof v === "string") {
    errorMessage.value = new RegExp(v).test(value) ? null : "格式不正确";
    return;
  }

  if (v instanceof RegExp) {
    errorMessage.value = v.test(value) ? null : "格式不正确";
    return;
  }

  // validator function
  const result = v(value);
  if (result === undefined || result === null || result === true) {
    errorMessage.value = null;
  } else if (result === false) {
    errorMessage.value = "校验失败";
  } else if (typeof result === "number") {
    errorMessage.value = String(result);
  } else {
    errorMessage.value = result;
  }
}

function clearThrottleTimer() {
  if (!throttleTimer) return;
  clearTimeout(throttleTimer);
  throttleTimer = null;
}

function scheduleValidation(value: string, immediate = false) {
  const interval = Math.max(0, props.validateThrottleMs ?? 0);

  if (immediate || interval === 0) {
    clearThrottleTimer();
    pendingValidationValue = null;
    runValidation(value);
    lastValidationAt = Date.now();
    return;
  }

  const now = Date.now();
  const elapsed = now - lastValidationAt;

  if (elapsed >= interval && !throttleTimer) {
    runValidation(value);
    lastValidationAt = now;
    return;
  }

  pendingValidationValue = value;
  if (throttleTimer) return;

  const wait = Math.max(0, interval - elapsed);
  throttleTimer = setTimeout(() => {
    throttleTimer = null;
    const nextValue = pendingValidationValue ?? value;
    pendingValidationValue = null;
    runValidation(nextValue);
    lastValidationAt = Date.now();
  }, wait);
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  scheduleValidation(value);
}

function togglePassword() {
  showPassword.value = !showPassword.value;
}

async function copyValue() {
  if (!props.modelValue) return;
  if (!navigator?.clipboard?.writeText) return;
  await navigator.clipboard.writeText(props.modelValue);
}

onUnmounted(() => {
  clearThrottleTimer();
});

/** Expose so parent components can trigger validation imperatively */
defineExpose({
  validate: () => scheduleValidation(props.modelValue ?? "", true),
});
</script>

<template>
  <div class="input-root">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div :class="['input-wrapper', { 'input-wrapper--error': errorMessage }]">
      <input
        :type="resolvedType"
        :placeholder="placeholder"
        :value="modelValue"
        class="input-field"
        @input="onInput"
      />

      <button
        v-if="type === 'password'"
        type="button"
        class="input-action"
        tabindex="-1"
        @click="togglePassword"
      >
        <svg
          v-if="showPassword"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
          />
          <path
            d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
          />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <!-- email icon -->
      <span v-else-if="type === 'email'" class="input-action non-interactive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
      </span>

      <!-- copy icon for other types -->
      <button
        v-else
        type="button"
        class="input-action"
        tabindex="-1"
        @click="copyValue"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>

      <!-- validation error icon -->
      <Tooltip
        :content="errorMessage ?? undefined"
        placement="top"
        :persistent="true"
      >
        <span
          v-show="errorMessage"
          class="input-error-icon"
          aria-label="校验错误"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
.input-root {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: var(--tracking-label);
  color: var(--foreground-muted);
  text-transform: uppercase;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1.5px solid var(--outline-ghost);
  transition: border-color var(--duration-gentle) var(--ease-crystal);
}

.input-wrapper:focus-within {
  border-color: var(--primary);
}

.input-field {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.625rem 0;
  font-size: 0.9375rem;
  font-family: var(--font-sans);
  color: var(--foreground);
  line-height: var(--leading-body);
}
.input-field:focus {
  box-shadow: none;
}

.input-field::placeholder {
  color: rgb(90 102 109 / 0.45);
}

.input-action {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--foreground-muted);
  opacity: 0.6;
  transition: opacity var(--duration-gentle);
  flex-shrink: 0;
}

.input-action:hover {
  opacity: 1;
}

.input-action.non-interactive {
  pointer-events: none;
}

.input-wrapper--error {
  border-color: #e5484d;
}

.input-wrapper--error:focus-within {
  border-color: #e5484d;
}

.input-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.25rem;
  color: #e5484d;
  cursor: default;
  opacity: 0.85;
  transition: opacity var(--duration-gentle);
}

.input-error-icon:hover {
  opacity: 1;
}
</style>
