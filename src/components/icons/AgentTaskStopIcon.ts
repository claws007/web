import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const AgentTaskStopIcon: FunctionalComponent = (props) =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      ...props,
    },
    [h("rect", { x: "7", y: "7", width: "10", height: "10", rx: "2" })],
  );
