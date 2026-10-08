<script lang="ts">
	import type { Component } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { Ban, Circle, Expand, Shrink, Square, SquareDashed, X } from '@lucide/svelte';
	import { ImageRestriction } from 'svelte-advanced-cropper';
	import SettingsCheckbox from './SettingsCheckbox.svelte';
	import SettingsInput from './SettingsInput.svelte';
	import type { CropperSettings, SettingsGroup } from './wizard';

	interface Props {
		/** The draft being edited. The wizard applies it when the panel closes. */
		settings: CropperSettings;
		properties: SettingsGroup[];
		open?: boolean;
		onClose?: () => void;
		class?: ClassValue;
	}

	let {
		settings = $bindable(),
		properties,
		open = false,
		onClose,
		class: className
	}: Props = $props();

	interface AspectRatioOption {
		label: string;
		/** The glyph's rectangles, as [width, height] inside a 24×24 box. */
		shapes: [number, number][];
		aspectRatio?: number;
		minAspectRatio?: number;
		maxAspectRatio?: number;
	}

	const aspectRatios: AspectRatioOption[] = [
		{ label: 'Free', shapes: [] },
		{ label: '1:1', shapes: [[18, 18]], aspectRatio: 1 },
		{ label: '1:2', shapes: [[11, 22]], aspectRatio: 1 / 2 },
		{ label: '3:4', shapes: [[15, 20]], aspectRatio: 3 / 4 },
		{ label: '2:1', shapes: [[22, 11]], aspectRatio: 2 },
		{
			label: '1:2 – 2:1',
			shapes: [
				[11, 22],
				[22, 11]
			],
			minAspectRatio: 1 / 2,
			maxAspectRatio: 2
		}
	];

	const imageRestrictions: { label: string; icon: Component; value: ImageRestriction }[] = [
		{ label: 'Fit area', icon: Shrink, value: ImageRestriction.fitArea },
		{ label: 'Fill area', icon: Expand, value: ImageRestriction.fillArea },
		{ label: 'Stencil', icon: SquareDashed, value: ImageRestriction.stencil },
		{ label: 'None', icon: Ban, value: ImageRestriction.none }
	];

	const stencilTypes = [
		{ label: 'Rectangle', icon: Square, value: 'rectangle' as const },
		{ label: 'Circle', icon: Circle, value: 'circle' as const }
	];

	const inputs = [
		{ label: 'Min Width', field: 'minWidth', placeholder: '0' },
		{ label: 'Min Height', field: 'minHeight', placeholder: '0' },
		{ label: 'Max Width', field: 'maxWidth', placeholder: '∞' },
		{ label: 'Max Height', field: 'maxHeight', placeholder: '∞' }
	] as const;

	function isActiveRatio({ aspectRatio, minAspectRatio, maxAspectRatio }: AspectRatioOption) {
		return (
			settings.aspectRatio === aspectRatio &&
			settings.minAspectRatio === minAspectRatio &&
			settings.maxAspectRatio === maxAspectRatio
		);
	}

	function selectRatio({ aspectRatio, minAspectRatio, maxAspectRatio }: AspectRatioOption) {
		settings.aspectRatio = aspectRatio;
		settings.minAspectRatio = minAspectRatio;
		settings.maxAspectRatio = maxAspectRatio;
	}

	const has = (group: SettingsGroup) => properties.includes(group);
</script>

<div
	class={['croppers-wizard-settings', open && 'croppers-wizard-settings--visible', className]}
	inert={!open}
>
	<button type="button" class="close-button" aria-label="Apply settings" onclick={onClose}>
		<X size={22} />
	</button>
	{#if has('aspectRatio')}
		<div class="property">
			<div class="property-title">Aspect Ratio</div>
			<div class="values">
				{#each aspectRatios as ratio (ratio.label)}
					{@const active = isActiveRatio(ratio)}
					<button
						type="button"
						class={['option', active && 'option--active']}
						aria-pressed={active}
						onclick={() => selectRatio(ratio)}
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							{#if ratio.shapes.length}
								{#each ratio.shapes as [width, height], index (index)}
									<rect
										x={(24 - width) / 2}
										y={(24 - height) / 2}
										{width}
										{height}
										rx="1.5"
										stroke="currentColor"
										stroke-width="2"
									/>
								{/each}
							{:else}
								<rect
									x="3"
									y="3"
									width="18"
									height="18"
									rx="1.5"
									stroke="currentColor"
									stroke-width="2"
									stroke-dasharray="3 3"
								/>
							{/if}
						</svg>
						<span class="option-label">{ratio.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
	{#if has('imageRestriction')}
		<div class="property">
			<div class="property-title">Image Restriction</div>
			<div class="values">
				{#each imageRestrictions as restriction (restriction.value)}
					{@const active = settings.imageRestriction === restriction.value}
					<button
						type="button"
						class={['option', active && 'option--active']}
						aria-pressed={active}
						onclick={() => (settings.imageRestriction = restriction.value)}
					>
						<restriction.icon size={24} aria-hidden="true" />
						<span class="option-label">{restriction.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
	{#if has('stencil')}
		<div class="property">
			<div class="property-title">Stencil Type</div>
			<div class="values">
				{#each stencilTypes as type (type.value)}
					{@const active = settings.stencilType === type.value}
					<button
						type="button"
						class={['option', active && 'option--active']}
						aria-pressed={active}
						onclick={() => (settings.stencilType = type.value)}
					>
						<type.icon size={24} aria-hidden="true" />
						<span class="option-label">{type.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
	{#if has('size')}
		<div class="values inputs">
			{#each inputs as input (input.field)}
				<div class="input">
					<SettingsInput
						bind:value={settings[input.field]}
						label={input.label}
						placeholder={input.placeholder}
					/>
				</div>
			{/each}
		</div>
	{/if}
	{#if has('scaleImage') || has('grid')}
		<div class="values checkboxes">
			{#if has('scaleImage')}
				<SettingsCheckbox bind:checked={settings.scaleImage} label="Scale Image" />
			{/if}
			{#if has('grid')}
				<SettingsCheckbox bind:checked={settings.grid} label="Stencil Grid" />
			{/if}
		</div>
	{/if}
</div>

<style>
	/* An overlay that slides in over the cropper. */
	.croppers-wizard-settings {
		position: absolute;
		inset: 0;
		z-index: 2;
		color: white;
		padding: 20px 40px;
		overflow-y: auto;
		background: rgba(0, 0, 0, 0.98);
		transform: translateX(-100%);
		opacity: 0;
		transition: 0.5s;
	}
	.croppers-wizard-settings--visible {
		transform: translateX(0);
		opacity: 1;
	}
	.property-title {
		font-size: 16px;
		opacity: 0.8;
		margin-bottom: 6px;
	}
	/* Rows bleed to the panel edges and scroll sideways when they don't fit. */
	.values {
		display: flex;
		align-items: center;
		margin: 0 -40px 20px;
		padding: 0 40px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.option {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 5px 12px;
		background: none;
		border: none;
		border-radius: 6px;
		color: white;
		font: inherit;
		cursor: pointer;
		transition: color 0.5s;
	}
	.option:first-child {
		margin-left: -12px;
	}
	.option:focus-visible {
		outline: 2px solid #61dafb;
		outline-offset: -2px;
	}
	.option--active {
		color: #61dafb;
	}
	.option-label {
		font-size: 12px;
		white-space: nowrap;
		opacity: 0.8;
	}
	.inputs {
		margin-bottom: 24px;
	}
	.input {
		flex-shrink: 0;
		width: 125px;
		padding-right: 40px;
	}
	.checkboxes {
		gap: 16px;
	}
	.close-button {
		position: absolute;
		top: 5px;
		right: 10px;
		width: 32px;
		height: 32px;
		padding: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 50%;
		background: none;
		color: inherit;
		opacity: 0.5;
		cursor: pointer;
		transition: 0.5s;
	}
	.close-button:hover,
	.close-button:focus-visible {
		opacity: 1;
	}
</style>
