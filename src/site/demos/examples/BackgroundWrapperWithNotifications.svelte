<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		CropperBackgroundWrapper,
		isTouchEvent,
		isWheelEvent,
		type CropperBackgroundWrapperSnippetProps,
		type TransformableImageEvent
	} from 'svelte-advanced-cropper';

	let { children, ...props }: CropperBackgroundWrapperSnippetProps = $props();

	type NotificationType = 'touch' | 'wheel';

	const messages: Record<NotificationType, string> = {
		touch: 'Use two fingers to move the cropper',
		wheel: 'Use ctrl + scroll to zoom the cropper'
	};

	let notificationType: NotificationType = $state('wheel');
	let notificationVisible = $state(false);

	// A tiny debounce: hide the notification 1.5s after the last event that showed it.
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => clearTimeout(hideTimer));

	function hideNotificationLater() {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => (notificationVisible = false), 1500);
	}

	function showNotification(type: NotificationType) {
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

<CropperBackgroundWrapper {...props} {onEvent}>
	{@render children?.()}
	<div
		class={[
			'cropper-event-notification',
			notificationVisible && 'cropper-event-notification--visible'
		]}
	>
		{messages[notificationType]}
	</div>
</CropperBackgroundWrapper>

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
