import { onMounted, onUnmounted, type Ref, ref } from "vue";
import type { SnapEdge } from "../types";

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

export function useDraggableSnapOverlay(
  elementRef: Ref<HTMLElement | null>,
  state: DraggableSnapState,
  options: DraggableSnapOptions = {},
) {
  const edgeGap = options.edgeGap ?? 12;
  const isDragging = ref(false);

  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let prevBodyUserSelect = "";
  let prevBodyCursor = "";

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
    event.preventDefault();
    state.pos = {
      x: event.clientX - dragOffsetX,
      y: event.clientY - dragOffsetY,
    };
  };

  const endDrag = () => {
    const body = document.body;

    isDragging.value = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);

    body.style.userSelect = prevBodyUserSelect;
    body.style.cursor = prevBodyCursor;

    snapToNearestEdge();
  };

  const startDrag = (event: MouseEvent) => {
    if (event.button !== 0) return;

    const body = document.body;

    event.preventDefault();
    window.getSelection()?.removeAllRanges();

    isDragging.value = true;
    dragOffsetX = event.clientX - state.pos.x;
    dragOffsetY = event.clientY - state.pos.y;

    prevBodyUserSelect = body.style.userSelect;
    prevBodyCursor = body.style.cursor;
    body.style.userSelect = "none";
    body.style.cursor = "grabbing";

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
