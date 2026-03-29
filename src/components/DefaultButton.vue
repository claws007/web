<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    size?: "default" | "medium" | "small";
  }>(),
  {
    size: "default",
  },
);
</script>

<template>
  <button
    class="default-btn"
    :class="`default-btn--${size}`"
    :type="type ?? 'button'"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<style scoped>
.default-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.4rem;
  padding: 0 1.5rem;
  border-radius: 999px;
  border: 1px solid rgb(90 102 109 / 0.25);
  background: rgb(255 255 255 / 0.85);
  font-size: 0.9rem;
  color: #242933;
  cursor: pointer;
  transition: transform var(--duration-gentle) var(--ease-crystal);
  font: inherit;
}

.default-btn--medium {
  height: 2.75rem;
  padding: 0 1.75rem;
  font-size: 1rem;
}

.default-btn--small {
  height: 2rem;
  padding: 0 1rem;
  font-size: 0.8rem;
}

.default-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.default-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
