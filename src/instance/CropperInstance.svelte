<script lang="ts" module>
  import { AbstractCropperInstance, getEmptyInteractions } from 'advanced-cropper'
  import type {
    AbstractCropperInstanceData,
    AbstractCropperInstanceProps,
    AbstractCropperInstanceSettings,
  } from 'advanced-cropper'

  /**
   * Svelte port of the React `CropperInstance`. Subclasses the engine's
   * `AbstractCropperInstance` and bridges its data field to Svelte's
   * reactivity via `$state.raw`.
   *
   * The React port uses an `onChange` callback (wired to `useForceRerender`)
   * that the engine calls after mutating state. In Svelte 5 we **eliminate
   * the notify callback entirely** — assignments to `this.data` (which is
   * `$state.raw`) trigger reactivity on every consumer that read it inside a
   * `$derived` / `$effect`. Same end behavior, no plumbing.
   *
   * `$state.raw` is used (not `$state`) because the engine treats the data
   * object as immutable — it always replaces it wholesale rather than
   * mutating in place. The "raw" variant skips deep proxying which is wasted
   * work here.
   *
   * Lives in a .svelte file (with only a `<script module>`, no template) so
   * rollup-plugin-svelte's compiler processes it with rune support. The
   * `.svelte.ts` extension would also work in principle but the plugin's
   * parser doesn't accept TS syntax in those files.
   */
  export class CropperInstance<
    Settings extends AbstractCropperInstanceSettings,
    Instance = unknown,
  > extends AbstractCropperInstance<Settings, Instance> {
    data = $state.raw<AbstractCropperInstanceData>({
      state: null,
      transitions: false,
      interactions: getEmptyInteractions(),
    })

    props: () => AbstractCropperInstanceProps<Settings, Instance>

    constructor(props: () => AbstractCropperInstanceProps<Settings, Instance>) {
      super()
      this.props = props
    }

    protected getProps() {
      return this.props()
    }

    protected setData(data: AbstractCropperInstanceData) {
      this.data = data
    }

    protected getData(): AbstractCropperInstanceData {
      return this.data
    }
  }
</script>
