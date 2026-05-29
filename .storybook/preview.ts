import type { Preview } from '@storybook/svelte-vite'

// Load the cropper styles for every story.
// We import the engine SCSS directly here so Storybook (Vite) compiles it
// on the fly via the `sass` dev dep — no need to wait for `pnpm build`.
import 'advanced-cropper/styles/index.scss'
import 'advanced-cropper/themes/default.scss'

const preview: Preview = {
  parameters: {
    // Pin the Demo to the top of the sidebar so it's the first thing visitors
    // see; everything else falls under the `*` wildcard in its existing order.
    options: {
      storySort: {
        order: ['Demo', '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },
    // Autodocs Docs view clips inline story previews to ~200px tall by default,
    // which truncates our tallest demo frames (the cropper-context shims).
    // Give them room to breathe; small stories just get extra whitespace.
    docs: {
      story: {
        height: '400px',
      },
    },
  },
};

export default preview;