// Regresses "a stale unsubscribe closure (e.g. React StrictMode's double
// cleanup) deletes a newer subscriber's set from the listeners map, silently
// orphaning it" — subscribeVoiceMode used to unconditionally delete the map
// entry once the set it captured was empty, even if a fresher set had
// already replaced it under the same sessionId.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isVoiceModeOn, subscribeVoiceMode, toggleVoiceMode } from '../lib/client/voice-mode-store.js'

test('a repeated stale unsubscribe does not orphan a later subscriber on the same session', () => {
  const sessionId = `s-${Math.random()}`
  let aCalls = 0
  let bCalls = 0

  const unsubA = subscribeVoiceMode(sessionId, () => { aCalls++ })
  unsubA() // A's set is now empty -> map entry for sessionId gets deleted

  const unsubB = subscribeVoiceMode(sessionId, () => { bCalls++ }) // fresh set installed
  unsubA() // stale closure, called again (StrictMode-style double cleanup)

  toggleVoiceMode(sessionId)

  assert.equal(bCalls, 1, 'B must still be notified after a stale unsubscribe repeats')
  assert.equal(aCalls, 0, 'A really is unsubscribed and should not be notified')

  unsubB()
})

test('normal subscribe/unsubscribe/notify still works', () => {
  const sessionId = `s-${Math.random()}`
  let calls = 0
  const unsub = subscribeVoiceMode(sessionId, () => { calls++ })

  assert.equal(isVoiceModeOn(sessionId), false)
  toggleVoiceMode(sessionId)
  assert.equal(isVoiceModeOn(sessionId), true)
  assert.equal(calls, 1)

  unsub()
  toggleVoiceMode(sessionId) // no listeners left; must not throw
  assert.equal(isVoiceModeOn(sessionId), false)
})
