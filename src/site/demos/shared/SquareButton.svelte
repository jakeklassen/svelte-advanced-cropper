<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { children, class: className, ...props }: HTMLButtonAttributes = $props();
</script>

<button type="button" class={['square-button', className]} {...props}>
	{@render children?.()}
</button>

<style>
	.square-button {
		appearance: none;
		border: none;
		outline: none;
		color: white;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		height: 42px;
		width: 42px;
		margin-bottom: 10px;
		padding: 0;
		cursor: pointer;
		transition: background 0.5s;
	}
	.square-button:hover {
		background: black;
	}
</style>
