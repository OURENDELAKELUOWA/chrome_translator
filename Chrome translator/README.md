# LinguaBridge

> Omnidirectional web translation and bilingual video subtitles — any language to any language.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-brightgreen) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

LinguaBridge is a Chrome extension for translating webpages and video subtitles between any languages. It handles modern web architecture (SPAs, Shadow DOM, dynamic content) and provides real-time bilingual subtitle overlays for online course videos — with one-click transcript export for study and reference.

---

## Features

### Page Translation
- Full-page translation with deep DOM traversal and text node detection
- Shadow DOM penetration — works inside Web Components and custom element trees
- SPA-compatible — handles React, Vue, Angular re-renders without flickering
- Context-preserving — groups adjacent text nodes across `<b>`, `<a>`, `<span>` for coherent sentence-level translation
- Hover tooltip — see original text on hover for any translated element
- Toggle hotkey (Alt+Q) — switch between original and translated text globally

### Video Subtitle Translation
- Bilingual subtitle overlay — translated captions rendered below originals in real-time
- Context-aware — sends surrounding subtitle lines as context for natural, coherent translations
- Live transcript panel — synchronized, scrolling bilingual transcript alongside the video
- Transcript export — download bilingual subtitles as `.txt` with timestamps and course metadata
- Supported players: Video.js (Great Learning / Olympus), JW Player (Skilljar / Anthropic Academy)

### Knowledge Capture
- Video → text — turn hours of video content into downloadable, searchable bilingual notes with one click
- Structured export — timestamps, course name, video title included; ready for Notion, Obsidian, or any note-taking workflow
- Bilingual output — every translation preserves both languages, useful for language learners building vocabulary in context

### Translation Engine
- Multi-provider architecture — pluggable AI backend (currently DeepSeek V3/R1; Claude, GPT, Gemini planned)
- Batch translation with intelligent node grouping for fewer API calls and better context
- JSON-structured prompts for consistent, parseable output
- In-memory translation cache to avoid redundant API calls
- Real-time token usage tracking

### Automation
- Auto-translate on page load (configurable)
- Per-domain exclusion list
- Right-click context menu translation for selected text
- 8 target languages with auto-detection

---

## Supported Platforms

| Platform | Page | Subtitles | Notes |
|----------|:---:|:---:|-------|
| Any website | Yes | — | Universal |
| Great Learning (Olympus) | Yes | Yes | Video.js |
| Skilljar (Anthropic Academy) | Yes | Yes | JW Player |
| YouTube | Yes | Planned | |
| Bilibili | Yes | Planned | |
| Coursera / Udemy / edX | Yes | Planned | |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension (MV3)                │
├──────────────┬──────────────────┬───────────────────────┤
│  Popup UI    │   Options Page   │   Background Worker   │
│  (popup.*)   │   (options.*)    │   (background.js)     │
│              │                  │   - API gateway       │
│              │                  │   - Port management   │
│              │                  │   - Context menus     │
├──────────────┴──────────────────┴───────────────────────┤
│                   Content Script Layer                   │
│  ┌─────────────────────┐  ┌───────────────────────────┐ │
│  │  Page Translator     │  │  Subtitle Engine          │ │
│  │  - DOM walker        │  │  - Player detection       │ │
│  │  - Shadow DOM        │  │  - Cue observer           │ │
│  │  - MutationObserver  │  │  - Overlay renderer       │ │
│  │  - Anti-flicker      │  │  - Transcript panel       │ │
│  │  - Tooltip system    │  │  - Context windowing      │ │
│  └─────────────────────┘  └───────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              AI Translation Pipeline                     │
│  - Multi-provider abstraction                            │
│  - Batch grouping & context injection                    │
│  - JSON-structured response parsing                      │
│  - In-memory translation cache                           │
│  - Token tracking & budget management                    │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Design Notes

### SPA Anti-Flicker
Modern SPAs constantly re-render DOM nodes, which causes visible flickering with naive translation approaches. LinguaBridge stores translated state on parent elements (`data-linguabridge-original`, `data-linguabridge-translated`). When a framework re-renders a child text node, the MutationObserver detects the parent's annotation and restores the translation instantly — no flicker, no re-translation.

### Shadow DOM Traversal
Standard `querySelectorAll` cannot reach inside shadow roots. LinguaBridge implements recursive shadow root traversal to discover and observe text nodes across the entire component tree, including nested shadow boundaries.

### Context-Aware Translation
HTML frequently splits sentences across multiple elements (`<b>`, `<a>`, `<span>`). Translating each node independently breaks grammar. LinguaBridge groups adjacent text nodes and sends them as a JSON array with cross-node context, producing translations that read as natural prose.

### Video Subtitle Synchronization
Video players (Video.js, JW Player) use different APIs and cue event systems. LinguaBridge abstracts over them with a unified cue observer that maintains a sliding context window of surrounding subtitles and renders translated overlays in sync with the timeline, without blocking native player controls.

### MutationObserver Design
A single global MutationObserver watches the entire document (including dynamically added shadow roots). A structural check (`[data-linguabridge-ui]`) prevents observer loops from our own UI injections. Debounced batch processing minimizes performance impact on heavy SPAs.

---

## Roadmap

### Shipped
- [x] Full-page translation with Shadow DOM support
- [x] SPA anti-flicker system
- [x] Bilingual video subtitle overlay (Video.js + JW Player)
- [x] Live transcript panel with bilingual export
- [x] Translation caching & token tracking
- [x] Auto-translate with domain exclusion
- [x] Context menu translation
- [x] 8-language support with auto-detection

### Next: Broader Video Platform Support
- [ ] YouTube / Bilibili / Niconico / Vimeo subtitle translation
- [ ] Coursera / Udemy / edX course subtitle support
- [ ] Generic HTML5 video + embedded player support
- [ ] Multi-provider AI backend (Claude, GPT, Gemini, local models)
- [ ] Expand to 50+ language pairs

### Planned: Learning & Intelligence
- [ ] Vocabulary builder — auto-collect words from browsing with context
- [ ] Spaced repetition export (Anki / Quizlet)
- [ ] Video knowledge base — organize transcripts by course/topic
- [ ] AI-powered study note generation from transcripts
- [ ] One-click export to Notion / Obsidian / Google Docs
- [ ] Translation memory with user correction learning
- [ ] Domain-specific terminology packs (medical, legal, engineering)
- [ ] Offline mode with on-device models

### Future
- [ ] Cross-browser support (Firefox, Safari, Edge)
- [ ] PDF in-browser translation
- [ ] Image OCR + translation
- [ ] TTS for translated content
- [ ] Team glossary management
- [ ] API for third-party integrations

---

## Installation

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked** and select the `Chrome translator/` folder
5. Click the extension icon → Settings → enter your API key

Currently supports [DeepSeek API](https://platform.deepseek.com/). More providers coming soon.

---

## Project Structure

```
Chrome translator/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.js        # Service worker — API gateway & context menus
├── content.js           # Content script — page translation & subtitle engine
├── content.css          # Subtitle overlay & transcript panel styles
├── popup.html / .js     # Extension popup UI
├── options.html / .js   # Settings — API config & domain management
├── styles.css           # Shared UI styles
├── utils/
│   └── logger.js        # Structured logging with persistence
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Contributing

Contributions welcome. Fork, branch, commit, PR.

## License

MIT — Copyright (c) 2026 Jie Liu
