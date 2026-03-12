# LinguaBridge — AI-Powered Universal Web Translation Engine

> Break every language barrier on the web. Pages, videos, subtitles — all in your language, instantly.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-brightgreen) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue) ![License](https://img.shields.io/badge/License-MIT-yellow) ![AI Powered](https://img.shields.io/badge/AI-Multi--Provider-purple)

**LinguaBridge** is a Chrome extension that makes the entire web accessible in your native language. Unlike traditional translators that handle only static text, LinguaBridge understands modern web architecture — SPAs, Shadow DOM, dynamic content, and live video subtitles — delivering seamless, context-aware translations powered by frontier AI models.

---

## The Problem

**75% of the internet is inaccessible** to non-English speakers. Existing translation tools break on modern web apps, ignore video content, and produce awkward, context-free translations. Online learners watching English-language courses have zero subtitle support. Knowledge workers browsing foreign-language documentation lose hours to copy-paste translation workflows.

## The Solution

LinguaBridge is a **universal translation layer** that sits between the user and the web:

- **Any webpage** — Fully translated with original layout preserved
- **Any video** — Bilingual subtitles in real-time
- **Any context** — AI understands surrounding content for natural, coherent translations

---

## Core Features

### Intelligent Page Translation
- **Full-page translation** with deep DOM traversal and intelligent text node detection
- **Shadow DOM penetration** — works inside Web Components, custom elements, and complex widget trees
- **SPA-aware rendering** — handles React, Vue, Angular re-renders without flickering (via parent-element annotation with `data-linguabridge-original/translated`)
- **Context-preserving translation** — sends adjacent text segments together so split-sentence HTML (bold, links, spans) translates as coherent prose
- **Hover tooltip** — hover over any translated text to see the original instantly
- **Toggle hotkey** (Alt+Q) — switch between original and translated text globally

### Video Subtitle Translation Engine
- **Bilingual subtitle overlay** — native-language translation displayed below original captions in real-time
- **Context-aware subtitle translation** — sends surrounding subtitle lines as context for more natural, coherent translations
- **Live transcript panel** — synchronized, scrolling bilingual transcript alongside the video
- **Transcript export** — download bilingual subtitles as `.txt` with course metadata
- **Multi-player support** — Video.js (Great Learning / Olympus) and JW Player (Skilljar / Anthropic Academy)

### AI Translation Pipeline
- **Multi-provider architecture** — pluggable AI backend (DeepSeek V3/R1, with architecture ready for Claude, GPT, Gemini)
- **Batch translation** — groups text nodes intelligently for fewer API calls and better context
- **JSON-structured prompts** — ensures consistent, parseable translation output
- **Translation caching** — in-memory cache prevents redundant API calls for repeated content
- **Token usage tracking** — real-time monitoring of API consumption

### Smart Automation
- **Auto-translate on page load** — configurable per-domain whitelist/blacklist
- **Domain exclusion** — one-click toggle to disable translation on specific sites
- **Right-click translation** — select any text and translate via context menu

---

## Supported Platforms

| Platform | Page Translation | Video Subtitles | Notes |
|----------|:---:|:---:|-------|
| Any website | Yes | — | Universal page translation |
| Great Learning (Olympus) | Yes | Yes | Video.js player integration |
| Skilljar (Anthropic Academy) | Yes | Yes | JW Player integration |
| YouTube | Yes | Planned | Phase 2 roadmap |
| Coursera / Udemy | Yes | Planned | Phase 2 roadmap |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension (MV3)                │
├──────────────┬──────────────────┬───────────────────────┤
│  Popup UI    │   Options Page   │   Background Worker   │
│  (popup.*)   │   (options.*)    │   (background.js)     │
│              │                  │   - API gateway       │
│              │                  │   - Port connections   │
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
│  - Multi-provider abstraction (DeepSeek, Claude, GPT)   │
│  - Batch grouping & context injection                    │
│  - JSON-structured response parsing                      │
│  - In-memory translation cache                           │
│  - Token tracking & budget management                    │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Deep Dive

### Why This Is Hard (Technical Moats)

**1. SPA Anti-Flicker System**
Modern SPAs (React, Vue, Angular) constantly re-render DOM nodes. Naive translation approaches cause visible flickering as nodes are destroyed and recreated. LinguaBridge solves this with a **parent-element annotation strategy**: translated state is stored on parent elements (`data-linguabridge-original`, `data-linguabridge-translated`), so when a framework re-renders a child text node, the observer detects the parent's annotation and instantly restores the translation — zero flicker, zero re-translation.

**2. Shadow DOM Traversal**
Many modern web apps use Shadow DOM for encapsulation (custom elements, design systems, embedded widgets). Standard `querySelectorAll` cannot reach inside shadow roots. LinguaBridge implements **recursive shadow root traversal**, discovering and observing text nodes across the entire component tree, including nested shadow boundaries.

**3. Context-Aware Translation Pipeline**
HTML frequently splits logical sentences across multiple elements (`<b>`, `<a>`, `<span>`). Translating each node independently produces grammatically broken output. LinguaBridge groups adjacent text nodes and sends them as a JSON array with explicit instructions for the AI to consider cross-node context, producing translations that read as natural prose when rendered.

**4. Video Subtitle Synchronization**
Video players use different APIs and cue event systems. LinguaBridge abstracts over Video.js and JW Player with a **unified cue observer** that detects active captions, maintains a sliding context window of surrounding subtitles, and renders translated overlays in sync with the video timeline — all without blocking native player controls.

**5. MutationObserver Architecture**
A single global MutationObserver watches the entire document (including dynamically added shadow roots) for new text nodes. A structural check (`[data-linguabridge-ui]`) prevents observer loops from our own UI injections. Debounced batch processing ensures minimal performance impact even on heavy SPAs.

---

## Product Roadmap

### Phase 1: Core Engine (Current — Shipped)
- [x] Full-page translation with Shadow DOM support
- [x] SPA anti-flicker system
- [x] Bilingual video subtitle overlay (Video.js + JW Player)
- [x] Live transcript panel with bilingual export
- [x] Translation caching & token tracking
- [x] Auto-translate with domain exclusion
- [x] Context menu translation for selected text
- [x] 8-language support with auto-detection

### Phase 2: Universal Media Translation (Next)
- [ ] YouTube / Vimeo / Bilibili subtitle translation
- [ ] Coursera / Udemy / edX course subtitle support
- [ ] PDF in-browser translation overlay
- [ ] Image OCR + translation (screenshots, diagrams, infographics)
- [ ] Multi-provider AI backend (Claude, GPT, Gemini, local models)
- [ ] Streaming translation for long documents

### Phase 3: Translation Intelligence
- [ ] Translation Memory — learn from user corrections, build personal glossary
- [ ] Domain-specific terminology packs (Medical, Legal, Engineering, Finance)
- [ ] Side-by-side bilingual reading mode
- [ ] Collaborative translation — community-powered translation improvements
- [ ] Offline mode with on-device models (Chrome Built-in AI / WebLLM)
- [ ] Pronunciation & TTS for translated content

### Phase 4: Platform & Monetization
- [ ] Translation analytics dashboard (pages translated, time saved, languages)
- [ ] Team glossary & terminology management for enterprises
- [ ] API for third-party integrations
- [ ] Cross-browser support (Firefox, Safari, Edge)
- [ ] Freemium model: free basic translation, Pro for video subtitles + advanced AI

---

## Market Opportunity

| Metric | Value |
|--------|-------|
| Global language services market | $65B+ (2025), projected $95B+ by 2030 |
| Chrome users worldwide | 3.4 billion |
| Non-English internet users | 75% of global users |
| English learners worldwide | 1.5 billion |
| Online education market | $300B+ and growing 10% YoY |
| Remote cross-border workers | 73 million and growing |

**The gap**: Existing tools (Google Translate, DeepL) handle static text well but fail on modern web apps, ignore video content entirely, and lack frontier-AI-level translation quality. LinguaBridge targets the intersection of **web translation + video subtitles + AI quality** — a whitespace no existing tool fully occupies.

---

## Installation

### From Source (Developer Mode)

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked** and select the `Chrome translator/` folder
5. Click the extension icon → Settings → enter your AI API Key

### Get an API Key

Visit [platform.deepseek.com](https://platform.deepseek.com/) to create an API key (more providers coming in Phase 2).

---

## Project Structure

```
Chrome translator/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.js        # Service worker — AI API gateway & context menus
├── content.js           # Content script — page translation & subtitle engine
├── content.css          # Subtitle overlay & transcript panel styles
├── popup.html / .js     # Extension popup UI
├── options.html / .js   # Settings — API config & domain management
├── styles.css           # Shared UI styles (dark mode support)
├── utils/
│   └── logger.js        # Structured logging with persistence
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Contributing

Contributions welcome! Fork, branch, commit, PR. See [LICENSE](LICENSE) for terms.

## License

MIT License — Copyright (c) 2026 Jie Liu
