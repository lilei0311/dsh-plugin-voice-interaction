/**
 * Per-message read-aloud action, registered into the
 * `conversation.chat.assistant-actions` list slot (beside Copy/Branch under
 * each finalized assistant reply). Two ways to trigger `speechSynthesis`:
 *
 * - Manual: the button next to Copy, available regardless of voice mode.
 * - Automatic: while voice mode is on (the composer's toggle), a newly
 *   finalized reply speaks itself once, without the user touching anything —
 *   `claimAutoRead` guards against re-speaking a reply whose action row
 *   remounts (e.g. scrolled back into view).
 * @module dsh-plugin-voice-interaction/client/ReadAloudAction
 */

import { useEffect, useRef, useSyncExternalStore, type JSX } from 'react'
import type { AssistantMessageNode, ConversationNode } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { claimAutoRead, isVoiceModeOn, subscribeVoiceMode } from './voice-mode-store.js'
import { speakReplacing } from './speech-synthesis.js'
import { justFinalized } from './finalization.js'

export type ReadAloudActionProps = PropsRuntime<'conversation.chat.assistant-actions'>

/**
 * Plain text of one finalized assistant message.
 * @param nodes - the session's legacy flat node list.
 * @param messageId - the finalized message's stable id.
 * @returns concatenated text blocks, or undefined when the message isn't in the loaded window.
 */
function textOfMessage(nodes: readonly ConversationNode[], messageId: string): string | undefined {
  const node = nodes.find((candidate): candidate is AssistantMessageNode =>
    candidate.kind === 'assistant' && candidate.messageId === messageId)
  if (node === undefined) return undefined
  const text = node.blocks.flatMap(block => block.kind === 'text' ? [block.text] : []).join('')
  return text.trim() === '' ? undefined : text
}

/**
 * Read-aloud action for one finalized assistant message.
 * @param props - the slot's runtime props: the session snapshot hook and the
 *   owning message's id.
 */
export function ReadAloudAction({ useSession, sessionId, messageId }: ReadAloudActionProps): JSX.Element | null {
  const text = useSession(snapshot => textOfMessage(snapshot.chat.legacy.nodes, messageId))
  const voiceMode = useSyncExternalStore(
    listener => subscribeVoiceMode(sessionId, listener),
    () => isVoiceModeOn(sessionId),
  )

  // `useRef(text)` seeds this with whatever `text` already is on first
  // render — an already-finalized historical message mounts with its text
  // present from the start, so this starts equal to `text` and never reads
  // as a fresh transition below.
  const prevTextRef = useRef<string | undefined>(text)

  useEffect(() => {
    const prevText = prevTextRef.current
    prevTextRef.current = text
    // Without this edge check, `voiceMode` flipping on later — with dozens
    // of already-mounted historical replies sitting on defined text —
    // re-runs this effect for every one of them and speaks them all (last
    // one wins after each speak() cancels the previous, but every message
    // still gets wrongly claimed as "read").
    if (!voiceMode || text === undefined || !justFinalized(prevText, text)) return
    if (!claimAutoRead(sessionId, messageId)) return
    speakReplacing(text)
  }, [voiceMode, text, sessionId, messageId])

  if (!('speechSynthesis' in window) || text === undefined) return null

  return (
    <button
      type="button"
      aria-label="Read this reply aloud"
      onClick={() => { speakReplacing(text) }}
    >
      🔊
    </button>
  )
}
