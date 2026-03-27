<script setup lang="ts">
import { progressState } from "./store";
import FloatingPortal from "./FloatingPortal.vue";
import NotificationContainer from "./NotificationContainer.vue";
import ProgressWidget from "./ProgressWidget.vue";
</script>

<template>
  <NotificationContainer />
  <FloatingPortal
    :visible="progressState.tasks.length > 0"
    transition-name="pw-fade"
  >
    <ProgressWidget />
  </FloatingPortal>
</template>

<style>
/* ProgressWidget fade transition */
.pw-fade-enter-active,
.pw-fade-leave-active {
  transition: opacity 0.3s ease;
}

.pw-fade-enter-from,
.pw-fade-leave-to {
  opacity: 0;
}
</style>
