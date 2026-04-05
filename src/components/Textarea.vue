<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import Tooltip from "./Tooltip.vue";
import { useFormContext } from "@/composables/useForm";
import { runValidator } from "@/utils/validators";
import type { Validator } from "@/utils/validators";

type ValidateFn = (
  value: string,
) => undefined | null | boolean | string | number;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    rows?: number;
    /** RegExp, pattern string (converted via new RegExp), or validator function */
    validate?: RegExp | string | ValidateFn;
    /** Validation throttle interval in milliseconds. Set 0 to disable throttling. */
    validateThrottleMs?: number;
    /** Field name for form integration. If provided, validators will be retrieved from Form context */
    fieldName?: string;
  }>(),
  {
    modelValue: "",
    rows: 4,
    validateThrottleMs: 500,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  enter: [event: KeyboardEvent, value: string];
}>();

const form = useFormContext();
const errorMessage = ref<string | null>(null);
const isValidating = ref(false);
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let pendingValidationValue: string | null = null;
let lastValidationAt = 0;

function runValidation(value: string) {
  let validator: Validator | undefined;

  if (form && props.fieldName) {
    const field = form.getField(props.fieldName);
    if (field && field.validators.length > 0) {
      isValidating.value = true;
      const validators = field.validators;

      (async () => {
        try {
          for (const v of validators) {
            const result = await runValidator(v, value);
            if (!result.isValid) {
              errorMessage.value = result.message;
              form.updateFieldValue(props.fieldName!, value);
              return;
            }
          }
          errorMessage.value = null;
          form.updateFieldValue(props.fieldName!, value);
        } finally {
          isValidating.value = false;
        }
      })();
      return;
    }
  }

  validator = props.validate;

  if (!validator) {
    errorMessage.value = null;
    if (form && props.fieldName) {
      form.updateFieldValue(props.fieldName, value);
    }
    return;
  }

  isValidating.value = true;

  (async () => {
    try {
      const result = await runValidator(validator, value);
      errorMessage.value = result.message;
      if (form && props.fieldName) {
        form.updateFieldValue(props.fieldName, value);
      }
    } finally {
      isValidating.value = false;
    }
  })();
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
  const value = (event.target as HTMLTextAreaElement).value;
  emit("update:modelValue", value);

  if (form && props.fieldName) {
    form.updateFieldTouched(props.fieldName, true);
  }

  scheduleValidation(value);
}

function onEnter(event: KeyboardEvent) {
  if (event.isComposing || event.shiftKey || event.repeat) {
    return;
  }

  event.preventDefault();
  const value = (event.target as HTMLTextAreaElement).value;
  emit("enter", event, value);
}

onUnmounted(() => {
  clearThrottleTimer();
  if (form && props.fieldName) {
    form.unregisterField(props.fieldName);
  }
});

onMounted(() => {
  if (form && props.fieldName) {
    if (!form.getField(props.fieldName)) {
      form.registerField(props.fieldName);
    }
    form.updateFieldValue(props.fieldName, props.modelValue ?? "");
    if (props.validate) {
      form.updateFieldValidators(props.fieldName, [props.validate]);
    }
  }
});

watch(
  () => props.validate,
  (newValidator) => {
    if (form && props.fieldName && newValidator) {
      form.updateFieldValidators(props.fieldName, [newValidator]);
    }
  },
);

watch(
  () => (form && props.fieldName ? form.getFieldError(props.fieldName) : null),
  (nextError) => {
    if (nextError !== null) {
      errorMessage.value = nextError;
      return;
    }
    if (form && props.fieldName && form.getField(props.fieldName)?.touched) {
      errorMessage.value = null;
    }
  },
);

watch(
  () => (form ? form.submitValidationVersion : 0),
  () => {
    if (!form || !props.fieldName) return;
    errorMessage.value = form.getFieldError(props.fieldName);
  },
);

defineExpose({
  validate: () => scheduleValidation(props.modelValue ?? "", true),
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div
      :class="[
        'relative flex items-start rounded-sm border-[1.5px] bg-surface-container-lowest/5 backdrop-blur-sm',
        'transition-[border-color,box-shadow] duration-[--duration-gentle] ease-crystal',
        errorMessage
          ? [
              'border-[#e5484d]',
              'shadow-[0_0_0_3px_rgb(229_72_77/0.1),0_1px_4px_0_rgb(0_0_0/0.06)]',
              'focus-within:shadow-[0_0_0_3px_rgb(229_72_77/0.15),0_1px_4px_0_rgb(0_0_0/0.06)]',
            ]
          : [
              'border-outline-ghost',
              'shadow-[0_1px_4px_0_rgb(0_0_0/0.06),0_0.5px_1.5px_0_rgb(0_0_0/0.04)]',
              'focus-within:border-primary',
              'focus-within:shadow-[0_0_0_3px_rgb(0_104_119/0.12),0_1px_4px_0_rgb(0_0_0/0.06)]',
            ],
      ]"
    >
      <textarea
        :rows="rows"
        :placeholder="placeholder"
        :value="modelValue"
        class="flex-1 min-w-0 resize-none border-0 bg-transparent outline-none px-3 py-2.5 text-[0.9375rem] font-sans text-foreground leading-[1.6] placeholder:text-foreground-muted/45 focus:shadow-none"
        @input="onInput"
        @keydown.enter="onEnter"
      />

      <Tooltip
        :content="errorMessage ?? undefined"
        placement="top"
        :persistent="true"
        class="absolute bottom-2 right-2.5 text-[#e5484d] cursor-default opacity-[0.85] hover:opacity-100 transition-opacity duration-[--duration-gentle]"
      >
        <span v-show="errorMessage" aria-label="校验错误">
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
