<script lang="ts" module>
	export const pendingDraws: (() => void)[] = [];
</script>

<script lang="ts">
	import type { CropperBackgroundSnippetProps } from '#lib';

	let { cropper, attachSource, class: cssClass, style }: CropperBackgroundSnippetProps = $props();
	const image = $derived(cropper.getImage());
	// Each attachment has a promise for this image's first complete canvas draw.
	function draw(canvas: HTMLCanvasElement) {
		let finish: (() => void) | undefined;

		const ready = new Promise<void>((resolve) => {
			finish = resolve;
		});
		const cleanup = attachSource(ready)(canvas);
		const context = canvas.getContext('2d');
		pendingDraws.push(() => {
			if (context) {
				context.fillStyle = '#12ab34';
				context.fillRect(0, 0, canvas.width, canvas.height);
			}

			finish?.();
		});

		return cleanup;
	}
</script>

<canvas class={cssClass} {style} width={image?.width} height={image?.height} {@attach draw}
></canvas>
