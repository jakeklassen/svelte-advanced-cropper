<script lang="ts">
	import { pendingRefits } from './refitPending.ts';

	export function refresh() {
		return new Promise<void>((resolve) => pendingRefits.completions.push(resolve));
	}

	export function getState() {
		return { imageSize: { width: 800, height: 600 }, boundary: { width: 400, height: 320 } };
	}

	export function setVisibleArea() {
		pendingRefits.applied++;
	}
</script>
