import {
	AbstractCropperInstance,
	getEmptyInteractions,
	type AbstractCropperInstanceData,
	type AbstractCropperInstanceProps,
	type AbstractCropperInstanceSettings
} from 'advanced-cropper';

export interface CropperInstanceProps<Settings extends AbstractCropperInstanceSettings, Instance> {
	getProps: () => AbstractCropperInstanceProps<Settings, Instance>;
	setData?: (data: AbstractCropperInstanceData) => void;
}

/**
 * Binds the framework-agnostic core instance to Svelte reactivity.
 *
 * Upstream stores the data in a plain field and forces a React re-render on every
 * change. Here the data is `$state.raw`: the core always replaces it with a new
 * object, and every getter (`getState`, `getTransitions`, `getInteractions`, ...)
 * reads it, so templates that call them re-render on their own.
 */
export class CropperInstance<
	Settings extends AbstractCropperInstanceSettings,
	Instance = unknown
> extends AbstractCropperInstance<Settings, Instance> {
	data: AbstractCropperInstanceData = $state.raw({
		state: null,
		transitions: false,
		interactions: getEmptyInteractions()
	});
	notify: () => void;
	props: () => AbstractCropperInstanceProps<Settings, Instance>;

	/**
	 * `onChange` is upstream's force-rerender hook. It is optional here: reactivity
	 * comes from `data` itself, so pass it only to observe changes.
	 */
	constructor(
		props: () => AbstractCropperInstanceProps<Settings, Instance>,
		onChange: () => void = () => {}
	) {
		super();
		this.props = props;
		this.notify = onChange;
	}

	protected getProps() {
		return this.props();
	}

	protected setData(data: AbstractCropperInstanceData) {
		this.data = data;
		this.notify();
	}

	protected getData(): AbstractCropperInstanceData {
		return this.data;
	}
}
