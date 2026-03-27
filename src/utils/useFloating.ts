import { onUnmounted, type Ref } from "vue";

export type FloatPlacement = "top" | "bottom" | "left" | "right";

const OFFSET = 8;
const VIEWPORT_PADDING = 8;

const TRANSFORM_ORIGINS: Record<FloatPlacement, string> = {
  top: "50% 100%",
  bottom: "50% 0%",
  left: "100% 50%",
  right: "0% 50%",
};

/**
 * Manages fixed-position floating elements anchored to a reference element.
 * Designed for use with <Teleport to="body"> patterns.
 *
 * Positions are written directly to el.style (synchronous) so they take
 * effect before the first paint — avoiding the "flashes at 0,0" problem
 * that occurs with reactive style bindings (async scheduler).
 *
 * Usage:
 *   const { mount, unmount } = useFloating(anchorRef, placementRef)
 *
 *   // In <Transition> hooks:
 *   @before-enter="el => mount(el as HTMLElement)"
 *   @before-appear="el => mount(el as HTMLElement)"
 *   @after-leave="unmount"
 */
export function useFloating(
  anchorRef: Ref<HTMLElement | null>,
  placement: Ref<FloatPlacement>,
  options?: {
    disableFlip?: Ref<boolean>;
  },
) {
  let floatingEl: HTMLElement | null = null;

  function clamp(value: number, min: number, max: number) {
    if (max < min) {
      return min;
    }

    return Math.min(Math.max(value, min), max);
  }

  function resolvePlacement(
    anchorRect: DOMRect,
    floatingWidth: number,
    floatingHeight: number,
  ) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const preferredPlacement = placement.value;

    if (options?.disableFlip?.value) {
      return preferredPlacement;
    }

    const availableTop = anchorRect.top - VIEWPORT_PADDING;
    const availableBottom =
      viewportHeight - anchorRect.bottom - VIEWPORT_PADDING;
    const availableLeft = anchorRect.left - VIEWPORT_PADDING;
    const availableRight = viewportWidth - anchorRect.right - VIEWPORT_PADDING;

    switch (preferredPlacement) {
      case "top":
        if (
          floatingHeight + OFFSET > availableTop &&
          availableBottom > availableTop
        ) {
          return "bottom";
        }
        break;
      case "bottom":
        if (
          floatingHeight + OFFSET > availableBottom &&
          availableTop > availableBottom
        ) {
          return "top";
        }
        break;
      case "left":
        if (
          floatingWidth + OFFSET > availableLeft &&
          availableRight > availableLeft
        ) {
          return "right";
        }
        break;
      case "right":
        if (
          floatingWidth + OFFSET > availableRight &&
          availableLeft > availableRight
        ) {
          return "left";
        }
        break;
    }

    return preferredPlacement;
  }

  function computePosition(el: HTMLElement) {
    const anchor = anchorRef.value;
    if (!anchor) return;

    const r = anchor.getBoundingClientRect();
    const fW = el.offsetWidth;
    const fH = el.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const resolvedPlacement = resolvePlacement(r, fW, fH);

    let left = 0;
    let top = 0;

    switch (resolvedPlacement) {
      case "top":
        left = r.left + r.width / 2 - fW / 2;
        top = r.top - fH - OFFSET;
        break;
      case "bottom":
        left = r.left + r.width / 2 - fW / 2;
        top = r.bottom + OFFSET;
        break;
      case "left":
        left = r.left - fW - OFFSET;
        top = r.top + r.height / 2 - fH / 2;
        break;
      case "right":
        left = r.right + OFFSET;
        top = r.top + r.height / 2 - fH / 2;
        break;
    }

    left = clamp(left, VIEWPORT_PADDING, viewportWidth - fW - VIEWPORT_PADDING);
    top = clamp(top, VIEWPORT_PADDING, viewportHeight - fH - VIEWPORT_PADDING);

    // Write directly to el.style — synchronous, happens before first paint.
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.transformOrigin = TRANSFORM_ORIGINS[resolvedPlacement];
  }

  function update() {
    if (floatingEl) computePosition(floatingEl);
  }

  /** Call in @before-enter / @before-appear — element is in DOM, opacity:0 from enter-from class */
  function mount(el: HTMLElement) {
    floatingEl = el;
    computePosition(el);
    window.addEventListener("scroll", update, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", update, { passive: true });
  }

  /** Call in @after-leave */
  function unmount() {
    floatingEl = null;
    window.removeEventListener("scroll", update, { capture: true });
    window.removeEventListener("resize", update);
  }

  onUnmounted(unmount);

  return { mount, unmount, update };
}
