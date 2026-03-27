<script setup lang="ts">
import { toastState } from "./store";
import NotificationItem from "./NotificationItem.vue";
import FloatingPortal from "./FloatingPortal.vue";
import { provide, ref } from "vue";
import {
  useFloatingCornerPosition,
  type CornerPosition,
} from "./composables/useFloatingLayer";

const notifLayerRef = ref<HTMLElement | null>(null);

const positionState = ref<CornerPosition>({
  vertical: "bottom",
  horizontal: "right",
});

provide("notificationPosition", positionState);

const { positionClasses } = useFloatingCornerPosition(
  notifLayerRef,
  positionState,
);
</script>

<template>
  <FloatingPortal>
    <div
      ref="notifLayerRef"
      class="notif-layer"
      :class="positionClasses"
      aria-live="assertive"
      aria-atomic="false"
    >
      <TransitionGroup tag="div" name="notif-t" class="notif-list">
        <NotificationItem
          v-for="item in toastState.items"
          :key="item.id"
          :item="item"
        />
      </TransitionGroup>
    </div>
  </FloatingPortal>
</template>

<style scoped>
.notif-layer {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  /* Default: bottom-right */
  bottom: 1.25rem;
  right: 1.25rem;
  transition:
    top 0.3s ease,
    bottom 0.3s ease,
    left 0.3s ease,
    right 0.3s ease;
}

/* Position combinations */
.notif-layer.top.right {
  top: 1.25rem;
  right: 1.25rem;
  bottom: auto;
  left: auto;
}

.notif-layer.top.left {
  top: 1.25rem;
  left: 1.25rem;
  bottom: auto;
  right: auto;
}

.notif-layer.bottom.left {
  bottom: 1.25rem;
  left: 1.25rem;
  top: auto;
  right: auto;
}

.notif-layer.bottom.right {
  bottom: 1.25rem;
  right: 1.25rem;
  top: auto;
  left: auto;
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-items: flex-end;
}

/* Adjust alignment based on horizontal position */
.notif-layer.left .notif-list {
  align-items: flex-start;
}
</style>

<!--
  TransitionGroup leave/move classes must be unscoped so that Vue applies them
  to the child element roots correctly.
-->
<style>
/* Enter animation */
.notif-t-enter-active {
  transition:
    opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.notif-t-enter-from {
  opacity: 0;
  transform: translateX(calc(100% + 1.5rem)) scale(0.95);
}

/* Leave animation */
.notif-t-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.notif-t-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 1.5rem)) scale(0.95);
}

/* Move animation when list reorders */
.notif-t-move {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
