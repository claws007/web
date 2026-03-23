<script setup lang="ts">
defineProps<{
  href?: string;
  type?: "button" | "submit" | "reset";
}>();
</script>

<template>
  <a v-if="href" :href="href" class="text-btn"><slot /></a>
  <button v-else :type="type ?? 'button'" class="text-btn"><slot /></button>
</template>

<style scoped>
.text-btn {
  color: var(--primary);
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.text-btn:hover {
  text-decoration: underline;
}
</style>
