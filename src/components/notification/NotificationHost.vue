<script setup lang="ts">
import { computed } from "vue";
import { getNotificationRealtimeState } from "@/services/notification-realtime";
import { notificationState } from "./store";
import FloatingPortal from "./FloatingPortal.vue";
import NotificationWidget from "./NotificationWidget.vue";

const realtimeState = getNotificationRealtimeState();

const hasPendingRequests = computed(() =>
  realtimeState.items.some((item) => item.state === "PENDING"),
);
</script>

<template>
  <FloatingPortal
    :visible="
      notificationState.entries.length > 0 ||
      notificationState.closing ||
      hasPendingRequests
    "
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

/* Hide floating global notification widget while notification drawer is open. */
body.notification-drawer-open #__notification-host__ {
  display: none !important;
}
</style>
