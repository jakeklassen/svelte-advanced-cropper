<script lang="ts">
	import { untrack } from 'svelte';
	import { CircleStencil, Cropper, RectangleStencil } from 'svelte-advanced-cropper';
	import { Circle, Grid3x3, Square } from '@lucide/svelte';
	import SquareButton from '#site/demos/shared/SquareButton.svelte';
	import VerticalButtons from '#site/demos/shared/VerticalButtons.svelte';
	import { image } from '#site/paths.ts';

	interface Props {
		theme: 'bubble' | 'classic' | 'compact' | 'corners' | 'default';
		grid?: boolean;
	}

	let { theme, grid = true }: Props = $props();

	const images = {
		bubble: 'flowers-and-pier.jpg',
		classic: 'tree-in-lake.jpg',
		compact: 'mountain-lake.jpg',
		corners: 'snowy-mountains.jpg',
		default: 'sunlit-forest.jpg'
	};

	const src = $derived(image(images[theme]));

	let stencil = $state<'rectangle' | 'circle'>('rectangle');
	// The `grid` prop only sets the initial state; the button toggles it afterwards.
	let stencilGrid = $state(untrack(() => grid));
</script>

<div class={['theme-example', `theme-example--${theme}`]}>
	<Cropper class="theme-example__cropper" {src}>
		{#if stencil === 'circle'}
			<CircleStencil grid={stencilGrid} />
		{:else}
			<RectangleStencil grid={stencilGrid} />
		{/if}
	</Cropper>
	<VerticalButtons>
		<SquareButton title="Set Rectangle Stencil" onclick={() => (stencil = 'rectangle')}>
			<Square size={20} />
		</SquareButton>
		<SquareButton title="Set Circle Stencil" onclick={() => (stencil = 'circle')}>
			<Circle size={20} />
		</SquareButton>
		<SquareButton
			title={stencilGrid ? 'Disable Grid' : 'Enable Grid'}
			class={['theme-example__button', !stencilGrid && 'theme-example__button--inactive']}
			onclick={() => (stencilGrid = !stencilGrid)}
		>
			<Grid3x3 size={20} />
		</SquareButton>
	</VerticalButtons>
	<div class="theme-example__theme">Theme: {theme}</div>
</div>

<style lang="scss">
	.theme-example {
		position: relative;
		min-height: 200px;
		border: solid 1px var(--color-border);
		user-select: none;

		:global(.theme-example__cropper) {
			max-height: 500px;
		}

		:global(.theme-example__button) {
			transition: color 0.5s;
		}

		:global(.theme-example__button--inactive) {
			color: #888;
		}
	}

	// Each theme is compiled under its own wrapper class, so several themes can live on one
	// page. The default theme is already loaded globally by the site.
	.theme-example--compact :global {
		@import 'advanced-cropper/themes/compact.scss';
	}

	.theme-example--classic :global {
		@import 'advanced-cropper/themes/classic.scss';
	}

	.theme-example--bubble :global {
		@import 'advanced-cropper/themes/bubble.scss';
	}

	.theme-example--corners :global {
		@import 'advanced-cropper/themes/corners.scss';
	}

	.theme-example__theme {
		position: absolute;
		right: 10px;
		bottom: 10px;
		font-size: 10px;
		color: white;
		opacity: 0.5;
	}
</style>
