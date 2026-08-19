/**
 * Shared `speechSynthesis` trigger for both the manual read-aloud button and
 * voice mode's automatic playback.
 * @module dsh-plugin-voice-interaction/client/speech-synthesis
 */

/**
 * Cancel anything currently speaking and speak `text`, once the browser's
 * queue has actually cleared. Chrome silently drops a `speak()` call made
 * synchronously right after `cancel()` — deferring one tick is the known
 * workaround; browsers unaffected by the bug still speak correctly with the
 * extra tick.
 * @param text - the plain text to speak.
 */
export function speakReplacing(text: string): void {
  const synth = window.speechSynthesis
  synth.cancel()
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = navigator.language
    synth.speak(utterance)
  }, 0)
}
