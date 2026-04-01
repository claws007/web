<script setup lang="ts">
import { computed, ref, type PropType } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean as PropType<boolean | undefined>,
    default: undefined,
  },
  defaultExpanded: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  toggle: [value: boolean];
}>();

const uncontrolledExpanded = ref(props.defaultExpanded);
const contentId = `collapse-content-${Math.random().toString(36).slice(2, 10)}`;

const isExpanded = computed({
  get: () =>
    typeof props.modelValue === "boolean"
      ? props.modelValue
      : uncontrolledExpanded.value,
  set: (value: boolean) => {
    if (typeof props.modelValue !== "boolean") {
      uncontrolledExpanded.value = value;
    }
    emit("update:modelValue", value);
    emit("toggle", value);
  },
});

function toggle() {
  if (props.disabled) {
    return;
  }

  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <section :class="{ 'opacity-65': disabled }">
    <slot name="title">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4 rounded-[0.9rem] border-0 bg-transparent px-4 py-[0.8rem] text-inherit transition-colors duration-200 ease-crystal hover:bg-black/3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_28%,white)] disabled:cursor-not-allowed"
        :disabled="disabled"
        :aria-expanded="isExpanded"
        :aria-controls="contentId"
        @click="toggle"
      >
        {{ title || "详情" }}
        <span
          class="shrink-0 text-[0.95rem] transition-transform duration-200 ease-crystal"
          :class="{ 'rotate-180': isExpanded }"
        >
          ▾
        </span>
      </button>
    </slot>

    <div
      :id="contentId"
      class="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      :class="
        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      "
    >
      <div
        class="min-h-0 overflow-hidden"
        :class="{ 'pointer-events-none': !isExpanded }"
      >
        <slot />
      </div>
    </div>
  </section>
</template>
