<script lang="ts" module>
	import type { ClassValue } from 'svelte/elements';

	export interface StencilGridProps {
		visible?: boolean;
		columns?: number;
		rows?: number;
		class?: ClassValue;
		style?: string;
	}
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';

	let {
		columns = 3,
		rows = 3,
		visible = false,
		class: cssClass,
		style
	}: StencilGridProps = $props();
</script>

{#if visible}
	<div
		transition:fade={{ duration: 300 }}
		{style}
		class={['advanced-cropper-stencil-grid', 'advanced-cropper-stencil-grid--visible', cssClass]}
	>
		{#each { length: rows }, i (i)}
			<div class="advanced-cropper-stencil-grid__row">
				{#each { length: columns }, j (j)}
					<div
						class={[
							'advanced-cropper-stencil-grid__cell',
							i === 0 && 'advanced-cropper-stencil-grid__cell--top',
							i === rows - 1 && 'advanced-cropper-stencil-grid__cell--bottom',
							j === 0 && 'advanced-cropper-stencil-grid__cell--left',
							j === columns - 1 && 'advanced-cropper-stencil-grid__cell--right'
						]}
					></div>
				{/each}
			</div>
		{/each}
	</div>
{/if}
