<script lang="ts">
	import SchemeImage from './SchemeImage.svelte';
</script>

<figure class="cropper-structure" aria-label="Cropper structure without a stencil">
	<div class="cropper-structure__wrapper">
		<span class="cropper-structure__tag">Wrapper</span>
		<div class="cropper-structure__background">
			<SchemeImage class="cropper-structure__image" />
			<span class="cropper-structure__tag cropper-structure__tag--inner">Background image</span>
		</div>
	</div>
	<figcaption>
		<dl class="cropper-structure__legend">
			<dt>Wrapper</dt>
			<dd><code>class</code>, <code>wrapperComponent</code>, <code>wrapperProps</code></dd>
			<dt>Background image</dt>
			<dd>
				<code>backgroundClassName</code>, <code>backgroundComponent</code>,
				<code>backgroundProps</code>
			</dd>
		</dl>
	</figcaption>
</figure>

<style>
	.cropper-structure {
		margin: 1.5rem 0;
	}

	.cropper-structure__wrapper {
		position: relative;
		max-width: 520px;
		padding: 2.75rem 1.25rem 1.5rem;
		border: 2px dashed #9ca3af;
		border-radius: 6px;
		background: #1f1f1f;
	}

	.cropper-structure__background {
		position: relative;
		width: 80%;
		aspect-ratio: 3 / 2;
		margin: 0 auto;
		outline: 2px dashed var(--color-primary);
		outline-offset: 3px;
	}

	:global(.cropper-structure__image) {
		width: 100%;
		height: 100%;
	}

	.cropper-structure__tag {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
		background: #9ca3af;
		color: #111;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.cropper-structure__tag--inner {
		background: var(--color-primary);
		color: #fff;
	}

	.cropper-structure__legend {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.35rem 1rem;
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}

	.cropper-structure__legend dt {
		font-weight: 600;
	}

	.cropper-structure__legend dd {
		margin: 0;
	}

	@media (max-width: 540px) {
		.cropper-structure__legend {
			grid-template-columns: 1fr;
		}

		.cropper-structure__legend dd {
			margin-bottom: 0.5rem;
		}
	}
</style>
