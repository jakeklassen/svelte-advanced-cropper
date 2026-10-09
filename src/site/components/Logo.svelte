<script lang="ts">
	interface Props {
		size?: number;
	}

	let { size = 28 }: Props = $props();
</script>

<!-- Two crop marks framing a square. -->
<svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
	<path d="M8 2v22h22" stroke="#1aa7f9" stroke-width="3.5" stroke-linecap="round" />
	<path d="M2 8h22v22" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
</svg>
