<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "primary" | "ghost" | "danger";
    size?: "default" | "medium" | "small";
  }>(),
  {
    type: "ghost",
    size: "default",
  },
);
</script>

<template>
  <button
    class="dialog-btn"
    :class="[`dialog-btn--${type}`, `dialog-btn--${size}`]"
  >
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

.dialog-btn--medium {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

.dialog-btn--small {
  padding: 0.4rem 1.25rem;
  font-size: 0.75rem;
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
