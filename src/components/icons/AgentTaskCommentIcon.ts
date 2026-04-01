import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const AgentTaskCommentIcon: FunctionalComponent = (props) =>
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
    [
      h("path", { d: "M12 20h9" }),
      h("path", {
        d: "M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
      }),
    ],
  );
