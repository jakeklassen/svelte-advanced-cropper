<script lang="ts">
	const commands = {
		npm: 'npm install svelte-advanced-cropper',
		pnpm: 'pnpm add svelte-advanced-cropper',
		yarn: 'yarn add svelte-advanced-cropper',
		bun: 'bun add svelte-advanced-cropper',
		aube: 'aube add svelte-advanced-cropper'
	};

	type Manager = keyof typeof commands;

	const managers = Object.keys(commands) as Manager[];

	let manager: Manager = $state('npm');
</script>

<div class="installation-block">
	<code class="command"><span class="prefix" aria-hidden="true">$</span>{commands[manager]}</code>
	<div class="managers" role="group" aria-label="Package manager">
		{#each managers as name, index (name)}
			{#if index > 0}<span aria-hidden="true">/</span>{/if}
			<button
				type="button"
				class={['manager', manager === name && 'manager--active']}
				aria-pressed={manager === name}
				onclick={() => (manager = name)}>{name}</button
			>
		{/each}
	</div>
</div>

<style>
	.installation-block {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		background: #212121;
		border-radius: 10px;
		padding: 20px 30px;
		color: white;
	}
	.command {
		background: none;
		padding: 0;
		font-size: 15px;
		overflow-wrap: anywhere;
	}
	.prefix {
		user-select: none;
		color: #61dafb;
		margin-right: 8px;
	}
	.managers {
		display: flex;
		gap: 0.35rem;
		color: rgba(255, 255, 255, 0.6);
	}
	.manager {
		appearance: none;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.manager:hover,
	.manager--active {
		color: white;
	}
	.manager--active {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
