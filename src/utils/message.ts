import { ConfirmDialog, MessageDialog, openDialog } from "../components/dialog";

type ConfirmOptions = {
	title?: string;
	confirmText?: string;
	cancelText?: string;
	confirmType?: "primary" | "danger";
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void;
};

export const msg = {
	info(message: string) {
		return openDialog(MessageDialog, { content: message, type: "info" });
	},
	success(message: string) {
		return openDialog(MessageDialog, { content: message, type: "success" });
	},
	error(message: string) {
		return openDialog(MessageDialog, { content: message, type: "error" });
	},
	confirm(message: string, options: ConfirmOptions = {}) {
		return openDialog(ConfirmDialog, { content: message, ...options });
	},
};
