import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const TaskStatusDefaultIcon: FunctionalComponent = (props) =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      ...props,
    },
    [h("circle", { cx: "12", cy: "12", r: "10" })],
  );
