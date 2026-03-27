import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import type { SnapEdge } from "../types";

export interface CornerPosition {
  vertical: "top" | "bottom";
  horizontal: "left" | "right";
}

interface DraggableSnapState {
  pos: { x: number; y: number };
  snapEdge: SnapEdge;
}

interface DraggableSnapOptions {
  edgeGap?: number;
}

function useOverlayViewportObserver(
  elementRef: Ref<HTMLElement | null>,
  onLayout: () => void,
) {
  let resizeObserver: ResizeObserver | null = null;

  const requestLayout = () => {
    requestAnimationFrame(onLayout);
  };

  onMounted(() => {
    requestLayout();

    resizeObserver = new ResizeObserver(() => {
      requestLayout();
    });

    if (elementRef.value) {
      resizeObserver.observe(elementRef.value);
    }

    window.addEventListener("resize", requestLayout);
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    window.removeEventListener("resize", requestLayout);
  });

  return { requestLayout };
}

export function useFloatingCornerPosition(
  elementRef: Ref<HTMLElement | null>,
  positionState: Ref<CornerPosition>,
) {
  const positionClasses = computed(() => ({
    [positionState.value.vertical]: true,
    [positionState.value.horizontal]: true,
  }));

  const updatePosition = () => {
    if (!elementRef.value) return;

    const rect = elementRef.value.getBoundingClientRect();
    const padding = 1.25 * 16;
    const bottomOverflow = rect.bottom > window.innerHeight - padding;
    const topOverflow = rect.top < padding;
    const rightOverflow = rect.right > window.innerWidth - padding;
    const leftOverflow = rect.left < padding;

    if (
      positionState.value.vertical === "bottom" &&
      bottomOverflow &&
      !topOverflow
    ) {
      positionState.value.vertical = "top";
    } else if (
      positionState.value.vertical === "top" &&
      topOverflow &&
      !bottomOverflow
    ) {
      positionState.value.vertical = "bottom";
    }

    if (
      positionState.value.horizontal === "right" &&
      rightOverflow &&
      !leftOverflow
    ) {
      positionState.value.horizontal = "left";
    } else if (
      positionState.value.horizontal === "left" &&
      leftOverflow &&
      !rightOverflow
    ) {
      positionState.value.horizontal = "right";
    }
  };

  useOverlayViewportObserver(elementRef, updatePosition);

  return {
    positionClasses,
    updatePosition,
  };
}

export function useDraggableSnapOverlay(
  elementRef: Ref<HTMLElement | null>,
  state: DraggableSnapState,
  options: DraggableSnapOptions = {},
) {
  const edgeGap = options.edgeGap ?? 12;
  const isDragging = ref(false);

  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const getBounds = (width: number, height: number) => ({
    minX: edgeGap,
    maxX: Math.max(edgeGap, window.innerWidth - width - edgeGap),
    minY: edgeGap,
    maxY: Math.max(edgeGap, window.innerHeight - height - edgeGap),
  });

  const snapToNearestEdge = () => {
    const element = elementRef.value;
    if (!element) return;

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const { x, y } = state.pos;
    const { minX, maxX, minY, maxY } = getBounds(width, height);

    const candidates: Array<{
      edge: SnapEdge;
      dist: number;
      nextX: number;
      nextY: number;
    }> = [
      {
        edge: "right",
        dist: Math.abs(x + width - (window.innerWidth - edgeGap)),
        nextX: maxX,
        nextY: y,
      },
      {
        edge: "left",
        dist: Math.abs(x - edgeGap),
        nextX: minX,
        nextY: y,
      },
      {
        edge: "bottom",
        dist: Math.abs(y + height - (window.innerHeight - edgeGap)),
        nextX: x,
        nextY: maxY,
      },
      {
        edge: "top",
        dist: Math.abs(y - edgeGap),
        nextX: x,
        nextY: minY,
      },
    ];

    const best = candidates.reduce((current, candidate) =>
      current.dist < candidate.dist ? current : candidate,
    );

    state.snapEdge = best.edge;
    state.pos = {
      x: clamp(best.nextX, minX, maxX),
      y: clamp(best.nextY, minY, maxY),
    };
  };

  const pushToSnapEdge = () => {
    const element = elementRef.value;
    if (!element) return;

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const { x, y } = state.pos;
    const { minX, maxX, minY, maxY } = getBounds(width, height);

    switch (state.snapEdge) {
      case "right":
        state.pos = { x: maxX, y: clamp(y, minY, maxY) };
        break;
      case "left":
        state.pos = { x: minX, y: clamp(y, minY, maxY) };
        break;
      case "top":
        state.pos = { x: clamp(x, minX, maxX), y: minY };
        break;
      case "bottom":
        state.pos = { x: clamp(x, minX, maxX), y: maxY };
        break;
    }
  };

  const onDrag = (event: MouseEvent) => {
    state.pos = {
      x: event.clientX - dragOffsetX,
      y: event.clientY - dragOffsetY,
    };
  };

  const endDrag = () => {
    isDragging.value = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
    snapToNearestEdge();
  };

  const startDrag = (event: MouseEvent) => {
    if (event.button !== 0) return;

    event.preventDefault();
    isDragging.value = true;
    dragOffsetX = event.clientX - state.pos.x;
    dragOffsetY = event.clientY - state.pos.y;

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag, { once: true });
  };

  onMounted(() => {
    const element = elementRef.value;
    if (!element) return;

    state.pos = {
      x: Math.max(edgeGap, window.innerWidth - element.offsetWidth - edgeGap),
      y: Math.max(edgeGap, window.innerHeight - element.offsetHeight - edgeGap),
    };
    state.snapEdge = "right";
  });

  useOverlayViewportObserver(elementRef, () => {
    if (!isDragging.value) {
      snapToNearestEdge();
    }
  });

  onUnmounted(() => {
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
  });

  return {
    isDragging,
    startDrag,
    snapToNearestEdge,
    pushToSnapEdge,
  };
}
