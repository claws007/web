import type { Component } from "vue";
import {
	mountDialog,
	type MountedDialogHandle,
	type MountedDialogProps,
	type MountedDialogRejectedReason,
	type MountedDialogRejectResult,
	type MountedDialogResolvedValue,
	type MountedDialogResolveResult,
	type MountedDialogResult,
	type MountedDialogValue,
} from "./mount";
import ConfirmDialog from "./ConfirmDialog.vue";
import MessageDialog from "./MessageDialog.vue";

export type DialogProps<T extends Component> = MountedDialogProps<T>;

export type DialogValue<T extends Component> = MountedDialogValue<T>;

export type DialogResult<T extends Component> = MountedDialogResult<T>;

export type DialogResolveResult<T extends Component> =
	MountedDialogResolveResult<T>;

export type DialogRejectResult = MountedDialogRejectResult;

export type DialogResolvedValue<T extends Component> =
	MountedDialogResolvedValue<T>;

export type DialogRejectedReason = MountedDialogRejectedReason;

export type DialogHandle<T extends Component> = MountedDialogHandle<T>;

type OpenDialogFunction = {
	<T extends Component>(
		component: T,
		props: DialogProps<T>,
	): DialogHandle<T>;
};

const openDialogBase = <T extends Component>(
	component: T,
	props: DialogProps<T>,
): DialogHandle<T> => {
	return mountDialog(component, props);
};

export const openDialog = openDialogBase as OpenDialogFunction;

export { ConfirmDialog, MessageDialog };
