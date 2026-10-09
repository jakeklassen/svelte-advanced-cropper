import { mountCropper } from './fixtures';

/** Compile-only assertions for the shared mounting helper. */
export function verifyMountOptions() {
	void mountCropper({ minWidth: 100, circle: true, width: 500 });
	// @ts-expect-error Built-in numeric settings reject strings.
	void mountCropper({ minWidth: 'invalid' });
	// @ts-expect-error Unknown props cannot bypass the harness contract.
	void mountCropper({ unknownOption: true });
	// @ts-expect-error Stencil configuration belongs on children.
	void mountCropper({ stencilProps: { aspectRatio: 1 } });
	// @ts-expect-error Instance access uses bindings and callbacks.
	void mountCropper({ getInstance: () => null });
}
