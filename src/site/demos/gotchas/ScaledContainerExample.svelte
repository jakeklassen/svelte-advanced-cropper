<script lang="ts">
	import { Cropper, type Size } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	const src = image('pexels-photo-1451124.jpeg');
	const height = 360;

	let scale = $state(0.75);
	let width = $state(0);
	let frame: HTMLDivElement | undefined = $state();
	let reading = $state('Drag the stencil to measure how closely it follows the pointer.');

	// Where the current drag started: the pointer and the stencil, in screen pixels.
	let start: { pointerX: number; pointerY: number; left: number; top: number } | null = null;

	// A small stencil on a wide photo, so it has room to follow a long drag before it
	// reaches an edge (where it stops, whatever the pointer does).
	function defaultSize({ imageSize }: { imageSize: Size }) {
		return { width: imageSize.width * 0.25, height: imageSize.height * 0.25 };
	}

	function stencilBox() {
		return frame?.querySelector('.advanced-cropper-stencil-wrapper')?.getBoundingClientRect();
	}

	function startMeasuring(event: PointerEvent) {
		const target = event.target instanceof Element ? event.target : null;
		const box = stencilBox();
		const onStencil =
			target &&
			frame?.contains(target) &&
			target.closest('.advanced-cropper-rectangle-stencil__draggable-area');
		if (!box || !onStencil) {
			return;
		}

		start = { pointerX: event.clientX, pointerY: event.clientY, left: box.left, top: box.top };
	}

	// Pointer events arrive before the mouse events that move the stencil, so measure on the
	// next frame, once the stencil has moved.
	function measure(event: PointerEvent) {
		if (start) {
			requestAnimationFrame(() => compare(event));
		}
	}

	function compare(event: PointerEvent) {
		const box = stencilBox();
		if (!start || !box) {
			return;
		}

		const pointer = Math.hypot(event.clientX - start.pointerX, event.clientY - start.pointerY);
		const stencil = Math.hypot(box.left - start.left, box.top - start.top);
		if (pointer >= 10) {
			reading = `Pointer moved ${Math.round(pointer)} px, stencil moved ${Math.round(stencil)} px (${Math.round((stencil / pointer) * 100)}%).`;
		}
	}
</script>

<svelte:window
	onpointerdown={startMeasuring}
	onpointermove={measure}
	onpointerup={() => (start = null)}
/>

<!-- The frame is laid out at full size and scaled down, like a preview pane. -->
<div class="scaled-container-example" bind:clientWidth={width} style:height="{height * scale}px">
	<div
		class="scaled-container-example__frame"
		bind:this={frame}
		style:width="{width / scale}px"
		style:height="{height}px"
		style:transform="scale({scale})"
	>
		<Cropper class="scaled-container-example__cropper" {src} {defaultSize} />
	</div>
</div>

<div class="scaled-container-example__controls">
	<span>Container scale</span>
	{#each [1, 0.75, 0.5] as option (option)}
		<label>
			<input type="radio" value={option} bind:group={scale} />
			{option * 100}%
		</label>
	{/each}
</div>

<p class="scaled-container-example__reading" aria-live="polite">{reading}</p>

<style>
	.scaled-container-example {
		overflow: hidden;
		background: black;
	}
	.scaled-container-example__frame {
		transform-origin: 0 0;
	}
	.scaled-container-example__frame :global(.scaled-container-example__cropper) {
		height: 100%;
	}
	.scaled-container-example__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin-top: 0.75rem;
		font-size: 0.9rem;
	}
	.scaled-container-example__reading {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
	}
</style>
