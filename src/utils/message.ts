import { dialogs } from "virtual:dialogs";

type _ConfirmOptions = Parameters<typeof dialogs.ConfirmDialog>[0];
type ConfirmOptions = Omit<
  _ConfirmOptions,
  keyof Pick<_ConfirmOptions, "content">
>;

export const msg = {
  info(message: string) {
    return dialogs.MessageDialog({ content: message, type: "info" });
  },
  success(message: string) {
    return dialogs.MessageDialog({ content: message, type: "success" });
  },
  error(message: string) {
    return dialogs.MessageDialog({ content: message, type: "error" });
  },
  confirm(message: string, options: ConfirmOptions = {}) {
    return dialogs.ConfirmDialog({ content: message, ...options });
  },
};
