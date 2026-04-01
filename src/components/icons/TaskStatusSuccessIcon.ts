import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const TaskStatusSuccessIcon: FunctionalComponent = (props) =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2.6",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      ...props,
    },
    [h("polyline", { points: "20 6 9 17 4 12" })],
  );
