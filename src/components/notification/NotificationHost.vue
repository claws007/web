<script setup lang="ts">
import { notificationState } from "./store";
import FloatingPortal from "./FloatingPortal.vue";
import NotificationWidget from "./ProgressWidget.vue";
</script>

<template>
  <FloatingPortal
    :visible="notificationState.entries.length > 0 || notificationState.closing"
    transition-name="nw-fade"
  >
    <NotificationWidget />
  </FloatingPortal>
</template>

<style>
/* NotificationWidget fade transition */
.nw-fade-enter-active,
.nw-fade-leave-active {
  transition: opacity 0.3s ease;
}

.nw-fade-enter-from,
.nw-fade-leave-to {
  opacity: 0;
}
</style>
