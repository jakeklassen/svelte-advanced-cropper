<!--
	Illustrations for the Custom Stencil tutorial: the stencil's parts, how it grows,
	and how a handler shift becomes resize directions.
-->
<script lang="ts">
	interface Props {
		variant: 'idea' | 'resize' | 'directions';
	}

	let { variant }: Props = $props();

	const id = $props.id();
	const arrow = `arrow-${id}`;

	// The circle stencil, centred in a 320×200 picture.
	const cx = 160;
	const cy = 100;
	const r = 62;
	// The handler sits on the circle at 45°, like the demo's `right: 15%; top: 14%`.
	const hx = cx + r * Math.SQRT1_2;
	const hy = cy - r * Math.SQRT1_2;
	// A diagonal double arrow inside the handler dot.
	const handlerIcon = `M${hx - 5} ${hy + 5}L${hx + 5} ${hy - 5}M${hx + 1} ${hy - 5}H${hx + 5}V${hy - 1}M${hx - 5} ${hy + 1}V${hy + 5}H${hx - 1}`;
	const shade = `M0 0H320V200H0Z M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

	const titles = {
		idea: 'A round stencil with a single resize handler in its top-right part',
		resize: 'Dragging the handler grows the circle in every direction at once',
		directions: 'One handler shift moves all four edges of the bounding box by the same amount'
	};
</script>

<figure class="stencil-diagram">
	<svg viewBox="0 0 320 200" role="img" aria-label={titles[variant]}>
		<defs>
			<marker
				id={arrow}
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6"
				markerHeight="6"
				orient="auto-start-reverse"
			>
				<path d="M0 0L10 5L0 10Z" fill="#61dafb" />
			</marker>
		</defs>
		<rect width="320" height="200" rx="6" fill="#354146" />

		{#if variant === 'idea'}
			<path d={shade} fill="rgba(0, 0, 0, 0.45)" fill-rule="evenodd" />
			<rect
				x={cx - r}
				y={cy - r}
				width={2 * r}
				height={2 * r}
				fill="none"
				stroke="rgba(255, 255, 255, 0.45)"
				stroke-dasharray="2 4"
			/>
			<circle {cx} {cy} {r} fill="none" stroke="white" stroke-width="2" stroke-dasharray="6 4" />
			<circle cx={hx} cy={hy} r="11" fill="#61dafb" />
			<path d={handlerIcon} stroke="#20232a" stroke-width="1.6" fill="none" />
			<text x={hx + 16} y={hy - 8}>handler</text>
			<text x={cx} y={cy + 4} text-anchor="middle">stencil</text>
			<text x={cx - r} y={cy + r + 16}>bounding box</text>
			<text x="12" y="20">overlay</text>
		{:else if variant === 'resize'}
			<circle
				{cx}
				{cy}
				r={r + 22}
				fill="none"
				stroke="rgba(255, 255, 255, 0.4)"
				stroke-dasharray="6 4"
			/>
			<circle
				{cx}
				{cy}
				r={r - 14}
				fill="none"
				stroke="white"
				stroke-width="2"
				stroke-dasharray="6 4"
			/>
			{#each [0, 45, 90, 135, 180, 225, 270, 315] as angle (angle)}
				{@const rad = (angle * Math.PI) / 180}
				<line
					x1={cx + (r - 8) * Math.cos(rad)}
					y1={cy - (r - 8) * Math.sin(rad)}
					x2={cx + (r + 16) * Math.cos(rad)}
					y2={cy - (r + 16) * Math.sin(rad)}
					stroke="#61dafb"
					stroke-width="2"
					marker-end="url(#{arrow})"
				/>
			{/each}
			<circle {cx} {cy} r="3" fill="white" />
			<text x="12" y="20">the centre stays in place</text>
		{:else}
			<rect
				x={cx - r}
				y={cy - r}
				width={2 * r}
				height={2 * r}
				fill="none"
				stroke="white"
				stroke-width="1.5"
			/>
			<circle {cx} {cy} {r} fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-dasharray="6 4" />
			<!-- The handler shift. -->
			<line
				x1={hx}
				y1={hy}
				x2={hx + 26}
				y2={hy}
				stroke="#ffd166"
				stroke-width="2"
				marker-end="url(#{arrow})"
			/>
			<circle cx={hx} cy={hy} r="5" fill="#ffd166" />
			<text x={hx + 6} y={hy - 10} class="stencil-diagram__accent">shift.left</text>
			<!-- The resize directions. -->
			<line
				x1={cx - r}
				y1={cy}
				x2={cx - r - 30}
				y2={cy}
				stroke="#61dafb"
				stroke-width="2"
				marker-end="url(#{arrow})"
			/>
			<line
				x1={cx + r}
				y1={cy}
				x2={cx + r + 30}
				y2={cy}
				stroke="#61dafb"
				stroke-width="2"
				marker-end="url(#{arrow})"
			/>
			<line
				x1={cx}
				y1={cy - r}
				x2={cx}
				y2={cy - r - 22}
				stroke="#61dafb"
				stroke-width="2"
				marker-end="url(#{arrow})"
			/>
			<line
				x1={cx}
				y1={cy + r}
				x2={cx}
				y2={cy + r + 22}
				stroke="#61dafb"
				stroke-width="2"
				marker-end="url(#{arrow})"
			/>
			<text x={cx - r - 34} y={cy - 8} text-anchor="end">left</text>
			<text x={cx + r + 34} y={cy - 8}>right</text>
			<text x={cx + 8} y={cy - r - 10}>top</text>
			<text x={cx + 8} y={cy + r + 18}>bottom</text>
		{/if}
	</svg>
	<figcaption>{titles[variant]}</figcaption>
</figure>

<style>
	.stencil-diagram {
		margin: 1.25rem auto;
		max-width: 420px;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	text {
		fill: white;
		font-family: var(--font-sans);
		font-size: 11px;
	}
	.stencil-diagram__accent {
		fill: #ffd166;
	}
	figcaption {
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-muted);
		text-align: center;
	}
</style>
