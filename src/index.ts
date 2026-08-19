/**
 * Voice interaction plugin, host half. Pure browser UI plugin: the empty
 * apply exists so the plugin appears in the host cordis.yml / Loader; the
 * browser half ships through `exports["./client"]`, discovered via this
 * package's `dsh.client` declaration.
 * @module dsh-plugin-voice-interaction
 */

/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply(): void {}
