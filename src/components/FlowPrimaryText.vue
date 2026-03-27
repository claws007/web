<template>
  <span class="flow-primary-text">
    <slot />
  </span>
</template>

<script setup lang="ts"></script>

<style scoped>
.flow-primary-text {
  display: inline-block;
  font-weight: inherit;
  background-image: linear-gradient(
    110deg,
    var(--primary) 0%,
    var(--secondary) 38%,
    var(--tertiary) 64%,
    var(--primary) 100%
  );
  background-size: 220% 100%;
  background-position: 0% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: flow-primary-text-shift 3.8s linear infinite;
}

@keyframes flow-primary-text-shift {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 220% 50%;
  }
}
</style>
