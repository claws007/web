<script setup lang="ts">
defineProps<{
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}>();
</script>

<template>
  <button
    class="default-btn"
    :type="type ?? 'button'"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<style scoped>
.default-btn {
  height: 2.4rem;
  border-radius: 999px;
  border: 1px solid rgb(90 102 109 / 0.25);
  background: rgb(255 255 255 / 0.85);
  font-size: 0.9rem;
  color: #242933;
  cursor: pointer;
  transition: transform var(--duration-gentle) var(--ease-crystal);
  font: inherit;
}

.default-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.default-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
