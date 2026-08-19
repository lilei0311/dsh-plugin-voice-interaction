/**
 * Bundles the browser half (`src/client/index.ts`) into the exact artifact
 * shape DSH's client module loader requires: a single CJS closure that
 * self-registers via `window.__ModuleLoader__.load({ id, factory })` instead
 * of executing top-level module code — see
 * `@deepseek-ai/dsh-client-modules`'s README ("Lazy CJS model") for the
 * runtime contract this mirrors. `deepseek-harness` builds its own
 * `packages/client/*` plugins with an equivalent internal preset
 * (`packages/client/tsdown.client.ts`); that preset isn't published, so this
 * file reimplements the parts an external plugin needs from its public
 * source. Types for `./client` ship separately from `tsc -p
 * tsconfig.build.json` (this build's `dts: false` mirrors that split — a
 * banner/footer wrapped around a `.d.ts` file breaks its parsing).
 * @module dsh-plugin-voice-interaction/tsdown.config
 */
import { defineConfig } from 'tsdown'

/**
 * Modules the DSH web shell resolves through its own frozen module table at
 * runtime (`window.__ModuleLoader__`'s synchronous `require`) — these must
 * stay external, never bundled, or the browser loads a second, disconnected
 * copy of a singleton (React, Cordis, the plugin slot registry, ...).
 * Mirrors `@deepseek-ai/dsh-client-web`'s `PLATFORM_MODULES` plus the
 * documented `dsh-client-runtime` store-engine exemption
 * (`packages/client/tsdown.client.ts`'s `CLIENT_EXTERNALS`).
 */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-runtime/client',
]

/** The loader id: this package's name, matching the row `cordis.patch.yml` inserts. */
const PLUGIN_ID = 'dsh-plugin-voice-interaction'

export default defineConfig({
  entry: { index: 'src/client/index.ts' },
  outDir: 'lib/client',
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  dts: false,
  clean: false,
  sourcemap: true,
  deps: { neverBundle: CLIENT_EXTERNALS },
  outputOptions: {
    entryFileNames: 'index.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
