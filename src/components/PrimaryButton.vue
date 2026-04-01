<script setup lang="ts">
import { computed, ref } from "vue";
import { useFormContext } from "@/composables/useForm";
import FlowPrimaryBackground from "./FlowPrimaryBackground.vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    size?: "default" | "medium" | "small";
  }>(),
  {
    size: "default",
  },
);

const form = useFormContext();
const isHovered = ref(false);

const computedDisabled = computed(() => {
  // If disabled prop is explicitly set, use it
  if (props.disabled) {
    return true;
  }

  // If loading is set, disable the button
  if (props.loading) {
    return true;
  }

  // If in a form context, check form validation state
  if (form) {
    return !form.isValid || form.isValidating;
  }

  return false;
});
</script>

<template>
  <button
    @mouseenter="isHovered = !computedDisabled && true"
    @mouseleave="isHovered = false"
    class="cursor-pointer shadow-none!"
  >
    <FlowPrimaryBackground
      :is-hovered="isHovered"
      class="primary-btn"
      :class="`primary-btn--${size}`"
      :disabled="computedDisabled"
    >
      <span v-if="loading" class="spinner" />
      <slot />
    </FlowPrimaryBackground>
  </button>
</template>

<style scoped>
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem 1.75rem;
  border: none;
  border-radius: var(--radius-pill);
  position: relative;
  isolation: isolate;
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 8px 28px rgb(120 37 234 / 0.22);
  transition:
    transform var(--duration-gentle) var(--ease-crystal),
    box-shadow var(--duration-gentle) var(--ease-crystal),
    opacity var(--duration-gentle) var(--ease-crystal);
  user-select: none;
}

.primary-btn--medium {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

.primary-btn--small {
  padding: 0.4rem 1.25rem;
  font-size: 0.75rem;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 36px rgb(120 37 234 / 0.32);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
  opacity: 0.85;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid rgb(255 255 255 / 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
