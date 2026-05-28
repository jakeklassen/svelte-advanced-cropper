/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  root: './playground',
  plugins: [svelte()],
  css: {
    preprocessorOptions: {
      scss: {
        // Upstream advanced-cropper SCSS uses legacy @import — silence the
        // deprecation noise (same as scripts/build-styles.mjs does for the
        // package CSS pipeline).
        silenceDeprecations: ['import', 'global-builtin'],
      },
    },
  },
  test: {
    passWithNoTests: true,
    projects: [{
      extends: true,
      test: {
        root: '.',
        // tmp/ holds the upstream React/engine source clones (port reference);
        // their tests reach into source paths Vitest can't resolve here.
        exclude: ['**/node_modules/**', '**/dist/**', 'tmp/**'],
        passWithNoTests: true,
        browser: {
          enabled: true,
          provider: playwright(),
          instances: [{
            browser: 'chromium'
          }],
          headless: true
        }
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});