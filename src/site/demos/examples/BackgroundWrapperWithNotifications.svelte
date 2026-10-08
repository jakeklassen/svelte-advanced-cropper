<script lang="ts">
	import {
		TransformableImage,
		isTouchEvent,
		isWheelEvent,
		useMoveImageOptions,
		useScaleImageOptions,
		type CropperBackgroundWrapperProps,
		type TransformableImageEvent
	} from 'svelte-advanced-cropper';

	let {
		cropper,
		scaleImage = true,
		moveImage = true,
		children,
		class: className,
		style
	}: CropperBackgroundWrapperProps = $props();

	const moveImageOptions = $derived(useMoveImageOptions(moveImage));
	const scaleImageOptions = $derived(useScaleImageOptions(scaleImage));
	const transitions = $derived(cropper.getTransitions());

	let notificationType: 'touch' | 'wheel' = $state('wheel');
	let notificationVisible = $state(false);

	// A tiny debounce: hide the notification 1.5s after the last event that showed it.
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	function hideNotificationLater() {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => (notificationVisible = false), 1500);
	}
	$effect(() => () => clearTimeout(hideTimer));

	function showNotification(type: 'touch' | 'wheel') {
		notificationVisible = true;
		notificationType = type;
		hideNotificationLater();
	}

	// Let a one-finger swipe or a plain wheel scroll the page. Only two fingers or
	// ctrl + wheel transform the image.
	function onEvent(event: TransformableImageEvent, nativeEvent: Event) {
		if (isTouchEvent(nativeEvent)) {
			if (nativeEvent.touches.length === 1 && !event.active) {
				showNotification('touch');
				event.preventDefault();
			} else {
				notificationVisible = false;
			}
		} else if (isWheelEvent(nativeEvent)) {
			if (!event.active && !nativeEvent.ctrlKey) {
				showNotification('wheel');
				event.preventDefault();
			} else {
				notificationVisible = false;
			}
		}
		// Events the image handles must not also scroll the page.
		if (!event.defaultPrevented) {
			nativeEvent.preventDefault();
			nativeEvent.stopPropagation();
		}
	}
</script>

<TransformableImage
	class={className}
	{style}
	onTransform={cropper.transformImage}
	onTransformEnd={cropper.transformImageEnd}
	{onEvent}
	touchMove={moveImageOptions.touch}
	mouseMove={moveImageOptions.mouse}
	touchScale={scaleImageOptions.touch}
	wheelScale={scaleImageOptions.wheel}
	disabled={transitions.active}
>
	{@render children?.()}
	<div
		class={[
			'cropper-event-notification',
			notificationVisible && 'cropper-event-notification--visible'
		]}
	>
		{notificationType === 'wheel'
			? 'Use ctrl + scroll to zoom the cropper'
			: 'Use two fingers to move the cropper'}
	</div>
</TransformableImage>

<style>
	.cropper-event-notification {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 50px;
		color: white;
		font-size: 20px;
		text-align: center;
		background: rgba(0, 0, 0, 0.6);
		opacity: 0;
		pointer-events: none;
		transition: opacity 1s;
	}
	.cropper-event-notification--visible {
		opacity: 1;
		pointer-events: all;
		transition: opacity 0.25s;
	}
</style>
