<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    content?: string | null;
  }>(),
  {
    content: "",
  },
);

const markdownParser = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

const renderedHtml = computed(() => markdownParser.render(props.content ?? ""));
</script>

<template>
  <article class="markdown-previewer markdown-body" v-html="renderedHtml" />
</template>

<style>
@import "github-markdown-css/github-markdown.css";

.markdown-previewer.markdown-body {
  box-sizing: border-box;
  min-width: 0;
  max-width: none;
  margin: 0;
  padding: 0;
  color: inherit;
  background: transparent;
}

.markdown-previewer.markdown-body > :first-child {
  margin-top: 0;
}

.markdown-previewer.markdown-body > :last-child {
  margin-bottom: 0;
}
</style>
