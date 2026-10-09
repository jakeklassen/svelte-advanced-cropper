<script lang="ts">
	import {
		Cropper,
		ImageRestriction,
		Priority,
		type CropperInstance,
		type CropperState
	} from 'svelte-advanced-cropper';
	import { image } from '#site/paths.ts';

	type Strategy = 'nothing' | 'refresh' | 'refit';

	const src = image('orange-cat-on-table.jpg');

	let cropper: CropperInstance | undefined = $state();
	let strategy: Strategy = $state('refit');
	let widthPercent = $state(100);
	let containerWidth = $state(0);

	// The opening view: the whole photo, centred, whatever the boundary's shape.
	function fitWholeImage({ imageSize, boundary }: CropperState) {
		const boundaryRatio = boundary.width / boundary.height;
		if (imageSize.width / imageSize.height < boundaryRatio) {
			const width = imageSize.height * boundaryRatio;

			return { left: (imageSize.width - width) / 2, top: 0, width, height: imageSize.height };
		}

		const height = imageSize.width / boundaryRatio;

		return { left: 0, top: (imageSize.height - height) / 2, width: imageSize.width, height };
	}

	async function refit(target: CropperInstance) {
		// Measure the new boundary, then apply the opening view again. The crop is untouched.
		await target.refresh();
		const state = target.getState();
		if (state) {
			target.setVisibleArea(fitWholeImage(state), { transitions: false });
		}
	}

	// Runs whenever the container's width changes, for any reason.
	$effect(() => {
		void containerWidth;
		if (!cropper || strategy === 'nothing') {
			return;
		}

		if (strategy === 'refresh') {
			void cropper.refresh();
		} else {
			void refit(cropper);
		}
	});
</script>

<div class="refit-example" style:width="{widthPercent}%" bind:clientWidth={containerWidth}>
	<Cropper
		bind:this={cropper}
		class="refit-example__cropper"
		{src}
		imageRestriction={ImageRestriction.fitArea}
		defaultVisibleArea={fitWholeImage}
		priority={Priority.visibleArea}
	/>
</div>

<div class="refit-example__controls">
	<label class="refit-example__width">
		Container width
		<input type="range" min="40" max="100" bind:value={widthPercent} />
	</label>
	<fieldset class="refit-example__strategy">
		<legend>When the container resizes</legend>
		<label><input type="radio" value="nothing" bind:group={strategy} /> Do nothing</label>
		<label>
			<input type="radio" value="refresh" bind:group={strategy} />
			<code>refresh()</code>
		</label>
		<label>
			<input type="radio" value="refit" bind:group={strategy} />
			<code>refresh()</code> + <code>setVisibleArea()</code>
		</label>
	</fieldset>
</div>

<style>
	.refit-example {
		height: 320px;
		background: black;
		margin: 0 auto;
	}
	.refit-example :global(.refit-example__cropper) {
		height: 100%;
	}
	.refit-example__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		align-items: center;
		margin-top: 0.75rem;
		font-size: 0.9rem;
	}
	.refit-example__width {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.refit-example__strategy {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.refit-example__strategy legend {
		float: left;
		margin-right: 0.5rem;
		padding: 0;
	}
</style>
