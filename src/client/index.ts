/**
 * Voice interaction plugin, browser half: registers the composer's mic +
 * voice-mode control into `conversation.input.right`, and the per-reply
 * read-aloud action into `conversation.chat.assistant-actions`. Both ride
 * plain browser APIs (`SpeechRecognition`, `speechSynthesis`) — no backend
 * service, no new session-log vocabulary.
 * @module dsh-plugin-voice-interaction/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { VoiceInputControl } from './VoiceInputControl.js'
import { ReadAloudAction } from './ReadAloudAction.js'

export { VoiceInputControl } from './VoiceInputControl.js'
export { ReadAloudAction } from './ReadAloudAction.js'
export { isVoiceModeOn, subscribeVoiceMode, toggleVoiceMode } from './voice-mode-store.js'

/** Required services: the slot registry alone — no RPC, no store, no locale. */
export const inject = ['slots']

/**
 * Client plugin body: register the two slot entries.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'voice-input',
    order: 0,
  }, VoiceInputControl))

  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
    name: 'conversation.chat.assistant-actions',
    id: 'voice-read-aloud',
    order: 0,
  }, ReadAloudAction))
}
