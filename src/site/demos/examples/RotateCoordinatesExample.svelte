<script lang="ts">
	import { rotateSize, type Size } from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	interface Example {
		image: Size;
		stencil: Size;
		rotate: number;
	}

	const src = image('pexels-roman-iskanderov-624959616-17587410.jpg');

	const examples: Example[] = [
		{ image: { width: 194, height: 353 }, stencil: { width: 150, height: 200 }, rotate: 0 },
		{ image: { width: 194, height: 353 }, stencil: { width: 150, height: 200 }, rotate: 45 }
	];

	// The dashed frame is the bounding box of the rotated image; the coordinates are
	// measured from its top-left corner.
	const diagrams = examples.map((example) => {
		const rotatedSize = rotateSize(example.image, example.rotate);
		return {
			...example,
			coefficient: rotatedSize.height / example.image.height,
			aspectRatio: rotatedSize.width / rotatedSize.height
		};
	});
</script>

<div class="rotate-coordinates-example">
	{#each diagrams as diagram (diagram.rotate)}
		<div class="rotate-coordinates-example__example" style:width="{100 / diagrams.length}%">
			<div
				class="rotate-coordinates-example__image-wrapper"
				style:width="{diagram.aspectRatio * 100}%"
			>
				<img
					class="rotate-coordinates-example__image"
					style:transform="translate(-50%, -50%) scale({1 / diagram.coefficient}) rotate({diagram.rotate}deg)"
					{src}
					alt="Image rotated by {diagram.rotate} degrees"
				/>
				<div
					class="rotate-coordinates-example__stencil"
					style:width="{diagram.stencil.width / 2}px"
					style:height="{diagram.stencil.height / 2}px"
				></div>
				<div
					class="rotate-coordinates-example__left"
					style:left="0px"
					style:top="calc(50% - {diagram.stencil.height / 4}px)"
					style:width="calc(50% - {diagram.stencil.width / 4}px)"
				></div>
				<div
					class="rotate-coordinates-example__top"
					style:top="0px"
					style:left="calc(50% - {diagram.stencil.width / 4}px)"
					style:height="calc(50% - {diagram.stencil.height / 4}px)"
				></div>
			</div>
		</div>
	{/each}
</div>

<style>
	.rotate-coordinates-example {
		display: flex;
		border: solid 1px #eee;
		background: white;
		border-radius: 8px;
	}
	.rotate-coordinates-example__example {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		box-sizing: border-box;
	}
	.rotate-coordinates-example__image {
		height: 100%;
		max-width: none;
		position: absolute;
		left: 50%;
		top: 50%;
	}
	.rotate-coordinates-example__image-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding-top: 100%;
		position: relative;
		height: 100%;
		border: dashed 1px var(--color-primary);
	}
	.rotate-coordinates-example__stencil {
		border: solid 2px var(--color-primary);
		z-index: 1;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.rotate-coordinates-example__left,
	.rotate-coordinates-example__top {
		border: solid 1px rgba(0, 0, 0, 0.1);
		position: absolute;
		z-index: 1;
	}
</style>
