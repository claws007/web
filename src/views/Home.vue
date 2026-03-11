<script setup lang="ts">
import { api } from "@/api";
import { dialogs } from "@/components/dialog";
import { PlusOutlined, SettingOutlined } from "@ant-design/icons-vue";

api.agent.agentList().then((d) => {
  console.debug(d.data, "dd");
});
</script>

<template>
  <div class="size-full h items-stretch bg-light">
    <div
      class="w-75 bg-light-2 border-r border-light-4 v [&>div]:px-4 py-4 gap-4"
    >
      <div class="h justify-between items-center">
        <div>Agents</div>
        <div class="h items-center gap-2">
          <Button @click="dialogs.CreateOrEditAgentDialog()">
            <PlusOutlined /> New Agent Group
          </Button>
          <Button>
            <SettingOutlined />
          </Button>
        </div>
      </div>
      <div class="stretch gap-2 v">
        <SelectableTag
          title="hello"
          content="test"
          background="4"
        ></SelectableTag>
      </div>
    </div>
  </div>
</template>
