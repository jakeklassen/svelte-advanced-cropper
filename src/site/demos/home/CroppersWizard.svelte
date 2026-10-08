<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import { goto } from '$app/navigation';
	import { Crop, Frame, Info, Plus, Settings, Smartphone, X } from '@lucide/svelte';
	import {
		CircleStencil,
		ImageRestriction,
		Priority,
		RectangleStencil
	} from 'svelte-advanced-cropper';
	import { preventZoom } from 'advanced-cropper/extensions/prevent-zoom';
	import { href, image } from '#site/paths.ts';
	import DefaultCropper from '../croppers/DefaultCropper/DefaultCropper.svelte';
	import FixedCropper from '../croppers/FixedCropper/FixedCropper.svelte';
	import TelegramCropper from '../showcase/Telegram/TelegramCropper.svelte';
	import CroppersWizardInfo from './CroppersWizardInfo.svelte';
	import CroppersWizardSettings from './CroppersWizardSettings.svelte';
	import type { CropperDescription, CropperKey, CropperSettings } from './wizard';

	const croppers: (CropperDescription & { icon: Component })[] = [
		{
			key: 'default-cropper',
			name: 'Default Cropper',
			description:
				'The standard Cropper with a dark look and a custom toolbar for flips and turns.',
			features: ['Custom Navigation', 'Styling'],
			icon: Crop,
			settings: ['aspectRatio', 'imageRestriction', 'stencil', 'size', 'scaleImage', 'grid']
		},
		{
			key: 'mobile-cropper',
			name: 'Mobile Cropper',
			description:
				'A fully custom cropper modelled on the croppers of popular Android apps: a fixed stencil that zooms to fit, and a dial for fine rotation.',
			features: ['Custom Postprocess', 'Custom Navigation', 'Styling'],
			icon: Smartphone,
			settings: ['aspectRatio', 'stencil', 'size', 'grid'],
			link: { href: href('/docs/showcase'), label: 'Showcase: Telegram' }
		},
		{
			key: 'fixed-cropper',
			name: 'Fixed Cropper',
			description:
				'A FixedCropper: the stencil stays put while you move and zoom the image under it, like the avatar croppers of social networks.',
			features: ['Custom Navigation', 'Styling'],
			icon: Frame,
			settings: ['stencil', 'size'],
			link: {
				href: 'https://github.com/jakeklassen/svelte-advanced-cropper/tree/main/src/site/demos/croppers/FixedCropper',
				label: 'Source on GitHub'
			}
		}
	];

	const images = [
		'karina-tess-GIgMRVBD-1s-unsplash.jpg',
		'pexels-photo-876344.jpeg',
		'photo-1599032909756-5deb82fea3b0.jpg',
		'photo-1639141700803-e5836ba39b4b.jpg'
	].map((name) => ({
		src: image(name),
		preview: image(name.replace(/(\.\w+)$/, '__preview$1'))
	}));

	let settings: CropperSettings = $state({
		aspectRatio: undefined,
		minAspectRatio: undefined,
		maxAspectRatio: undefined,
		imageRestriction: ImageRestriction.fitArea,
		stencilType: 'rectangle',
		minWidth: 0,
		maxWidth: undefined,
		minHeight: 0,
		maxHeight: undefined,
		scaleImage: true,
		grid: true
	});

	// The settings panel edits a copy, applied when the panel closes.
	let draft: CropperSettings = $state({});
	let showSettings = $state(false);
	let showInfo = $state(false);

	// Prerendering has no URL hash, so the page starts on the default cropper and picks
	// up the hash once it runs in the browser.
	let selected: CropperKey = $state('default-cropper');
	const data = $derived(croppers.find((cropper) => cropper.key === selected) ?? croppers[0]);
	const hasSettings = $derived(data.settings.length > 0);

	let src = $state(images[0].src);
	let uploaded: string | undefined;
	let fileInput: HTMLInputElement | undefined = $state();

	const stencilComponent = $derived(
		settings.stencilType === 'circle' ? CircleStencil : RectangleStencil
	);

	const stencilProps = $derived({
		aspectRatio: settings.aspectRatio,
		minAspectRatio: settings.minAspectRatio,
		maxAspectRatio: settings.maxAspectRatio,
		grid: settings.grid
	});

	function readHash() {
		const hash = location.hash.slice(1);
		const match = croppers.find((cropper) => cropper.key === hash);
		selected = match ? match.key : croppers[0].key;
	}

	function select(key: CropperKey) {
		selected = key;
		// Update the hash without a navigation or a new history entry.
		void goto(`#${key}`, { shallow: true, replace: true });
	}

	function setImage(value: string) {
		if (uploaded) URL.revokeObjectURL(uploaded);
		uploaded = undefined;
		src = value;
	}

	function onUpload(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			setImage(URL.createObjectURL(file));
			uploaded = src;
		}
		// Allow picking the same file again.
		event.currentTarget.value = '';
	}

	function openSettings() {
		draft = { ...settings };
		showSettings = true;
	}

	function closeSettings() {
		settings = { ...draft };
		showSettings = false;
	}

	onMount(() => {
		readHash();
		return () => {
			if (uploaded) URL.revokeObjectURL(uploaded);
		};
	});
</script>

<svelte:window onhashchange={readHash} />

<div class="croppers-wizard">
	<div class="column column--left" role="group" aria-label="Cropper">
		<div class="column-title">Cropper</div>
		{#each croppers as cropper (cropper.key)}
			<button
				type="button"
				class={['cell', 'cropper-type', selected === cropper.key && 'cropper-type--active']}
				aria-label={cropper.name}
				aria-pressed={selected === cropper.key}
				title={cropper.name}
				onclick={() => select(cropper.key)}
			>
				<cropper.icon size={22} />
			</button>
		{/each}
	</div>
	<div class="body">
		{#if selected === 'mobile-cropper'}
			<TelegramCropper
				class="croppers-wizard__cropper"
				{src}
				minWidth={settings.minWidth}
				minHeight={settings.minHeight}
				maxWidth={settings.maxWidth}
				maxHeight={settings.maxHeight}
				{stencilComponent}
				{stencilProps}
			/>
		{:else if selected === 'default-cropper'}
			<DefaultCropper
				wrapperClassName="croppers-wizard__cropper"
				{src}
				minWidth={settings.minWidth}
				minHeight={settings.minHeight}
				maxWidth={settings.maxWidth}
				maxHeight={settings.maxHeight}
				priority={settings.imageRestriction === ImageRestriction.fillArea
					? Priority.visibleArea
					: Priority.coordinates}
				{stencilComponent}
				{stencilProps}
				transformImage={{
					adjustStencil:
						settings.imageRestriction !== ImageRestriction.stencil &&
						settings.imageRestriction !== ImageRestriction.none
				}}
				postProcess={settings.scaleImage ? undefined : preventZoom}
				backgroundWrapperProps={{ scaleImage: settings.scaleImage }}
				imageRestriction={settings.imageRestriction}
			/>
		{:else}
			<FixedCropper
				class="croppers-wizard__cropper"
				{src}
				minWidth={settings.minWidth}
				minHeight={settings.minHeight}
				maxWidth={settings.maxWidth}
				maxHeight={settings.maxHeight}
				stencilType={settings.stencilType}
			/>
		{/if}
		<button
			type="button"
			class="round-button info-button"
			aria-label="About this cropper"
			onclick={() => (showInfo = true)}
		>
			<Info size={22} />
		</button>
		{#if hasSettings}
			<button
				type="button"
				class="round-button settings-button"
				aria-label="Settings"
				onclick={openSettings}
			>
				<Settings size={22} />
			</button>
		{/if}
		<div class={['overlay', showInfo && 'overlay--visible']} inert={!showInfo}>
			<button
				type="button"
				class="round-button close-button"
				aria-label="Close"
				onclick={() => (showInfo = false)}
			>
				<X size={22} />
			</button>
			<CroppersWizardInfo {data} />
		</div>
		<CroppersWizardSettings
			bind:settings={draft}
			open={showSettings && hasSettings}
			properties={data.settings}
			onClose={closeSettings}
		/>
	</div>
	<div class="column column--right" role="group" aria-label="Image">
		<div class="column-title">Image</div>
		{#each images as item, index (item.src)}
			<button
				type="button"
				class={['cell', 'image', item.src === src && 'image--active']}
				style:background-image="url({item.preview})"
				aria-label="Photo {index + 1}"
				aria-pressed={item.src === src}
				onclick={() => setImage(item.src)}
			></button>
		{/each}
		<button
			type="button"
			class="cell custom-image"
			aria-label="Upload your own image"
			title="Upload your own image"
			onclick={() => fileInput?.click()}
		>
			<Plus size={18} strokeWidth={3} />
		</button>
		<input
			class="file-input"
			type="file"
			accept="image/*"
			tabindex="-1"
			bind:this={fileInput}
			onchange={onUpload}
		/>
	</div>
</div>

<style>
	.croppers-wizard {
		display: flex;
		min-width: 0;
	}
	.body {
		position: relative;
		width: 540px;
		max-width: calc(100% - 40px);
		height: 550px;
		max-height: 100vh;
		margin: 0 20px;
		border-radius: 10px;
		overflow: hidden;
		background: black;
		box-shadow: 0 0 18px 0 rgba(2, 3, 3, 0.48);
	}
	.body :global(.croppers-wizard__cropper) {
		height: 100%;
	}
	.column {
		width: 60px;
		display: flex;
		flex-direction: column;
	}
	.column--left {
		margin-right: 20px;
	}
	.column--right {
		margin-left: 20px;
		align-items: flex-end;
	}
	.column-title {
		font-size: 14px;
		color: #a7a7a7;
		margin-bottom: 16px;
	}
	.cell {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		margin-bottom: 20px;
		padding: 0;
		border: none;
		border-radius: 5px;
		background-color: #2d2c2c;
		cursor: pointer;
	}
	.cell:focus-visible {
		outline: 2px solid #61dafb;
		outline-offset: 2px;
	}
	.cropper-type {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: color 0.5s;
	}
	.cropper-type--active,
	.cropper-type:hover {
		color: #61dafb;
	}
	.image {
		background-size: cover;
		background-position: center;
		opacity: 0.7;
		transition: opacity 0.5s;
	}
	.image--active,
	.image:hover {
		opacity: 1;
	}
	.custom-image {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(110, 109, 110, 0.8);
		transition: color 0.5s;
	}
	.custom-image:hover {
		color: #a7a7a7;
	}
	.file-input {
		display: none;
	}
	.round-button {
		position: absolute;
		z-index: 1;
		top: 5px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: none;
		color: white;
		opacity: 0.5;
		cursor: pointer;
		transition: 0.5s;
	}
	.round-button:hover,
	.round-button:focus-visible {
		opacity: 1;
	}
	.info-button {
		left: 10px;
	}
	.settings-button,
	.close-button {
		right: 10px;
	}
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		overflow-y: auto;
		background: rgba(0, 0, 0, 0.98);
		transform: translateX(-100%);
		opacity: 0;
		transition: 0.5s;
	}
	.overlay--visible {
		transform: translateX(0);
		opacity: 1;
	}
	@media (max-width: 768px) {
		.croppers-wizard {
			display: block;
		}
		.body {
			max-width: none;
			width: auto;
			height: 500px;
			max-height: 80vh;
			margin: 0;
			border-radius: 0;
		}
		.column {
			width: 100%;
			flex-direction: row;
			justify-content: center;
			align-items: center;
			padding: 20px 0;
			margin: 0;
		}
		.column-title {
			display: none;
		}
		.cell {
			margin-bottom: 0;
			margin-right: 20px;
		}
		.cell:last-of-type {
			margin-right: 0;
		}
	}
</style>
