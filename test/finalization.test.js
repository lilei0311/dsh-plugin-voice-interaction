// Regresses the "voice mode turned on mid-session speaks every already
// -loaded historical reply" bug: `ReadAloudAction`'s auto-read effect used to
// key off "voiceMode is on and text is defined", which fires for every
// already-finalized message the moment voiceMode flips — not just newly
// -finalized ones. Run against the built output, not src/, so this exercises
// exactly what ships: `npm run build && node --test test/`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { justFinalized } from '../lib/client/finalization.js'

test('a message present on first observation (already historical) is not "just finalized"', () => {
  // useRef(text) seeds prevTextRef with the initial text itself, so the
  // first check always compares text against itself.
  assert.equal(justFinalized('已经写好的历史回复', '已经写好的历史回复'), false)
})

test('undefined -> defined is the one transition that counts', () => {
  assert.equal(justFinalized(undefined, '刚说完的这句话'), true)
})

test('defined -> same text (voiceMode toggling, unrelated re-render) does not re-fire', () => {
  assert.equal(justFinalized('第一段', '第一段'), false)
})

test('defined -> different text (message still streaming, growing) does not count as finalization', () => {
  // Growth mid-stream (undefined was never observed) must not trigger a read
  // — only the very first undefined->defined edge should.
  assert.equal(justFinalized('第一段', '第一段 第二段'), false)
})

test('undefined -> undefined (still streaming, no content yet) is not finalization', () => {
  assert.equal(justFinalized(undefined, undefined), false)
})
