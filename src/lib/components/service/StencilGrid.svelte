<script lang="ts" module>
	import type { ClassValue } from 'svelte/elements';

	export interface StencilGridProps {
		visible?: boolean;
		columns?: number;
		rows?: number;
		class?: ClassValue;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	let { columns = 3, rows = 3, visible = false, class: className }: StencilGridProps = $props();

	// The grid keeps its size while hidden, so that it does not jump between 3x3 and
	// 9x9 while fading out.
	let currentColumns = $state(untrack(() => columns));
	let currentRows = $state(untrack(() => rows));

	$effect(() => {
		if (visible) {
			currentRows = rows;
			currentColumns = columns;
		}
	});
</script>

<div
	class={[
		'advanced-cropper-stencil-grid',
		visible && 'advanced-cropper-stencil-grid--visible',
		className
	]}
>
	{#each { length: currentRows }, i (i)}
		<div class="advanced-cropper-stencil-grid__row">
			{#each { length: currentColumns }, j (j)}
				<div
					class={[
						'advanced-cropper-stencil-grid__cell',
						i === 0 && 'advanced-cropper-stencil-grid__cell--top',
						i === currentRows - 1 && 'advanced-cropper-stencil-grid__cell--bottom',
						j === 0 && 'advanced-cropper-stencil-grid__cell--left',
						j === currentColumns - 1 && 'advanced-cropper-stencil-grid__cell--right'
					]}
				></div>
			{/each}
		</div>
	{/each}
</div>
