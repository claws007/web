<script setup lang="ts">
withDefaults(
  defineProps<{
    visible?: boolean;
    transitionName?: string;
  }>(),
  {
    visible: true,
    transitionName: "",
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition v-if="transitionName" :name="transitionName">
      <slot v-if="visible" />
    </Transition>
    <slot v-else-if="visible" />
  </Teleport>
</template>
