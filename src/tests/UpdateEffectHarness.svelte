<script lang="ts">
	import { useUpdateEffect } from '#lib';

	interface Props {
		log: string[];
	}

	let { log }: Props = $props();

	let data = $state.raw({ value: 1, other: 1 });

	useUpdateEffect(
		() => {
			log.push(`run:${data.value}`);

			return () => log.push('cleanup');
		},
		() => [data.value]
	);

	export function setValue(value: number) {
		data = { ...data, value };
	}

	export function setOther(other: number) {
		data = { ...data, other };
	}
</script>
