# dsh-plugin-voice-interaction

[English](README.md) | 中文

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)(`dsh`)**客户端(Web UI)插件**:说话填入输入框,回复自动朗读。

## ⚠️ 只做过类型检查,没有在浏览器里跑过

跟后端插件不一样,这个插件的所有功能都发生在装配好的 React Web UI 里——麦克风、真实语音、真正的浏览器,都是这个没有显示器的容器环境跑不了的东西。**已经验证过的**:`npm run typecheck` 和 `npm run build` 都针对 `0.1.0-rc.7` 版本真实发布的 `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`、`@deepseek-ai/dsh-client-ui-slots` 包跑通过了——这个插件用到的每一个 prop(`inputActions.setDraft`、`useInput`、`useSession`,以及 `conversation.input.right` 和 `conversation.chat.assistant-actions` 两个插槽的类型契约)都是跟框架的真实类型声明对上的,不是瞎编的。**没有验证过的**:挂进真实的 `dsh web` 会话、拿到麦克风权限之后,界面和行为是不是真的对。动手用之前请先看下面的"手动验证清单"。

## 不走任何模型、不走后端、不需要 API key

识别和朗读走的都是浏览器原生的 Web Speech API——从来不经过 `dsh` 自己的模型配置,不经过任何 DeepSeek 模型,也完全不经过 `dsh` 的宿主进程。具体来说:

- **语音转文字**(`SpeechRecognition` / Safari 的 `webkitSpeechRecognition`):Chrome/Edge 下,浏览器会把你的录音发到 **Google 的语音识别服务器**去做转写——这是浏览器厂商自己的实现细节,不受这个插件或者 `dsh` 控制。Safari 较新版本是设备端识别。目前没有设置项可以换成别的引擎(比如 Whisper、Azure Speech,或者自建服务)。
- **文字转语音**(`speechSynthesis`):读的是你操作系统/浏览器自带的语音,完全本地,不联网。

结果就是:这个插件**不消耗 token**,不管当前会话用的是哪个模型,行为都一样;但如果你的部署对"音频离开设备发给第三方(经 Chrome/Edge 发给 Google)"这件事有顾虑,开麦克风之前需要知道这一点。

## 加了什么

- **麦克风转文字填输入框,不是转文字直接发送。** 输入框工具行(`conversation.input.right`,紧挨着模型选择按钮左边)多一个 🎙️ 按钮,点了启动浏览器的 `SpeechRecognition`。识别出的文字通过 `inputActions.setDraft` 写进输入框——跟框架自己用的是同一条公开写入路径——写完就停在那儿,你确认没问题了自己点发送。
- **语音模式,按会话开关,默认关。** 麦克风旁边一个 🔈/🔊 开关,控制"是否自动朗读回复"这个每个会话独立的标志。开着的时候,每条新收到的助手回复一完成就会通过 `speechSynthesis` 自动读一遍,不用你点——这是"闭环"的语音对话模式。关着的时候,回复默认不出声。
- **不管语音模式开没开,每条回复旁边都有一个手动 🔊 按钮**,挂在 Copy、Branch 按钮所在的同一个插槽(`conversation.chat.assistant-actions`)里——想单独听一条回复,不用为此把整个会话切到语音模式。

## 安装

这个包自带 `dsh.bundle` manifest,所以用 `dsh plugin` 一步就能装好并挂进某个 profile——跟 `deepseek-harness` 自己仓库里其他 `packages/client/*` 界面插件的机制完全一样:

```sh
dsh plugin --profile web add dsh-plugin-voice-interaction
# 或者直接从 GitHub 装,不需要发布到 npm:
dsh plugin --profile web add github:lilei0311/dsh-plugin-voice-interaction
```

这会把这个包追加进 profile 的 `dsh.profile.bundles`,并应用 [`cordis.patch.yml`](cordis.patch.yml)——插入的是一个空的宿主端插件行。浏览器那一半是通过这个包自带的 `dsh.client` 清单(`inject`、`platform: "web"`)和 `exports["./client"]` 单独发现的,你这边不需要额外配置。用 `dsh --profile web --dump-config` 可以确认这一行确实生效了。完整的 bundle/profile 机制见 [deepseek-harness 的插件安装教程](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)。

## 手动验证清单

跑 `dsh web`,组合进这个插件,打开一个 Web UI 会话,依次检查:

1. **麦克风按钮出现**在输入框工具行、模型选择按钮左边。点击会弹出麦克风权限请求(第一次),监听中变成 🔴。
2. **说话能填进输入框**——说点什么,看着转写文字出现在文本框里,再点一次(变回 🔴)停止,确认输入框还能正常编辑、发送。
3. **语音模式开关出现**在麦克风旁边,默认 🔈。点一下变成 🔊。
4. **语音模式开着的时候**,发一条消息,确认助手回复一完成就自动读出来了——而且只读一次(滚出可视区域再滚回来,不应该重复朗读)。
5. **语音模式关着的时候**,确认回复默认不出声,但每条回复 Copy 按钮旁边的手动 🔊 按钮点击后仍然能单独朗读那一条。
6. **不支持的浏览器**:在没有 `SpeechRecognition` 的浏览器里(比如没开 flag 的 Firefox),确认麦克风按钮直接不渲染而不是报错;`speechSynthesis` 和朗读按钮同理。

如果哪一条对不上,那就是这个插件的真实 bug——麻烦带上你实际看到的现象开个 issue。

## 已知局限

- **`SpeechRecognition` 只有 Chrome/Safari 支持**(Safari 下是带前缀的 `webkitSpeechRecognition`);TypeScript 的 DOM 类型库根本没有声明这个 API,所以这个插件自己写了一份最小化的环境类型声明(`src/client/speech-recognition.ts`),只覆盖用到的那部分。
- **朗读只读回复的纯文本部分**——代码块、Markdown 语法、非文本内容块(图片、工具调用)都没有特殊处理;`speechSynthesis` 读的是 `AssistantMessageNode.blocks` 里所有 `kind: 'text'` 拼接起来的内容。
- **语音模式开关和"是否已朗读过"的去重状态都是内存态、按浏览器标签页存的**(一个普通的模块级 `Map`,不是接入 `dsh` 设置系统的持久化 store)——刷新页面语音模式会重置成关闭。等功能确认没问题之后,接入框架的 `defineStore` 插槽或者 `dsh-settings` 是自然的后续方向。
- **识别语言不可选**——用的是 `navigator.language`。如果模型回复的语言跟浏览器语言设置不一致,转写或朗读的效果可能不理想。
- **没有实时转写预览**——只有识别出的最终结果才会写进输入框,避免文本框在说话过程中一直闪烁。

## 为什么是插件,而不是提交给 `deepseek-harness` 的 PR

跟 [`dsh-plugin-modality-fallback`](https://github.com/lilei0311/dsh-plugin-modality-fallback) 同样的原因:`deepseek-harness` 的 `CONTRIBUTING.md` 明确说明项目目前不接受外部 Pull Request,官方建议的路径是做成插件分享出来(打上 `dsh-plugin` 这个 GitHub topic)。

## License

MIT
