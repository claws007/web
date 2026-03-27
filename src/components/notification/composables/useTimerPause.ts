import type { ComputedRef, UnwrapRef } from "vue";

export interface UseTimerPauseOptions {
  // Function to pause timers
  onPause: (ids: string[]) => void;
  // Function to resume timers
  onResume: (ids: string[]) => void;
  // IDs to manage - can be a ref, computed, or raw value
  ids: string[] | ComputedRef<string[]>;
}

/**
 * Composable for managing timer pause/resume on mouse enter/leave events
 * Provides unified logic for both toast notifications and progress widgets
 */
export function useTimerPause({
  onPause,
  onResume,
  ids,
}: UseTimerPauseOptions) {
  const getIds = () => {
    if (Array.isArray(ids)) return ids;
    return ids.value;
  };

  const handleMouseEnter = () => {
    const targetIds = getIds();
    if (targetIds.length > 0) {
      onPause(targetIds);
    }
  };

  const handleMouseLeave = () => {
    const targetIds = getIds();
    if (targetIds.length > 0) {
      onResume(targetIds);
    }
  };

  return {
    handleMouseEnter,
    handleMouseLeave,
  };
}
