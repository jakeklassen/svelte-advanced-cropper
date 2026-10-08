<!-- How the image, the visible area and the coordinates relate, in image pixels. -->
<figure class="state-geometry">
	<svg viewBox="0 0 420 270" role="img" aria-labelledby="state-geometry-title">
		<title id="state-geometry-title">
			The visible area and the coordinates are both rectangles in image pixels
		</title>
		<!-- The image -->
		<rect class="state-geometry__image" x="10" y="30" width="400" height="230" />
		<text class="state-geometry__label" x="18" y="22">image (imageSize)</text>
		<!-- The visible area: what the boundary shows -->
		<rect class="state-geometry__area" x="70" y="60" width="290" height="180" />
		<text class="state-geometry__label state-geometry__label--area" x="78" y="78">
			visibleArea (shown in the boundary)
		</text>
		<!-- The coordinates: the crop -->
		<rect class="state-geometry__coordinates" x="150" y="105" width="130" height="100" />
		<text class="state-geometry__label state-geometry__label--coordinates" x="215" y="160">
			coordinates
		</text>
	</svg>
</figure>

<style>
	.state-geometry {
		max-width: 480px;
		margin: 1.5rem auto;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.state-geometry__image {
		fill: #e9edf1;
		stroke: var(--color-muted);
		stroke-width: 1;
	}
	.state-geometry__area {
		fill: none;
		stroke: var(--color-text);
		stroke-width: 2;
		stroke-dasharray: 6 4;
	}
	.state-geometry__coordinates {
		fill: rgba(26, 167, 249, 0.18);
		stroke: var(--color-primary);
		stroke-width: 2;
	}
	.state-geometry__label {
		font-family: var(--font-mono);
		font-size: 13px;
		fill: var(--color-muted);
	}
	.state-geometry__label--area {
		fill: var(--color-text);
	}
	.state-geometry__label--coordinates {
		fill: var(--color-primary-dark);
		text-anchor: middle;
	}
</style>
