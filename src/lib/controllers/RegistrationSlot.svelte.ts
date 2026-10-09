/** A replacement owns its cleanup; an older cleanup cannot remove it. */
export class RegistrationSlot<T> {
	value: T | null = $state.raw(null);
	epoch = 0;
	private token: symbol | null = null;
	register = (value: T) => {
		const token = Symbol('registration');
		this.token = token;
		this.value = value;
		this.epoch++;

		return () => {
			if (this.token === token) {
				this.token = null;
				this.value = null;
				this.epoch++;
			}
		};
	};
}
