<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		active?: boolean;
	}

	let { class: cssClass, active, children, ...props }: Props = $props();
</script>

<button
	type="button"
	class={['image-editor-button', active && 'image-editor-button--active', cssClass]}
	{...props}
>
	{@render children?.()}
</button>

<style>
	.image-editor-button {
		width: 46px;
		height: 46px;
		padding: 0;
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 50%;
		outline: none;
		background: transparent;
		color: #88888b;
		cursor: pointer;
		transition: 0.5s;
	}
	.image-editor-button--active {
		background: rgba(255, 255, 255, 0.03);
		color: #61dafb;
	}
	.image-editor-button:hover,
	.image-editor-button:focus-visible {
		background: rgba(255, 255, 255, 0.03);
	}
	@media (max-width: 540px) {
		.image-editor-button {
			width: 32px;
			height: 32px;
		}
	}
</style>
