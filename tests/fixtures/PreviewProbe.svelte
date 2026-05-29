<!-- Test fixture: a leaf component used as a CropperPreview `backgroundComponent`
     override. It renders whatever `probe` value it receives into a data-attr so
     a test can assert the value was forwarded through `backgroundProps`. -->
<script lang="ts">
  let { probe = '' }: { probe?: string; cropper?: unknown; size?: unknown; class?: unknown } = $props()
</script>

<div data-probe={probe}></div>
