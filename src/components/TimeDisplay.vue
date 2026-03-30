<template>
  <button
    class="bg-none border-none p-0 m-0 cursor-pointer truncate transition-opacity duration-120 hover:opacity-70 active:opacity-85"
    :title="times.detailed"
    @click.stop="toggleMode"
  >
    {{ currentDisplay }}
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { formatTimeDisplay } from "@/utils/time";

interface Props {
  timestamp: string | null | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  timestamp: undefined,
});

const showDetailed = ref(false);

const times = computed(() => {
  return formatTimeDisplay(props.timestamp);
});

const currentDisplay = computed(() => {
  return showDetailed.value ? times.value.detailed : times.value.relative;
});

function toggleMode() {
  showDetailed.value = !showDetailed.value;
}
</script>

<style scoped>
/* All styles migrated to Tailwind CSS utility classes */
</style>
