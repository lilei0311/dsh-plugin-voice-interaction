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

import { useEffect, useState, type JSX } from 'react'
import type { AssistantMessageNode, ConversationNode } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { claimAutoRead, isVoiceModeOn, subscribeVoiceMode } from './voice-mode-store.js'

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
  const [voiceMode, setVoiceMode] = useState(() => isVoiceModeOn(sessionId))

  useEffect(() => subscribeVoiceMode(sessionId, () => { setVoiceMode(isVoiceModeOn(sessionId)) }), [sessionId])

  useEffect(() => {
    if (!voiceMode || text === undefined) return
    if (!claimAutoRead(sessionId, messageId)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }, [voiceMode, text, sessionId, messageId])

  if (!('speechSynthesis' in window) || text === undefined) return null

  return (
    <button
      type="button"
      aria-label="Read this reply aloud"
      onClick={() => {
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
      }}
    >
      🔊
    </button>
  )
}
