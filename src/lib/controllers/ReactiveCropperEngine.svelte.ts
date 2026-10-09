import {
	AbstractCropperInstance,
	getEmptyInteractions,
	type AbstractCropperInstanceData,
	type AbstractCropperInstanceProps,
	type AbstractCropperInstanceSettings
} from 'advanced-cropper';

export class ReactiveCropperEngine<
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

	constructor(
		props: () => AbstractCropperInstanceProps<Settings, Instance>,
		onChange: () => void = () => {}
	) {
		super();
		this.props = props;
		this.notify = onChange;
	}

	dispose() {
		this.endTransitions.clear();
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
