<script lang="ts" module>
  import { untrack } from 'svelte'
  import { isUndefined, loadImage, promiseTimeout } from 'advanced-cropper'
  import type { CropperImage } from 'advanced-cropper'

  export interface CropperImageOptions {
    src?: string | null
    onLoadingStart?: () => void
    onLoadingEnd?: () => void
    onError?: () => void
    onLoad?: (image?: CropperImage) => void
    crossOrigin?: 'anonymous' | 'use-credentials' | boolean
    checkOrientation?: boolean
    canvas?: string | boolean
    unloadTime?: number
  }

  /**
   * Svelte equivalent of the React `useCropperImage`. Owns the lifecycle of
   * loading a single image URL: emits loading/loaded/error states, debounces
   * src clears via `unloadTime`, and cancels in-flight loads when the src
   * changes mid-load (the React pattern with `currentSrc.current === src` —
   * unchanged because it's not React-specific).
   *
   * Instantiate inside an `<AbstractCropper>` component's `<script>` so the
   * internal `$effect` attaches to that component's lifecycle.
   *
   * The eight React workaround hooks (`useFirstMountState`, `useUpdateEffect`,
   * `useStateWithCallback`, `usePersistentFunction`, etc.) all collapse into
   * one `$effect` + `untrack` here.
   *
   * Lives in a .svelte file (module-script only) for the same reason as
   * CropperInstance — see that file for the rationale.
   */
  export class CropperImageLoader {
    #image = $state.raw<CropperImage | null>(null)
    #loading = $state(false)
    #loaded = $state(false)
    #currentSrc: string | null = null
    #options: () => CropperImageOptions

    constructor(options: () => CropperImageOptions) {
      this.#options = options

      $effect(() => {
        const opts = this.#options()
        const src = opts.src ?? null

        // Untrack everything past the option reads — we don't want
        // assignments to `#loaded` / `#image` / `#loading` (made later
        // in this effect or in the promise callbacks) to trigger a re-run.
        untrack(() => {
          if (this.#currentSrc === src) return

          const previouslyLoaded = this.#loaded
          this.#currentSrc = src
          this.#loaded = false

          if (src) {
            this.#loading = true
            opts.onLoadingStart?.()

            const promises: Promise<unknown>[] = [
              loadImage(src, {
                crossOrigin: isUndefined(opts.crossOrigin) ? opts.canvas : opts.crossOrigin,
                checkOrientation: opts.checkOrientation,
              }),
            ]
            // If we were already showing an image, give it `unloadTime`ms
            // to fade out before swapping in the new one (matches React port).
            if (previouslyLoaded && opts.unloadTime) {
              promises.push(promiseTimeout(opts.unloadTime))
            }

            Promise.all(promises)
              .then((responses) => {
                const [image] = responses as [CropperImage]
                if (this.#currentSrc === src) {
                  this.#image = image
                  this.#loaded = true
                  opts.onLoad?.(image)
                }
              })
              .catch(() => {
                if (this.#currentSrc === src) opts.onError?.()
              })
              .finally(() => {
                if (this.#currentSrc === src) {
                  opts.onLoadingEnd?.()
                  this.#loading = false
                }
              })
          } else if (opts.unloadTime) {
            promiseTimeout(opts.unloadTime).then(() => {
              if (this.#currentSrc === src) this.#image = null
            })
          } else {
            this.#image = null
          }
        })
      })
    }

    isLoading(): boolean {
      return this.#loading
    }
    isLoaded(): boolean {
      return this.#loaded
    }
    getImage(): CropperImage | null {
      return this.#image
    }
    setImage(image: CropperImage | null): void {
      this.#image = image
    }
  }
</script>
