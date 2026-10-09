<script lang="ts">
	import { getCropperContext, type StencilOptions } from '#lib';

	let { options }: { options: StencilOptions } = $props();
	getCropperContext().registerStencil(() => options);
</script>
