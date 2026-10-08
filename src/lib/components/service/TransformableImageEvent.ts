/**
 * Passed to `TransformableImage`'s `onEvent`. Call `preventDefault()` to stop the
 * image from handling the native event.
 */
export class TransformableImageEvent {
	constructor({ active }: { active: boolean }) {
		this.active = active;
		this.defaultPrevented = false;
	}
	preventDefault() {
		this.defaultPrevented = true;
	}
	defaultPrevented: boolean;
	active: boolean;
}
