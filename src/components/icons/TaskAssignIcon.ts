import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const TaskAssignIcon: FunctionalComponent = (props) =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      ...props,
    },
    [h("polygon", { points: "7 4 20 12 7 20 7 4" })],
  );
