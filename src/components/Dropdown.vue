<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { StyleValue } from "vue";
import { useFloating, type FloatPlacement } from "@/utils/useFloating";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    placement?: FloatPlacement;
    disabled?: boolean;
    triggerOnClick?: boolean;
    closeOnClickOutside?: boolean;
    closeOnContentClick?: boolean;
    panelStyle?: StyleValue;
    disableFlip?: boolean;
  }>(),
  {
    modelValue: undefined,
    placement: "bottom",
    disabled: false,
    triggerOnClick: true,
    closeOnClickOutside: true,
    closeOnContentClick: false,
    panelStyle: undefined,
    disableFlip: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  close: [];
}>();

const uncontrolledOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const placementRef = computed(() => props.placement);
const disableFlipRef = computed(() => props.disableFlip);

const isOpen = computed({
  get: () =>
    typeof props.modelValue === "boolean"
      ? props.modelValue
      : uncontrolledOpen.value,
  set: (value: boolean) => {
    if (typeof props.modelValue !== "boolean") {
      uncontrolledOpen.value = value;
    }
    emit("update:modelValue", value);
  },
});

const { mount, unmount, update } = useFloating(triggerRef, placementRef, {
  disableFlip: disableFlipRef,
});

function open() {
  if (props.disabled || isOpen.value) {
    return;
  }
  isOpen.value = true;
  emit("open");
}

function close() {
  if (!isOpen.value) {
    return;
  }
  isOpen.value = false;
  emit("close");
}

function toggle() {
  if (props.disabled) {
    return;
  }
  if (isOpen.value) {
    close();
    return;
  }
  open();
}

function handleTriggerClick() {
  if (!props.triggerOnClick) {
    return;
  }

  toggle();
}

function onBeforeEnter(el: Element) {
  mount(el as HTMLElement);
}

function onAfterLeave() {
  unmount();
}

function handlePanelClick() {
  if (props.closeOnContentClick) {
    close();
  }
}

function onDocumentPointerDown(event: MouseEvent) {
  if (!isOpen.value || !props.closeOnClickOutside) {
    return;
  }

  const target = event.target as Node | null;
  if (!target) {
    return;
  }

  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return;
  }

  close();
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    close();
  }
}

watch(
  () => isOpen.value,
  async (nextOpen) => {
    if (!nextOpen) {
      return;
    }

    await nextTick();
    update();
  },
);

watch(
  () => props.placement,
  async () => {
    if (!isOpen.value) {
      return;
    }
    await nextTick();
    update();
  },
);

onMounted(() => {
  document.addEventListener("mousedown", onDocumentPointerDown);
  document.addEventListener("keydown", onDocumentKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onDocumentPointerDown);
  document.removeEventListener("keydown", onDocumentKeyDown);
});
</script>

<template>
  <div class="dropdown" :class="{ 'dropdown--disabled': disabled }">
    <div ref="triggerRef" class="dropdown-trigger" @click="handleTriggerClick">
      <slot
        name="trigger"
        :open="isOpen"
        :toggle="toggle"
        :open-dropdown="open"
        :close-dropdown="close"
      >
        <button type="button" class="dropdown-fallback-trigger">
          <span>Dropdown</span>
          <span class="dropdown-fallback-arrow" :class="{ 'is-open': isOpen }">
            ▾
          </span>
        </button>
      </slot>
    </div>

    <Teleport to="body">
      <Transition
        appear
        enter-active-class="dropdown-enter-active"
        enter-from-class="dropdown-enter-from"
        enter-to-class="dropdown-enter-to"
        leave-active-class="dropdown-leave-active"
        leave-from-class="dropdown-leave-from"
        leave-to-class="dropdown-leave-to"
        @before-enter="onBeforeEnter"
        @before-appear="onBeforeEnter"
        @after-leave="onAfterLeave"
      >
        <div
          v-if="isOpen"
          ref="panelRef"
          class="dropdown-panel"
          :class="`dropdown-panel--${placement}`"
          :style="panelStyle"
          role="menu"
          @click="handlePanelClick"
        >
          <slot :close-dropdown="close" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown {
  display: flex;
  position: relative;
}

.dropdown--disabled {
  opacity: 0.65;
  pointer-events: none;
}

.dropdown-trigger {
  display: flex;
  width: 100%;
}

.dropdown-fallback-trigger {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, white);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 85%, white);
  color: var(--foreground);
  padding: 0.45rem 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.dropdown-fallback-arrow {
  display: inline-block;
  transition: transform 220ms var(--ease-crystal);
}

.dropdown-fallback-arrow.is-open {
  transform: rotate(180deg);
}

.dropdown-panel {
  position: fixed;
  z-index: 9999;
  min-width: 12rem;
  max-width: min(92vw, 24rem);
  border-radius: 0.9rem;
  border: 1px solid rgb(255 255 255 / 0.46);
  background: linear-gradient(
    170deg,
    rgb(255 255 255 / 0.1),
    rgb(255 255 255 / 0.04)
  );
  box-shadow:
    0 16px 36px rgb(0 104 119 / 0.16),
    0 2px 8px rgb(0 0 0 / 0.08),
    inset 0 1px 0 rgb(255 255 255 / 0.2);
  backdrop-filter: blur(14px) saturate(165%);
  -webkit-backdrop-filter: blur(14px) saturate(165%);
  padding: 0.45rem;
  color: var(--foreground);
}

.dropdown-enter-active {
  transition:
    opacity 220ms var(--ease-crystal),
    transform 220ms var(--ease-crystal);
}

.dropdown-leave-active {
  transition:
    opacity 160ms cubic-bezier(0.4, 0, 1, 1),
    transform 160ms cubic-bezier(0.4, 0, 1, 1);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scale(1);
}

.dropdown-panel--top.dropdown-enter-from,
.dropdown-panel--top.dropdown-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

.dropdown-panel--bottom.dropdown-enter-from,
.dropdown-panel--bottom.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.dropdown-panel--left.dropdown-enter-from,
.dropdown-panel--left.dropdown-leave-to {
  opacity: 0;
  transform: translateX(6px) scale(0.96);
}

.dropdown-panel--right.dropdown-enter-from,
.dropdown-panel--right.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-6px) scale(0.96);
}
</style>
