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
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

const renderedHtml = computed(() => markdownParser.render(props.content ?? ""));
</script>

<template>
  <article
    class="markdown-previewer markdown-body text-sm!"
    v-html="renderedHtml"
  />
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
.markdown-body hr {
  background: var(--color-primary);
  opacity: 0.2;
  border-radius: 1rem;
  height: 0.15rem;
}
.markdown-body think {
  display: block;
  margin: 0.4rem 0;
  color: var(--color-foreground);
}
.markdown-body think::before {
  content: "💭";
  margin-right: 0.1rem;
}
</style>
