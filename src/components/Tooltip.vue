<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useFloating, type FloatPlacement } from "../utils/useFloating";

const props = withDefaults(
  defineProps<{
    content?: string;
    placement?: FloatPlacement;
    /** Keep the tooltip always visible regardless of hover state */
    persistent?: boolean;
    /** Keep tooltip visible when cursor moves from anchor to tooltip body */
    hoverable?: boolean;
  }>(),
  {
    placement: "top",
    persistent: false,
    hoverable: true,
  },
);

const hovered = ref(false);
const bubbleHovered = ref(false);
const visible = computed(
  () => props.persistent || hovered.value || (props.hoverable && bubbleHovered.value),
);

const anchorRef = ref<HTMLElement | null>(null);
const bubbleRef = ref<HTMLElement | null>(null);
const placementRef = computed(() => props.placement);

const { mount, unmount, update } = useFloating(anchorRef, placementRef);

// Watch visible + bubbleRef together. This avoids the race where visible is
// already true on first run but bubbleRef is still null at that moment.
watch(
  [visible, bubbleRef],
  ([isVisible, bubble]) => {
    if (isVisible && bubble) mount(bubble);
    else if (!isVisible) unmount();
  },
  { immediate: true, flush: "post" },
);

// Keep floating position in sync when content size or placement changes.
watch([() => props.content, () => props.placement], () => update(), {
  flush: "post",
});
</script>

<template>
  <div
    ref="anchorRef"
    class="tooltip-host"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <slot />

    <Teleport to="body">
      <Transition
        appear
        enter-active-class="tooltip-enter-active"
        enter-from-class="tooltip-enter-from"
        enter-to-class="tooltip-enter-to"
        leave-active-class="tooltip-leave-active"
        leave-from-class="tooltip-leave-from"
        leave-to-class="tooltip-leave-to"
      >
        <div
          v-if="visible && content"
          ref="bubbleRef"
          :class="[
            'tooltip-bubble',
            `tooltip-bubble--${placement}`,
            { 'tooltip-bubble--hoverable': props.hoverable },
          ]"
          role="tooltip"
          @mouseenter="bubbleHovered = true"
          @mouseleave="bubbleHovered = false"
        >
          <div class="tooltip-content">{{ content }}</div>
          <div :class="['tooltip-arrow', `tooltip-arrow--${placement}`]" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tooltip-host {
  display: inline-flex;
}

/* ── Bubble ─────────────────────────────────────────────── */
.tooltip-bubble {
  --tooltip-viewport-gap: 12px;

  position: fixed;
  z-index: 9999;
  width: max-content;
  max-width: 18rem;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--foreground);
  pointer-events: none;

  /* Frosted glass */
  background: rgb(247 249 251 / 0.65);
  backdrop-filter: blur(var(--blur-glass)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(180%);
  border: 1px solid rgb(255 255 255 / 0.55);
  box-shadow:
    0 4px 16px rgb(0 104 119 / 0.1),
    0 1px 4px rgb(0 0 0 / 0.06),
    inset 0 1px 0 rgb(255 255 255 / 0.7);
}

.tooltip-bubble--hoverable {
  pointer-events: auto;
}

.tooltip-content {
  max-height: calc(100vh - var(--tooltip-viewport-gap) * 2);
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Arrow ──────────────────────────────────────────────── */
.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgb(247 249 251 / 0.65);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid rgb(255 255 255 / 0.55);
  border-radius: 1px;
}

.tooltip-arrow--top {
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-60%) rotate(45deg);
  border-top: none;
  border-left: none;
}
.tooltip-arrow--bottom {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(60%) rotate(45deg);
  border-bottom: none;
  border-right: none;
}
.tooltip-arrow--left {
  left: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(-60%) rotate(45deg);
  border-top: none;
  border-right: none;
}
.tooltip-arrow--right {
  right: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(60%) rotate(45deg);
  border-bottom: none;
  border-left: none;
}

/* ── Transition ─────────────────────────────────────────── */

/* Enter: 300ms spring, leave: 160ms quick ease-in */
.tooltip-enter-active {
  transition:
    opacity 300ms var(--ease-crystal),
    transform 300ms var(--ease-crystal);
}
.tooltip-leave-active {
  transition:
    opacity 160ms cubic-bezier(0.4, 0, 1, 1),
    transform 160ms cubic-bezier(0.4, 0, 1, 1);
}

.tooltip-enter-to,
.tooltip-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* top: rises from anchor edge */
.tooltip-bubble--top.tooltip-enter-from,
.tooltip-bubble--top.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.86) translateY(8px);
}

/* bottom: drops from anchor edge */
.tooltip-bubble--bottom.tooltip-enter-from,
.tooltip-bubble--bottom.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.86) translateY(-8px);
}

/* left: slides in from right */
.tooltip-bubble--left.tooltip-enter-from,
.tooltip-bubble--left.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.86) translateX(8px);
}

/* right: slides in from left */
.tooltip-bubble--right.tooltip-enter-from,
.tooltip-bubble--right.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.86) translateX(-8px);
}
</style>
