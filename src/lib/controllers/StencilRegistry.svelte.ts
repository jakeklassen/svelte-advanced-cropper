import type { StencilOptions } from '../types';

export class StencilRegistry {
	// Membership is published through revision after each token-owned mutation.
	// Keep storage untracked so reads observe the committed selection, not intermediate entries.
	private entries = new Map<symbol, () => StencilOptions>();
	private revision = $state(0);
	epoch = 0;
	private selected: (() => StencilOptions) | undefined;
	register = (getOptions: () => StencilOptions) => {
		const token = Symbol('stencil');
		this.entries.set(token, getOptions);
		this.epoch++;
		this.revision = this.epoch;

		return () => {
			if (this.entries.delete(token)) {
				this.epoch++;
				this.revision = this.epoch;
			}
		};
	};
	commit = () => {
		void this.revision;
		if (this.entries.size > 1) {
			throw new Error('A cropper may contain at most one registered stencil.');
		}

		this.selected = this.entries.values().next().value;
	};
	readOptions(): StencilOptions {
		void this.revision;

		return this.selected?.() ?? {};
	}
}
