import { type Component, createApp } from "vue";
import type {
	ComponentExposed,
	ComponentProps,
} from "vue-component-type-helpers";
import {
	type DialogController,
	dialogControllerKey,
	type DialogExposed,
	type DialogRejectedResult,
	type DialogResolvedResult,
	type DialogSettledResult,
} from "@/components/Dialog.vue";

type InternalDialogKeys =
	| "key"
	| "ref"
	| "ref_for"
	| "ref_key"
	| "class"
	| "style"
	| `on${string}`;

export type MountedDialogProps<T extends Component> = Omit<
	ComponentProps<T>,
	InternalDialogKeys
>;

export type MountedDialogValue<T extends Component> =
	ComponentExposed<T> extends DialogExposed<infer TResult> ? TResult : void;

export type MountedDialogResult<T extends Component> = DialogSettledResult<
	MountedDialogValue<T>
>;

export type MountedDialogResolveResult<T extends Component> =
	DialogResolvedResult<
		MountedDialogValue<T>
	>;

export type MountedDialogRejectResult = DialogRejectedResult;

export type MountedDialogResolvedValue<T extends Component> =
	MountedDialogValue<T>;

export type MountedDialogRejectedReason = DialogRejectedResult["reason"];

export type MountedDialogHandle<T extends Component> =
	& Promise<
		MountedDialogResult<T>
	>
	& {
		resolve(
			callback?: (value: MountedDialogValue<T> | undefined) => void,
		): MountedDialogHandle<T>;
		reject(
			callback: (reason: MountedDialogRejectedReason) => void,
		): MountedDialogHandle<T>;
	};

type MountDialogFunction = {
	<T extends Component>(
		component: T,
		props: MountedDialogProps<T>,
	): MountedDialogHandle<T>;
};

/**
 * Programmatically mount a Vue component into a temporary DOM node.
 * The mounted dialog receives typed `resolve` / `reject` callbacks
 * through Dialog.vue's injected context.
 */
const mountDialogBase = <T extends Component>(
	component: T,
	props: MountedDialogProps<T>,
): MountedDialogHandle<T> => {
	const result = new Promise<MountedDialogResult<T>>((resolve) => {
		const host = document.createElement("div");
		document.body.appendChild(host);
		let settled = false;

		function cleanup() {
			app.unmount();
			host.remove();
		}

		function finish(callback: () => void) {
			if (settled) {
				return;
			}

			settled = true;
			callback();
			cleanup();
		}

		function handleResolve(...args: [] | [MountedDialogValue<T>]) {
			finish(() => {
				if (args.length === 0) {
					resolve({ type: "resolve" } as MountedDialogResult<T>);
					return;
				}

				resolve({
					type: "resolve",
					value: args[0],
				} as MountedDialogResult<T>);
			});
		}

		const controller: DialogController<MountedDialogValue<T>> = {
			resolve: handleResolve as DialogController<
				MountedDialogValue<T>
			>["resolve"],
			reject: (reason?: unknown) => {
				finish(() => resolve({ type: "reject", reason }));
			},
		};

		const app = createApp(component, props as Record<string, unknown>);
		app.provide(
			dialogControllerKey,
			controller as DialogController<unknown>,
		);
		app.mount(host);
	});

	return Object.assign(result, {
		resolve(callback?: (value: MountedDialogValue<T> | undefined) => void) {
			result.then((value) => {
				if (value.type === "resolve") {
					callback?.("value" in value ? value.value : undefined);
				}
			});
			return this as unknown as MountedDialogHandle<T>;
		},
		reject(callback: (reason: MountedDialogRejectedReason) => void) {
			result.then((value) => {
				if (value.type === "reject") {
					callback(value.reason);
				}
			});
			return this as unknown as MountedDialogHandle<T>;
		},
	}) as MountedDialogHandle<T>;
};

export const mountDialog = mountDialogBase as MountDialogFunction;
