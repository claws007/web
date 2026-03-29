<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useFormContext } from "@/composables/useForm";

type RadioValue = string | number | boolean | null;

const props = withDefaults(
  defineProps<{
    modelValue?: RadioValue;
    value?: RadioValue;
    name?: string;
    disabled?: boolean;
    label?: string;
    fieldName?: string;
  }>(),
  {
    modelValue: null,
    value: null,
    name: "",
    disabled: false,
    label: "",
    fieldName: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: RadioValue];
}>();

const circleRef = ref<HTMLSpanElement | null>(null);
const form = useFormContext();
const isHovered = ref(false);
const fieldError = ref<string | null>(null);

const isChecked = computed(() => props.modelValue === props.value);

let pos = 0;
let raf = 0;
let lastTs = 0;

const SPEED_NORMAL = 6;
const SPEED_HOVER = 18;

function tick(ts: DOMHighResTimeStamp) {
  const delta = lastTs === 0 ? 0 : ts - lastTs;
  lastTs = ts;

  if (isChecked.value && circleRef.value) {
    const speed = isHovered.value ? SPEED_HOVER : SPEED_NORMAL;
    pos = (pos + speed * delta * 0.0025) % 400;
    circleRef.value.style.backgroundPosition = `${pos.toFixed(3)}% 50%`;
  }

  raf = requestAnimationFrame(tick);
}

function onChange(event: Event) {
  if (props.disabled) return;

  const checked = (event.target as HTMLInputElement).checked;
  if (!checked) return;

  emit("update:modelValue", props.value);
  if (form && props.fieldName) {
    form.updateFieldTouched(props.fieldName, true);
    form.updateFieldValue(props.fieldName, props.value);
  }
}

watch(isChecked, (active) => {
  if (active || !circleRef.value) return;
  pos = 0;
  circleRef.value.style.backgroundPosition = "0% 50%";
});

onMounted(() => {
  if (form && props.fieldName) {
    if (!form.getField(props.fieldName)) {
      form.registerField(props.fieldName);
    }
    form.updateFieldValue(props.fieldName, props.modelValue);
    fieldError.value = form.getFieldError(props.fieldName);
  }
  raf = requestAnimationFrame(tick);
});

onUnmounted(() => {
  if (form && props.fieldName) {
    form.unregisterField(props.fieldName);
  }
  cancelAnimationFrame(raf);
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
  <label
    class="radiobox"
    :class="{ 'is-disabled': disabled }"
    @mouseenter="isHovered = !disabled"
    @mouseleave="isHovered = false"
  >
    <input
      class="radiobox-native"
      type="radio"
      :name="name || fieldName"
      :checked="isChecked"
      :disabled="disabled"
      @change="onChange"
    />

    <span
      ref="circleRef"
      class="radiobox-circle"
      :class="{
        'is-active': isChecked,
        'is-error': !!fieldError,
      }"
      :title="fieldError ?? undefined"
      aria-hidden="true"
    >
      <span class="radiobox-dot" />
    </span>

    <span v-if="label" class="radiobox-label">{{ label }}</span>
    <slot v-else />
  </label>
</template>

<style scoped>
.radiobox {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  user-select: none;
  color: var(--foreground-muted);
}

.radiobox.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.radiobox-native {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.radiobox-circle {
  --radiobox-flow: linear-gradient(
    132deg,
    #25d3e8 0%,
    #7a60f1 50%,
    #25d3e8 100%
  );
  width: 1.3rem;
  height: 1.3rem;
  position: relative;
  border-radius: 999px;
  border: 1.5px solid rgb(90 102 109 / 0.28);
  background-color: rgb(255 255 255 / 0.84);
  background-size: 400% 100%;
  background-position: 0% 50%;
  display: inline-grid;
  place-items: center;
  box-shadow: 0 2px 10px rgb(30 56 111 / 0.07);
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal),
    border-color var(--duration-gentle) var(--ease-crystal),
    background-color var(--duration-gentle) var(--ease-crystal);
}

.radiobox-circle::before {
  content: "";
  position: absolute;
  inset: -0.34rem;
  border-radius: 999px;
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

.radiobox-dot {
  width: 0.54rem;
  height: 0.54rem;
  border-radius: 999px;
  background-color: rgb(255 255 255 / 0.98);
  opacity: 0;
  transform: scale(0.5);
  transition:
    opacity var(--duration-gentle) var(--ease-crystal),
    transform var(--duration-gentle) var(--ease-crystal);
}

.radiobox-circle.is-active {
  border-color: transparent;
  box-shadow:
    0 8px 24px rgb(76 147 244 / 0.26),
    0 0 0 1px rgb(255 255 255 / 0.16) inset;
  background-image: var(--radiobox-flow);
}

.radiobox-circle.is-error {
  border-color: rgb(220 38 38 / 0.85);
  box-shadow: 0 0 0 1px rgb(220 38 38 / 0.25);
}

.radiobox-circle.is-active::before {
  opacity: 0.78;
  transform: scale(1);
}

.radiobox-circle.is-active .radiobox-dot {
  opacity: 1;
  transform: scale(1);
}

.radiobox:not(.is-disabled):hover .radiobox-circle {
  transform: translateY(-1px);
  border-color: rgb(14 165 160 / 0.5);
}

.radiobox-native:focus-visible + .radiobox-circle {
  box-shadow: var(--shadow-focus);
}

.radiobox-label {
  font-size: 0.84rem;
  line-height: 1.2;
}
</style>
