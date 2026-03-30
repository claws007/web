<template>
  <div class="size-full v bg-[rgb(247 249 251)]">
    <Navbar class="absolute top-0 left-0 z-40" />
    <div class="stretch overflow-auto pt-16">
      <!-- Main Content -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
</script>

<style scoped></style>
