<script lang="ts">
	interface Props {
		value?: number;
		label: string;
		placeholder?: string;
		onChange?: (value?: number) => void;
	}

	let { value, label, placeholder, onChange }: Props = $props();

	function oninput(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget.value;
		onChange?.(input ? Number(input) : undefined);
	}
</script>

<label class="settings-input">
	<span class="label">{label}</span>
	<input class="input" type="number" min="0" value={value || ''} {placeholder} {oninput} />
</label>

<style>
	.settings-input {
		display: block;
	}
	.label {
		display: block;
		font-size: 16px;
		opacity: 0.8;
		margin-bottom: 6px;
		text-align: center;
		white-space: nowrap;
	}
	.input {
		appearance: textfield;
		border: none;
		border-bottom: solid 1px white;
		border-radius: 0;
		background: none;
		outline: none;
		text-align: center;
		font: inherit;
		font-size: 24px;
		color: white;
		width: 100%;
		padding: 0 0 8px;
	}
	.input:focus-visible {
		border-bottom-color: #61dafb;
	}
	.input::-webkit-outer-spin-button,
	.input::-webkit-inner-spin-button {
		appearance: none;
		margin: 0;
	}
</style>
