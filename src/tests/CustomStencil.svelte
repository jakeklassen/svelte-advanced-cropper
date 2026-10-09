<script lang="ts">
	import { getCropperContext } from '#lib';

	let { ratio = 1 }: { ratio?: number } = $props();
	const context = getCropperContext();
	context.registerStencil(() => ({ aspectRatio: ratio }));
</script>
