<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "primary" | "ghost" | "danger";
  }>(),
  {
    type: "ghost",
  },
);
</script>

<template>
  <button class="dialog-btn" :class="`dialog-btn--${type}`">
    <slot />
  </button>
</template>

<style scoped>
.dialog-btn {
  padding: 0.55rem 1.75rem;
  border: none;
  border-radius: var(--radius-pill);
  background: rgb(90 102 109 / 0.12);
  color: #36434b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
}

.dialog-btn:hover {
  opacity: 0.85;
}

.dialog-btn--primary {
  background: var(--primary);
  color: #fff;
}

.dialog-btn--ghost {
  background: rgb(90 102 109 / 0.12);
  color: #36434b;
}

.dialog-btn--danger {
  background: #dc2626;
  color: #fff;
}
</style>
