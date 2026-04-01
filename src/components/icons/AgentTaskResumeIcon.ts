import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const AgentTaskResumeIcon: FunctionalComponent = (props) =>
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
    [h("path", { d: "M8 6.5v11l9-5.5-9-5.5z" })],
  );
