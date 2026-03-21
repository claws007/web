<template>
  <Dialog :dialog :title size="large" :disable-escape-key>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
      <div class="h items-center gap-2">
        <ClickableIcon
          @click="handleUploadImage"
          :icon="FileImageOutlined"
          :label="$t('uploadImage')"
        ></ClickableIcon>
        <div class="text-light text-sm">
          <InfoCircleOutlined></InfoCircleOutlined> {{ $t("markdownUsable") }}
        </div>
      </div>
      <!-- <Textarea v-model="textareaValue"></Textarea> -->
      <!-- :placeholder -->
      <!-- class="text-md size-full resize-none bg-transparent outline-none" -->
      <!-- :rows="8" -->
      <MarkdownEditor
        class="stretch items-stretch"
        @focusin="disableEscapeKey = true"
        @focusout="disableEscapeKey = false"
        ref="markdownEditorRef"
        auto-focus
        v-model="textareaValue"
      ></MarkdownEditor>
      <!-- class="min-h-[104px]" -->
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish(textareaValue)" type="primary">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { FileImageOutlined, InfoCircleOutlined } from "@ant-design/icons-vue";
import type { DialogType } from "../dialog";
import MarkdownEditor from "@/components/MarkdownEditor.vue";

const props = defineProps<{
  dialog: DialogType<any, string>;
  title?: string | null;
  content?: string;
  value?: string | null;
  placeholder?: string;
}>();

const textareaValue = ref(props.value || "");

const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor>>();
function handleUploadImage() {
  markdownEditorRef.value?.uploadImage();
}

const disableEscapeKey = ref(false);
</script>
