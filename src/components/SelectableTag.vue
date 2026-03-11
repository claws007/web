<template>
  <div
    v-wave
    :class="[
      'group/g shrink-0 cursor-pointer overflow-hidden rounded break-all',
      `bg-light-${background}`,
      selected
        ? 'bg-(--theme)! text-(--theme-text-color)'
        : `hover:bg-light-${+background + 1}`,
    ]"
    :style="theme.cssVariables"
  >
    <div class="v gap-1 p-2">
      <div class="v gap-1">
        <div class="h items-center justify-between gap-2">
          <div class="h stretch items-center gap-2">
            <!-- <div
              :class="[
                'flex items-center rounded p-1 text-sm',
                selected
                  ? 'bg-white text-[var(--theme)]'
                  : 'bg-[var(--theme)]',
              ]"
            > -->
            <Icon :icon v-if="icon"></Icon>
            <!-- </div> -->
            <slot name="title-prefix"></slot>
            <div :class="[hasContent ? 'font-semibold' : '']">
              {{ title }}
            </div>
            <slot name="title-suffix"></slot>
          </div>
          <slot name="dropdown-prefix"></slot>
          <DefaultDropdownMenu
            v-if="menus?.length"
            trigger="click"
            placement="bottomRight"
            :menus
          >
            <div
              @click.stop
              :class="[
                'h hover:bg-light-5 items-center justify-center rounded p-0.5 opacity-0 duration-300 group-hover/g:opacity-100',
                selected ? 'hover:bg-(--theme-dark)!' : '',
              ]"
            >
              <MoreOutlined></MoreOutlined>
            </div>
          </DefaultDropdownMenu>
          <slot name="dropdown-suffix"></slot>
        </div>
        <div v-if="hasContent" :class="['text-sm']">
          <template v-if="!$slots.content">
            {{ content }}
          </template>
          <slot v-else name="content"></slot>
        </div>
      </div>
    </div>
    <FactorProgressBar v-if="isShowProgress" :progress :hue />
    <!-- :s="selected ? themeHSColorS : 0"
      :l="selected ? themeHSColorL : 60" -->
    <!-- :progress-color="selected ? 'bg-[var(--theme-dark)]' : 'bg-light-5'"
      :progress-bg-color="selected ? 'bg-[var(--theme-light)]' : 'bg-light-3'" -->
  </div>
</template>

<script setup lang="ts">
import type { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue";
import { defaultPrimaryHue, themeHSColorL, themeHSColorS } from "@/const";
import { useTheme } from "@/utils/color";
import { MoreOutlined } from "@ant-design/icons-vue";

const props = withDefaults(
  defineProps<{
    selected?: boolean;
    title?: string | null;
    icon?: string | null;
    content?: string | null;
    menus?: Menu[];
    // 0-100
    progress?: number;
    // hue theme color
    hue?: string;
    background?: number | string;
  }>(),
  {
    hue: defaultPrimaryHue,
    background: 2,
  },
);
["bg-light-1", "bg-light-2", "bg-light-3", "bg-light-4"];
const isShowProgress = computed(
  () => props.progress && props.progress > 0 && props.progress < 100,
);
const theme = useTheme(
  computed(() => props.hue),
  computed(() => ({
    a: 1,
    s: themeHSColorS,
    l: themeHSColorL,
  })),
);

const slots = useSlots();
const hasContent = computed(() => !!props.content || slots.content);
</script>
