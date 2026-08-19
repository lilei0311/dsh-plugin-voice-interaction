/**
 * Minimal ambient typing for the Web Speech API's recognition half
 * (`SpeechRecognition` / the vendor-prefixed `webkitSpeechRecognition`).
 * TypeScript's bundled DOM lib does not declare this API — it never
 * standardized past a Chrome/Safari-only implementation — so this file
 * declares only the surface this plugin actually calls.
 * @module dsh-plugin-voice-interaction/client/speech-recognition
 */

interface SpeechRecognitionResultLike {
  readonly length: number
  [index: number]: { readonly transcript: string }
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
}

/** The subset of the `SpeechRecognition` instance API this plugin uses. */
export interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike
}

/**
 * Resolve the browser's speech-recognition constructor, whichever global it
 * lives under.
 * @returns the constructor, or undefined when the browser has neither global.
 */
export function speechRecognitionConstructor(): SpeechRecognitionConstructorLike | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/**
 * Collect the final (non-interim) transcript pieces from one recognition
 * result event, in result order.
 * @param event - the recognition event carrying the results list.
 * @returns final transcript segments, joined with a single space by the caller.
 */
export function finalTranscriptsFrom(event: SpeechRecognitionEventLike): string[] {
  const pieces: string[] = []
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i] as unknown as { isFinal: boolean, 0: { transcript: string } }
    if (result.isFinal) pieces.push(result[0].transcript)
  }
  return pieces
}
