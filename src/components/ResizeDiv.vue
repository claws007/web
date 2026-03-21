<template>
  <div
    ref="container"
    :class="['stretch size-full', isHorizontal ? 'h items-stretch' : 'v']"
  >
    <!-- <div
      v-if="debug"
      class="fixed bottom-0 left-0 z-10 bg-black p-2 text-white"
    >
      <div>
        {{ finalArray }}
      </div>
      <div>
        {{ offsets }}
      </div>
      <div>
        {{ finalOffsets }}
      </div>
    </div> -->
    <template v-for="(i, index) in finalArray" :key="i">
      <div
        :class="[
          isDragging ? 'pointer-events-none opacity-40 select-none' : '',
          'border-light-3 overflow-hidden',
          n > 1 ? (v ? 'border-b' : 'border-r') : '',
          index === 0 && n > 1 ? (v ? 'border-t' : 'borde-l') : '',
        ]"
        :style="{
          ...finalOffsets[i],
        }"
      >
        <slot :name="i.toString() as unknown"></slot>
      </div>
      <div v-if="!!finalArray.find((d) => d > i)" class="relative z-10">
        <div
          @mousedown="handleMouseDown(i)"
          :class="[
            'group/resize-div absolute top-0 left-0 cursor-move',
            isHorizontal
              ? 'h-full -translate-x-1/2 px-1.5'
              : 'w-full -translate-y-1/2 py-1.5',
          ]"
        >
          <div
            :class="[
              'bg-primary opacity-0 shadow duration-100 group-hover/resize-div:opacity-100',
              movingIndex === i ? 'opacity-100' : '',
              isHorizontal ? 'h-full w-1' : 'h-1 w-full',
            ]"
          ></div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts" generic="N extends number">
import { useLocalStorage } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    // debug?: boolean
    n: N;
    storageKey?: string;
    v?: boolean;
    stretch?: RangeNKey;
    initialOffsets?: {
      [k in RangeNKey]?: number;
    };
    disables?: {
      [k in RangeNKey]?: boolean;
    };
    threshold?: number;
  }>(),
  {
    threshold: 64,
  },
);
const finalArray = computed(() => {
  return [...new Array(props.n).keys()].filter(
    (d) => !props.disables?.[d as RangeNKey],
  );
});
const finalStretch = computed(() =>
  !props.disables?.[props.stretch!] && props.stretch
    ? props.stretch
    : finalArray.value?.[finalArray.value.length - 1],
);

const ranges = {
  1: [0],
  2: [0, 1],
  3: [0, 1, 2],
  4: [0, 1, 2, 3],
  5: [0, 1, 2, 3, 4],
} as const;
type Ranges = typeof ranges;
type RangeN = Ranges[N extends keyof Ranges ? N : never];
type RangeNKey = RangeN[number];

const containerRef = useTemplateRef("container");

type OffsetsType = { [k in RangeNKey]?: number };
const offsets = props.storageKey
  ? useLocalStorage<OffsetsType>(`resize-div-offsets-${props.storageKey}`, {})
  : ref<OffsetsType>({});

const getBaseOffsets = (index: number) => {
  const finalOffsets = Object.assign({}, props.initialOffsets, offsets.value);
  const ws = Object.keys(finalOffsets).map((k) => {
    return (finalOffsets || {})[k as keyof typeof finalOffsets];
  });
  if (ws[index] != null) {
    return ws[index];
  }
  const n = props.n - ws.filter((w) => !!w).length;
  const specifiedWidth = ws.reduce((t, d) => {
    return t + (d || 0);
  }, 0);
  return (calculateReferenceSize() - specifiedWidth) / (n || 1);
};
const baseOffsets = computed(() => {
  return finalArray.value.map((i) => {
    return getBaseOffsets(i);
  });
});
const finalOffsets = computed(() => {
  const stretchOne = finalStretch.value;
  const p = isHorizontal.value ? "width" : "height";
  const _finalOffsets = Object.assign({}, props.initialOffsets, offsets.value);
  return finalArray.value.reduce(
    (t, i) => {
      if (i === stretchOne) {
        t[i] = {
          flex: 1,
          minWidth: 0,
          minHeight: 0,
        };
        return t;
      }
      function applyLimit(value: number) {
        console.debug(i, movingIndex.value);
        if (
          movingIndex.value != null &&
          [movingIndex.value, movingIndex.value + 1].includes(i)
        ) {
          const min = props.threshold || 0;
          const max =
            getBaseOffsets(movingIndex.value) +
            getBaseOffsets(movingIndex.value + 1) -
            props.threshold;
          if (value < min) return min;
          if (value > max) return max;
          return value;
        } else {
          return value;
        }
      }
      let movingOffset = 0;
      if (i === props.n - 1 && movingIndex.value === props.n - 2) {
        movingOffset = -offset.value;
      } else {
        movingOffset =
          movingIndex.value === stretchOne
            ? 0
            : movingIndex.value === i
              ? offset.value
              : movingIndex.value === i - 1 && _finalOffsets[i]
                ? -offset.value
                : 0;
      }
      t[i] =
        offsets.value[i] != null
          ? { [p]: applyLimit(offsets.value[i] + movingOffset) + "px" }
          : (props.initialOffsets?.[i as RangeNKey] && {
              [p]:
                applyLimit(
                  parseFloat(props.initialOffsets[i as RangeNKey]!.toString()) +
                    movingOffset,
                ) + "px",
            }) ||
            (movingOffset === 0
              ? {
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                }
              : {
                  [p]: applyLimit(baseOffsets.value[i] + movingOffset) + "px",
                });
      return t;
    },
    {} as Record<number, Record<string, string | number | undefined>>,
  );
});

defineSlots<{
  [K in Ranges[N extends keyof Ranges ? N : never][number]]: any;
}>();

const isHorizontal = computed(() => props.v !== true);
function calculateReferenceSize() {
  return (
    (isHorizontal.value
      ? containerRef.value?.clientWidth
      : containerRef.value?.clientHeight) || 0
  );
}

const isDragging = ref(false);
let _isDown = false;
let offset = ref(0);
let movingIndex = ref<number>();
// onBeforeUnmount(() => stop())

function handleMouseDown(index: number) {
  // nextTick(() => {
  //   setTimeout(() => {
  //     isDragging.value = true
  //   })
  // })
  isDragging.value = true;
  _isDown = true;
  movingIndex.value = index;
  // store the initial offset
  for (const i in finalArray.value) {
    offsets.value[i] = getBaseOffsets(parseInt(i));
  }
}
function handleMouseMove(e: MouseEvent) {
  if (_isDown) {
    offset.value += isHorizontal.value ? e.movementX : e.movementY;
  }
}

function handleMouseUp() {
  // apply width
  if (_isDown) {
    if (movingIndex.value != null) {
      // 需要考虑下一个块
      const value_1 = (
        finalOffsets.value[movingIndex.value + 1] as Record<
          string,
          string | undefined
        >
      )[isHorizontal.value ? "width" : "height"];
      const value = (finalOffsets.value[movingIndex.value as RangeNKey] as any)[
        isHorizontal.value ? "width" : "height"
      ] as string | undefined;
      offsets.value[movingIndex.value + 1] = value_1
        ? parseFloat(value_1)
        : undefined;
      offsets.value[movingIndex.value as RangeNKey] = value
        ? parseFloat(value)
        : undefined;
      console.debug(value, value_1);
    }
    isDragging.value = false;
    _isDown = false;
    offset.value = 0;
    movingIndex.value = undefined;
  }
}
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});
</script>
