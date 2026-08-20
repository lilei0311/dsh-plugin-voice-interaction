/**
 * Per-session "voice mode" on/off flag, shared between the composer's mic
 * control and each finalized assistant message's read-aloud action — two
 * independent slot registrations that need to agree on one boolean without
 * either owning the other. A plain module-scoped map keeps this plugin
 * self-contained instead of reverse-engineering the framework's `defineStore`
 * seat, which this plugin has no verified example of using correctly.
 * @module dsh-plugin-voice-interaction/client/voice-mode-store
 */

type Listener = () => void

const enabled = new Map<string, boolean>()
const listeners = new Map<string, Set<Listener>>()
// Every messageId already auto-read per session, not just the last one —
// otherwise scrolling back to an earlier reply after a later one has spoken
// re-triggers it (a real bug: comparing against only the last claimed id
// only protects the single most recent message).
const autoReadMessages = new Map<string, Set<string>>()

/**
 * Current voice-mode flag for one session.
 * @param sessionId - the session to read.
 * @returns true when voice mode is on; false (the default) otherwise.
 */
export function isVoiceModeOn(sessionId: string): boolean {
  return enabled.get(sessionId) ?? false
}

/**
 * Flip one session's voice-mode flag and notify its subscribers.
 * @param sessionId - the session to update.
 */
export function toggleVoiceMode(sessionId: string): void {
  enabled.set(sessionId, !isVoiceModeOn(sessionId))
  for (const listener of listeners.get(sessionId) ?? []) listener()
}

/**
 * Subscribe to one session's voice-mode flag, `useSyncExternalStore`-shaped.
 * @param sessionId - the session to watch.
 * @param listener - called after the flag changes.
 * @returns an unsubscribe function.
 */
export function subscribeVoiceMode(sessionId: string, listener: Listener): () => void {
  let set = listeners.get(sessionId)
  if (set === undefined) {
    set = new Set()
    listeners.set(sessionId, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
    // Only remove the map entry if it still points at THIS set — a stale
    // unsubscribe closure (React StrictMode's double cleanup, or any other
    // repeated call) must not delete a newer set that already replaced it,
    // which would silently orphan whoever subscribed after us.
    if (set.size === 0 && listeners.get(sessionId) === set) {
      listeners.delete(sessionId)
    }
  }
}

/**
 * Claim one message as auto-read for its session, first-caller-wins.
 * Prevents a re-mounted (e.g. scrolled back into view) read-aloud action
 * from re-speaking a reply voice mode already read once — for every message
 * in the session, not just the latest.
 * @param sessionId - the owning session.
 * @param messageId - the finalized assistant message's stable id.
 * @returns true the first time this exact pair is claimed; false on every later call.
 */
export function claimAutoRead(sessionId: string, messageId: string): boolean {
  let claimed = autoReadMessages.get(sessionId)
  if (claimed === undefined) {
    claimed = new Set()
    autoReadMessages.set(sessionId, claimed)
  }
  if (claimed.has(messageId)) return false
  claimed.add(messageId)
  return true
}
