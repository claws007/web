// import { applyColorMode } from "@/utils/color"
import { dayjs } from "@/utils/time";
import { defineStore } from "pinia";

export const useSystemStore = defineStore("systemStore", () => {
  const now = ref(dayjs());
  setInterval(() => {
    now.value = dayjs();
  }, 1300);

  return {
    now,
    today: computed(() => now.value.startOf("day")),
  };
});
