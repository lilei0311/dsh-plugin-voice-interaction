// Regresses "clicking the mic wipes out whatever you'd already typed":
// the mic used to setDraft(transcript) directly, discarding any existing
// draft text instead of appending after it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appendTranscript } from '../lib/client/compose-draft.js'

test('empty draft: transcript becomes the whole draft', () => {
  assert.equal(appendTranscript('', '你好'), '你好')
})

test('non-empty draft without trailing space: one space inserted before the transcript', () => {
  assert.equal(appendTranscript('已经打了一半', '语音接着说'), '已经打了一半 语音接着说')
})

test('draft already ending in whitespace: no double space', () => {
  assert.equal(appendTranscript('已经打了一半 ', '语音接着说'), '已经打了一半 语音接着说')
})

test('draft ending in a newline: no space inserted before the transcript', () => {
  assert.equal(appendTranscript('第一行\n', '第二行'), '第一行\n第二行')
})

test('empty transcript (recognition started, no result yet): draft is untouched', () => {
  assert.equal(appendTranscript('已经打了一半', ''), '已经打了一半')
})

test('empty draft and empty transcript: stays empty', () => {
  assert.equal(appendTranscript('', ''), '')
})
