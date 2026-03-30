<script setup lang="ts">
import { computed, ref, useSlots } from "vue";

interface Props {
  modelValue?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
  title: "",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  toggle: [value: boolean];
}>();

const slots = useSlots();
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

function onEnter(el: Element) {
  const node = el as HTMLElement;
  node.style.height = "0px";
  node.style.opacity = "0";
  node.style.overflow = "hidden";

  requestAnimationFrame(() => {
    node.style.height = `${node.scrollHeight}px`;
    node.style.opacity = "1";
  });
}

function onAfterEnter(el: Element) {
  const node = el as HTMLElement;
  node.style.height = "auto";
  node.style.overflow = "visible";
}

function onBeforeLeave(el: Element) {
  const node = el as HTMLElement;
  node.style.height = `${node.scrollHeight}px`;
  node.style.opacity = "1";
  node.style.overflow = "hidden";
}

function onLeave(el: Element) {
  const node = el as HTMLElement;
  void node.offsetHeight;
  node.style.height = "0px";
  node.style.opacity = "0";
}

function onAfterLeave(el: Element) {
  const node = el as HTMLElement;
  node.style.height = "";
  node.style.opacity = "";
  node.style.overflow = "";
}
</script>

<template>
  <section class="collapse" :class="{ 'collapse--disabled': disabled }">
    <button
      type="button"
      class="collapse-trigger"
      :disabled="disabled"
      :aria-expanded="isExpanded"
      :aria-controls="contentId"
      @click="toggle"
    >
      <span class="collapse-title">
        <slot name="title">
          {{ title || "详情" }}
        </slot>
      </span>
      <span class="collapse-icon" :class="{ 'is-expanded': isExpanded }">
        ▾
      </span>
    </button>

    <Transition
      name="collapse-content"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-if="isExpanded" :id="contentId" class="collapse-content">
        <slot v-if="slots.default" />
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.collapse {
  border: 1px solid rgb(90 102 109 / 0.22);
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 0.82);
  box-shadow: 0 10px 24px rgb(0 104 119 / 0.08);
}

.collapse--disabled {
  opacity: 0.65;
}

.collapse-trigger {
  width: 100%;
  border: 0;
  border-radius: 0.9rem;
  background: transparent;
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.collapse-trigger:disabled {
  cursor: not-allowed;
}

.collapse-title {
  text-align: left;
}

.collapse-icon {
  transition: transform 0.2s ease;
}

.collapse-icon.is-expanded {
  transform: rotate(180deg);
}

.collapse-content {
  border-top: 1px solid rgb(90 102 109 / 0.16);
  padding: 0.85rem 1rem 1rem;
}

:global(.collapse-content-enter-active),
:global(.collapse-content-leave-active) {
  transition:
    height 0.22s ease,
    opacity 0.22s ease;
}
</style>