<script setup lang="ts">
import { PlusOutlined } from "@ant-design/icons-vue";
</script>

<template>
  <div class="size-full h items-stretch bg-light">
    <div
      class="w-75 bg-light-2 border-r border-light-4 v [&>div]:px-4 py-4 gap-4"
    >
      <div class="h justify-between items-center">
        <div>Agents</div>
        <Button> <PlusOutlined /> New Agent Group </Button>
      </div>
      <div class="stretch gap-2 v">
        <div class="p-2 bg-light-4 rounded">sdf</div>
        <div class="p-2 bg-light-4 rounded">sdf</div>
      </div>
    </div>
  </div>
</template>
