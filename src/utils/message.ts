import { dialogs } from "@/components/dialog";

export const msg = {
	_msg(
		message: string,
	) {
		return dialogs.MessageDialog({
			content: message,
		});
	},
	info(
		message: string,
	) {
		return this._msg(message);
	},
	success(message: string) {
		return this._msg(message);
	},
	error(message: string) {
		return this._msg(message);
	},
};
