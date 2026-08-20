/**
 * Pure edge-detection for "this message's text just finished streaming",
 * factored out of {@link ReadAloudAction} so it can be unit-tested without a
 * React renderer.
 * @module dsh-plugin-voice-interaction/client/finalization
 */

/**
 * Whether `text` just transitioned from absent to present since the last
 * check — i.e. this render is the first one where the message has content.
 *
 * Only this edge should trigger auto-read. Checking merely "text is defined
 * right now" would also fire every time an unrelated dependency (like the
 * voice-mode flag) changes on an already-finalized message — which is
 * exactly how turning voice mode on mid-session used to speak every already
 * -loaded historical reply at once.
 * @param prevText - the text observed on the previous check (or the value
 *   `text` already had on first mount, for a message that arrived already
 *   -finalized).
 * @param text - the text observed on this check.
 * @returns true only on the absent→present transition.
 */
export function justFinalized(prevText: string | undefined, text: string | undefined): boolean {
  return prevText === undefined && text !== undefined
}
