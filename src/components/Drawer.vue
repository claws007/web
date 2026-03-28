<script lang="ts">
export {
  createDialogExpose,
  useDialogContext,
  dialogControllerKey,
} from "./Dialog.vue";

export type {
  DialogController,
  DialogExposed,
  DialogReject,
  DialogRejectedResult,
  DialogResolve,
  DialogResolvedResult,
  DialogSettledResult,
} from "./Dialog.vue";
</script>

<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { _pushEscHandler, _removeEscHandler } from "./Dialog.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    width?: string;
    side?: "left" | "right";
  }>(),
  {
    side: "right",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

function closeThis() {
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      _pushEscHandler(closeThis);
    } else {
      _removeEscHandler(closeThis);
    }
  },
  { immediate: true },
);

onUnmounted(() => _removeEscHandler(closeThis));

const slots = defineSlots<{
  header?(): unknown;
  default?(): unknown;
  footer?(): unknown;
}>();

function onOverlayClick() {
  emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <Transition :name="side === 'left' ? 'drawer-left' : 'drawer-right'" appear>
      <div
        v-if="modelValue"
        class="drawer-overlay"
        @click.self="onOverlayClick"
      >
        <aside
          class="drawer-shell"
          :class="{ 'drawer-shell--left': side === 'left' }"
          role="dialog"
          aria-modal="true"
          :style="width ? { width } : undefined"
        >
          <div v-if="slots.header" class="drawer-header">
            <slot name="header" />
          </div>

          <div v-if="slots.default" class="drawer-body">
            <slot />
          </div>

          <div v-if="slots.footer" class="drawer-footer">
            <slot name="footer" />
          </div>

          <div class="drawer-gradient-strip" aria-hidden="true" />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  background: rgb(15 20 30 / 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.drawer-shell {
  position: relative;
  width: min(92vw, 34rem);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  background: rgb(255 255 255 / 0.78);
  backdrop-filter: blur(var(--blur-glass, 20px));
  -webkit-backdrop-filter: blur(var(--blur-glass, 20px));

  border-left: 1px solid rgb(255 255 255 / 0.65);
  box-shadow:
    0 0 0 1px rgb(0 104 119 / 0.08),
    var(--shadow-float, 0 30px 80px rgb(0 104 119 / 0.12));
}

.drawer-shell--left {
  border-left: none;
  border-right: 1px solid rgb(255 255 255 / 0.65);
}

.drawer-header {
  padding: 1.25rem 1.5rem 0;
}

.drawer-body {
  flex: 1;
  overflow: auto;
  padding: 1rem 1.5rem;
}

.drawer-footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.5rem 1.25rem;
}

.drawer-gradient-strip {
  position: absolute;
  z-index: 0;
  top: -0.85rem;
  bottom: -0.85rem;
  right: 0;
  transform: translateX(45%);
  width: 12px;
  pointer-events: none;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgb(34 211 238 / 0) 0%,
    rgb(34 211 238 / 0.22) 18%,
    rgb(138 63 252 / 0.28) 50%,
    rgb(164 48 115 / 0.2) 82%,
    rgb(164 48 115 / 0) 100%
  );
  box-shadow:
    -1px 0 0 rgb(255 255 255 / 0.25) inset,
    7px 0 16px rgb(25 28 30 / 0.14);
  filter: blur(1.2px);
  opacity: 0.9;
  background-size: 100% 220%;
  animation:
    drawer-strip-flow 7.2s linear infinite,
    drawer-strip-pulse 2.8s ease-in-out infinite;
}

.drawer-shell--left .drawer-gradient-strip {
  right: auto;
  left: 0;
  transform: translateX(-45%);
  box-shadow:
    1px 0 0 rgb(255 255 255 / 0.25) inset,
    -7px 0 16px rgb(25 28 30 / 0.14);
}

:global(.drawer-right-enter-active),
:global(.drawer-right-leave-active),
:global(.drawer-left-enter-active),
:global(.drawer-left-leave-active) {
  transition: opacity 0.22s ease;
}

:global(.drawer-right-enter-active .drawer-shell),
:global(.drawer-right-leave-active .drawer-shell),
:global(.drawer-left-enter-active .drawer-shell),
:global(.drawer-left-leave-active .drawer-shell) {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

:global(.drawer-right-enter-from),
:global(.drawer-right-leave-to),
:global(.drawer-left-enter-from),
:global(.drawer-left-leave-to) {
  opacity: 0;
}

:global(.drawer-right-enter-from .drawer-shell),
:global(.drawer-right-leave-to .drawer-shell) {
  transform: translateX(100%);
  opacity: 0;
}

:global(.drawer-left-enter-from .drawer-shell),
:global(.drawer-left-leave-to .drawer-shell) {
  transform: translateX(-100%);
  opacity: 0;
}

@keyframes drawer-strip-flow {
  0% {
    background-position: 50% 0%;
  }

  100% {
    background-position: 50% 200%;
  }
}

@keyframes drawer-strip-pulse {
  0%,
  100% {
    opacity: 0.74;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .drawer-shell {
    width: 100vw;
  }
}
</style>
