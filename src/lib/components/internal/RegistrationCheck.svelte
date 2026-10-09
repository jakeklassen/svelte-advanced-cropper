<script lang="ts">
	let { validate }: { validate: () => void } = $props();
	(() => validate())();
</script>
