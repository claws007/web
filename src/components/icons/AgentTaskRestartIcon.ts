import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const AgentTaskRestartIcon: FunctionalComponent = (props) =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      ...props,
    },
    [h("path", { d: "M3 12a9 9 0 1 0 3-6.708" }), h("path", { d: "M3 4v5h5" })],
  );
