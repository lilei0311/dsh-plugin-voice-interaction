/**
 * The composer's mic + voice-mode control, registered into the
 * `conversation.input.right` list slot (the tool row's right end, before the
 * send button). Two independent affordances share one seat:
 *
 * - Mic: browser speech recognition fills the draft textarea; the user still
 *   reviews and presses Send themselves — a misheard transcript never goes
 *   out on its own.
 * - Voice mode toggle: flips the per-session flag `ReadAloudAction` (the
 *   `conversation.chat.assistant-actions` registration) watches to decide
 *   whether to auto-speak each newly finalized assistant reply.
 * @module dsh-plugin-voice-interaction/client/VoiceInputControl
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type JSX } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { finalTranscriptsFrom, speechRecognitionConstructor, type SpeechRecognitionLike } from './speech-recognition.js'
import { isVoiceModeOn, subscribeVoiceMode, toggleVoiceMode } from './voice-mode-store.js'
import { appendTranscript } from './compose-draft.js'

export type VoiceInputControlProps = PropsRuntime<'conversation.input.right'>

/**
 * Mic + voice-mode buttons for the composer tool row.
 * @param props - the slot's runtime props: `inputActions.setDraft`, the
 *   session id, and the input machine's `phase` (via `useInput`) to avoid
 *   recording mid-submit.
 */
export function VoiceInputControl({ inputActions, sessionId, useInput }: VoiceInputControlProps): JSX.Element | null {
  const Ctor = speechRecognitionConstructor()
  const phase = useInput(state => state.phase)
  const draft = useInput(state => state.draft)
  const disabled = phase !== 'plain'

  const [listening, setListening] = useState(false)
  const voiceMode = useSyncExternalStore(
    listener => subscribeVoiceMode(sessionId, listener),
    () => isVoiceModeOn(sessionId),
  )
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  // Live draft, readable from inside the recognition callbacks without
  // re-creating them on every keystroke (onMicClick only reads this once,
  // at start(), to capture the base to append onto).
  const draftRef = useRef(draft)
  draftRef.current = draft

  // Stop and drop any in-flight recognition on unmount or session switch.
  useEffect(() => () => { recognitionRef.current?.abort() }, [sessionId])

  const onMicClick = useCallback(() => {
    if (Ctor === undefined) return
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new Ctor()
    recognition.lang = navigator.language
    recognition.continuous = true
    recognition.interimResults = false
    // Whatever the user already typed stays put; recognized speech appends
    // after it rather than replacing it. Captured once here (not re-read on
    // every result) so our own setDraft calls below don't feed back into it.
    const base = draftRef.current
    let transcript = ''
    recognition.onresult = (event) => {
      const pieces = finalTranscriptsFrom(event)
      if (pieces.length === 0) return
      transcript = `${transcript}${transcript === '' ? '' : ' '}${pieces.join(' ')}`
      inputActions.setDraft(appendTranscript(base, transcript))
    }
    recognition.onerror = () => { setListening(false) }
    recognition.onend = () => { setListening(false); recognitionRef.current = null }
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }, [Ctor, listening, inputActions])

  if (Ctor === undefined && !('speechSynthesis' in window)) return null

  return (
    <>
      {Ctor !== undefined && (
        <button
          type="button"
          aria-label={listening ? 'Stop voice input' : 'Voice input'}
          aria-pressed={listening}
          disabled={disabled}
          onClick={onMicClick}
        >
          {listening ? '🔴' : '🎙️'}
        </button>
      )}
      {'speechSynthesis' in window && (
        <button
          type="button"
          aria-label={voiceMode ? 'Turn off voice mode (auto read-aloud)' : 'Turn on voice mode (auto read-aloud)'}
          aria-pressed={voiceMode}
          onClick={() => { toggleVoiceMode(sessionId) }}
        >
          {voiceMode ? '🔊' : '🔈'}
        </button>
      )}
    </>
  )
}
