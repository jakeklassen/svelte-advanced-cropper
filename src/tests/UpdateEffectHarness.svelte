<script lang="ts">
	import { observeChanges } from '#lib/controllers/observeChanges.svelte.ts';

	interface Props {
		log: string[];
		changeOnMount?: boolean;
	}

	let { log, changeOnMount = false }: Props = $props();

	let data = $state.raw({ value: 1, other: 1 });

	$effect(() => {
		if (changeOnMount) {
			data = { value: 2, other: 1 };
		}
	});

	observeChanges(
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
