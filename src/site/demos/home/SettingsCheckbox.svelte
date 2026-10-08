<script lang="ts">
	import { Check } from '@lucide/svelte';

	interface Props {
		value?: boolean;
		label: string;
		onChange?: (value: boolean) => void;
	}

	let { value = false, label, onChange }: Props = $props();
</script>

<label class="settings-checkbox">
	<input
		class="input"
		type="checkbox"
		checked={value}
		onchange={(event) => onChange?.(event.currentTarget.checked)}
	/>
	<span class={['box', value && 'box--checked']}>
		<Check size={12} strokeWidth={3} class={['check', !value && 'check--hidden']} />
	</span>
	<span class="label">{label}</span>
</label>

<style>
	.settings-checkbox {
		display: flex;
		cursor: pointer;
		align-items: center;
		flex-shrink: 0;
		position: relative;
	}
	.label {
		font-size: 16px;
		opacity: 0.8;
		white-space: nowrap;
	}
	/* Visually hidden, but still focusable and announced. */
	.input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: 0;
	}
	.box {
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: solid 1px white;
		border-radius: 2px;
		margin-right: 12px;
		color: transparent;
		transition: 0.5s;
	}
	.box--checked {
		color: #61dafb;
	}
	.input:focus-visible + .box {
		outline: 2px solid #61dafb;
		outline-offset: 2px;
	}
	.box :global(.check) {
		transition: opacity 0.5s;
	}
	.box :global(.check--hidden) {
		opacity: 0;
	}
</style>
