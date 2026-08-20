/**
 * Pure draft-composition for the mic control, factored out of
 * {@link VoiceInputControl} so it can be unit-tested without a React
 * renderer.
 * @module dsh-plugin-voice-interaction/client/compose-draft
 */

/**
 * Append a recognized-speech transcript onto whatever the user already had
 * in the draft, instead of replacing it outright.
 *
 * `base` is the draft text captured once, at the moment recognition starts —
 * not re-read live — so this function's own output (fed back through
 * `setDraft`) never becomes tomorrow's `base` mid-recognition.
 * @param base - the draft text present when the mic was clicked.
 * @param transcript - the recognized speech accumulated so far (may be empty
 *   before the first result arrives).
 * @returns the composed draft: `base`, then a single separating space only
 *   where one is actually needed, then `transcript`.
 */
export function appendTranscript(base: string, transcript: string): string {
  if (transcript === '') return base
  if (base === '') return transcript
  const needsSpace = !/\s$/.test(base)
  return `${base}${needsSpace ? ' ' : ''}${transcript}`
}
