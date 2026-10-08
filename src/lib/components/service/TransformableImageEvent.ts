/**
 * Passed to `TransformableImage`'s `onEvent`. Call `preventDefault()` to stop the
 * image from handling the native event.
 */
export class TransformableImageEvent {
	active: boolean;
	defaultPrevented = false;

	constructor({ active }: { active: boolean }) {
		this.active = active;
	}

	preventDefault() {
		this.defaultPrevented = true;
	}
}
