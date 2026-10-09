<script lang="ts">
	import { onMount, untrack } from 'svelte';

	interface Props {
		log: string[];
		changeOnMount?: boolean;
	}

	let { log, changeOnMount = false }: Props = $props();

	let data = $state.raw({ value: 1, other: 1 });

	onMount(() => {
		if (changeOnMount) {
			data = { value: 2, other: 1 };
		}
	});

	const value = $derived(data.value);
	let previous = untrack(() => value);
	$effect(() => {
		const current = value;
		if (current === previous) {
			return;
		}

		previous = current;
		untrack(() => log.push(`run:${current}`));

		return () => {
			untrack(() => log.push('cleanup'));
		};
	});

	export function setValue(next: number) {
		data = { ...data, value: next };
	}

	export function setOther(other: number) {
		data = { ...data, other };
	}
</script>
