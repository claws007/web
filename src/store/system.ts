// import { applyColorMode } from "@/utils/color"
import { dayjs } from "@/utils/time";
import { defineStore } from "pinia";

export const useSystemStore = defineStore("systemStore", () => {
  const now = ref(dayjs());
  const isDarkMode = ref(false);

  setInterval(() => {
    now.value = dayjs();
  }, 1300);

  return {
    now,
    isDarkMode,
    today: computed(() => now.value.startOf("day")),
  };
});
