# dsh-plugin-voice-interaction

English | [中文](README.zh.md)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) **client (Web UI)** plugin: speak to fill the composer, and have replies read aloud.

## ⚠️ Verified by typecheck, not by a browser

Unlike a backend `dsh` plugin, this one only does anything inside the assembled React Web UI — a mic, real speech, and an actual browser are outside what a container without a display can run. What *is* verified: `npm run typecheck` and `npm run build` both pass clean against the real published `@deepseek-ai/dsh-client-runtime`, `@deepseek-ai/dsh-client-ui-conversation`, and `@deepseek-ai/dsh-client-ui-slots` packages at `0.1.0-rc.7` — every prop this plugin reads (`inputActions.setDraft`, `useInput`, `useSession`, the `conversation.input.right` and `conversation.chat.assistant-actions` slot contracts) type-checks against the framework's actual declarations, not a guess. What is **not** verified: that it looks and behaves correctly once mounted in a real `dsh web` session with microphone access. See **Manual verification** below before you trust it.

## What it adds

- **Mic → draft, not mic → send.** A 🎙️ button in the composer's tool row (`conversation.input.right`, right before the model seat) starts the browser's `SpeechRecognition`. Transcribed text lands in the draft textarea through `inputActions.setDraft` — the same public write path the framework itself uses — and stops there. You still read it and press Send.
- **Voice mode, opt-in and per-session.** A 🔈/🔊 toggle next to the mic flips one session's "read replies aloud" flag. While on, every newly finalized assistant reply speaks itself once via `speechSynthesis`, no click needed — this is the "close the loop" mode for a hands-mostly-free conversation. While off, replies stay silent by default.
- **A manual 🔊 button on every reply regardless of voice mode**, registered into the same `conversation.chat.assistant-actions` seat Copy and Branch live in — so you can have one reply read back without turning voice mode on for the whole session.

## Install

```sh
npm install dsh-plugin-voice-interaction
```

Add it to your `dsh` Web deployment's plugin composition the same way as any other `packages/client/*` surface plugin — this package ships a `dsh.client` manifest (`inject`, `platform: "web"`) so the Loader discovers its browser half through `exports["./client"]` automatically.

## Manual verification checklist

Run `dsh web` with this plugin composed in, open a session with the Web UI, and check:

1. **Mic button appears** in the composer's tool row, left of the model-select seat. Clicking it prompts for microphone permission (first time) and turns 🔴 while listening.
2. **Speaking fills the draft** — say something, watch the transcript land in the textarea, click Stop (🔴 again), confirm the draft is editable and Send behaves normally.
3. **Voice-mode toggle appears** next to the mic (🔈 by default). Clicking it flips to 🔊.
4. **With voice mode on**, send a message and confirm the assistant's reply is spoken aloud automatically once it finalizes — and only once (scroll it out of view and back in; it should not repeat).
5. **With voice mode off**, confirm replies stay silent, and that the manual 🔊 button next to each reply's Copy button still speaks that one reply on click.
6. **Unsupported browsers**: in a browser without `SpeechRecognition` (e.g. Firefox without a flag), confirm the mic button simply doesn't render rather than erroring; same for `speechSynthesis` and the read-aloud controls.

If any of these don't match, it's a real bug in this plugin — please open an issue with what you saw.

## Known limitations

- **`SpeechRecognition` is Chrome/Safari-only** (as `webkitSpeechRecognition` on Safari); TypeScript's DOM lib doesn't declare it at all, so this plugin ships its own minimal ambient types for the one surface it calls (`src/client/speech-recognition.ts`).
- **Text-to-speech reads the finalized reply's plain text only** — code blocks, markdown syntax, and non-text blocks (images, tool calls) are not specially handled; `speechSynthesis` reads whatever `AssistantMessageNode.blocks` concatenates as `kind: 'text'`.
- **The voice-mode flag and the auto-read dedupe are in-memory, per browser tab** (a plain module-scoped `Map`, not a `dsh` settings-backed store) — refreshing the page resets voice mode to off. Wiring it through the framework's `defineStore` seat, or through `dsh-settings`, is a natural follow-up once this is confirmed working.
- **No language selection for recognition** — it uses `navigator.language`. A model reply in a different language from the browser's locale may transcribe or synthesize oddly.
- **No interim/live transcript preview** — only final recognition results reach the draft, to avoid the textarea flickering mid-sentence.

## Why a plugin, not a `deepseek-harness` PR

Same reasoning as [`dsh-plugin-modality-fallback`](https://github.com/lilei0311/dsh-plugin-modality-fallback): `deepseek-harness`'s `CONTRIBUTING.md` states the project does not accept external pull requests at this stage, and points contributors toward building and sharing plugins instead (the `dsh-plugin` GitHub topic).

## License

MIT
