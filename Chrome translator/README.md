# LinguaBridge — AI-Powered Universal Web Translation Engine

> Break every language barrier on the web. Translate, learn, and capture knowledge — any language to any language.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-brightgreen) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue) ![License](https://img.shields.io/badge/License-MIT-yellow) ![AI Powered](https://img.shields.io/badge/AI-Multi--Provider-purple)

**LinguaBridge** is a Chrome extension that erases language boundaries across the entire web. It's not just a translator — it's a **language learning companion** and **knowledge capture tool**. Unlike traditional translators that handle only static text in one direction, LinguaBridge understands modern web architecture — SPAs, Shadow DOM, dynamic content, and live video subtitles — delivering seamless, context-aware translations **between any languages**, while helping users learn new languages and convert video/web content into organized, downloadable knowledge.

---

## The Problem

**The internet is fragmented by language.** Not just for non-English speakers — for everyone:

- A **Silicon Valley engineer** watching a cutting-edge AI lecture on Bilibili (Chinese) has no subtitle support
- A **Japanese researcher** reading a German medical paper can't translate it without breaking the page layout
- A **Spanish-speaking student** taking a Korean online course gets zero bilingual subtitle help
- A **Chinese developer** browsing Russian Stack Overflow answers loses hours to copy-paste workflows
- An **American investor** monitoring French, Japanese, and Arabic news sites needs real-time page translation

**Language barriers are omnidirectional.** The $65B translation market isn't about English — it's about **7,000+ languages** and the billions of people who need to cross between them daily. Yet existing tools (Google Translate, DeepL) only handle static text, break on modern web apps, completely ignore video content, and treat translation as a one-way English problem.

**And translation is only half the story.** Users don't just want to read foreign content — they want to **learn from it** and **keep the knowledge**. A student watching a 2-hour course in another language has no way to capture the content as searchable, bilingual notes. A language learner browsing foreign websites has no way to build vocabulary in context. The knowledge in foreign-language videos vanishes the moment the browser tab closes.

## The Solution

LinguaBridge is a **universal translation layer** — any language to any language — that sits between the user and the web:

- **Any webpage, any language** — Fully translated with original layout preserved. Chinese→English, English→Japanese, Spanish→Korean — all directions
- **Any video, any language** — Bilingual subtitles in real-time. Watch a Chinese tech talk with English subs, or a French documentary with Japanese subs
- **Any context** — AI understands surrounding content for natural, coherent translations across 50+ language pairs
- **Learn while you browse** — bilingual hover tooltips build vocabulary in context; bilingual transcripts turn video courses into downloadable study notes
- **Knowledge capture** — one-click export of bilingual transcripts with timestamps, turning ephemeral video content into permanent, searchable knowledge

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

### Learning & Knowledge Capture
- **Bilingual reading mode** — original and translated text side by side, ideal for language learners who want to see both versions
- **Video → Knowledge conversion** — bilingual transcripts from any video course, one-click download as structured text, turning hours of video into searchable, storable notes
- **Transcript export with metadata** — download bilingual subtitles as `.txt` with course name, video title, and timestamps — ready for note-taking apps (Notion, Obsidian, etc.)
- **Hover-to-learn** — hover over any translated word/sentence to see the original, building vocabulary in context rather than through flashcards
- **Context-rich bilingual output** — every translation preserves both languages, so users absorb new vocabulary naturally while consuming content they care about

### Smart Automation
- **Auto-translate on page load** — configurable per-domain whitelist/blacklist
- **Domain exclusion** — one-click toggle to disable translation on specific sites
- **Right-click translation** — select any text and translate via context menu

---

## Supported Platforms

| Platform | Page Translation | Video Subtitles | Primary Languages | Notes |
|----------|:---:|:---:|-------|-------|
| Any website | Yes | — | All → All | Universal page translation |
| Great Learning (Olympus) | Yes | Yes | EN → Any | Video.js player integration |
| Skilljar (Anthropic Academy) | Yes | Yes | EN → Any | JW Player integration |
| YouTube | Yes | Planned | All → All | Phase 2 — world's largest video platform |
| Bilibili | Yes | Planned | ZH → Any | Phase 2 — 340M MAU Chinese video platform |
| Niconico | Yes | Planned | JA → Any | Phase 2 — Japanese video platform |
| Coursera / Udemy / edX | Yes | Planned | EN → Any | Phase 2 — online education |
| VK Video | Yes | Planned | RU → Any | Phase 2 — Russian video platform |

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
- [x] Full-page translation with Shadow DOM support (any language → any language)
- [x] SPA anti-flicker system
- [x] Bilingual video subtitle overlay (Video.js + JW Player)
- [x] Live transcript panel with bilingual export
- [x] Translation caching & token tracking
- [x] Auto-translate with domain exclusion
- [x] Context menu translation for selected text
- [x] 8-language support with auto-detection

### Phase 2: Universal Media — Any Video, Any Language (Next)
- [ ] YouTube subtitle translation (English↔Chinese, English↔Japanese, Spanish↔Korean, all directions)
- [ ] Bilibili / Niconico / VK Video subtitle translation (Chinese/Japanese/Russian → any language)
- [ ] Coursera / Udemy / edX course subtitle support
- [ ] Vimeo / Dailymotion / embedded HTML5 video support
- [ ] PDF in-browser translation overlay
- [ ] Image OCR + translation (screenshots, diagrams, infographics)
- [ ] Multi-provider AI backend (Claude, GPT, Gemini, local models)
- [ ] Expand to 50+ language pairs with quality optimization per pair

### Phase 3: Learning Engine & Translation Intelligence
- [ ] **Vocabulary builder** — auto-collect new words encountered during browsing, with context sentences
- [ ] **Spaced repetition integration** — export learned vocabulary to Anki / Quizlet for long-term retention
- [ ] **Video knowledge base** — organize exported transcripts by course/topic, searchable personal library
- [ ] **AI-powered study notes** — auto-summarize video transcripts into key points and study guides
- [ ] **One-click export to Notion / Obsidian / Google Docs** — structured bilingual notes with timestamps
- [ ] Translation Memory — learn from user corrections, build personal glossary per language pair
- [ ] Domain-specific terminology packs (Medical, Legal, Engineering, Finance) × multiple languages
- [ ] Collaborative translation — community-powered improvements for underserved language pairs
- [ ] Offline mode with on-device models (Chrome Built-in AI / WebLLM)
- [ ] Pronunciation & TTS for translated content in 20+ languages

### Phase 4: Global Platform & Monetization
- [ ] Translation analytics dashboard (pages translated, time saved, language heatmap)
- [ ] Team glossary & terminology management for multinational enterprises
- [ ] API for third-party integrations (CMS, LMS, knowledge bases)
- [ ] Cross-browser support (Firefox, Safari, Edge)
- [ ] Freemium model: free basic translation, Pro for video subtitles + advanced AI + priority language pairs
- [ ] Regional pricing for global accessibility (not just USD pricing)
- [ ] Language community hubs — users contribute glossaries for their language pairs

---

## Market Opportunity

**Language barriers are a universal, omnidirectional problem — not an English-only problem.**

| Metric | Value |
|--------|-------|
| Global language services market | $65B+ (2025), projected $95B+ by 2030 |
| Chrome users worldwide | 3.4 billion |
| People who regularly consume content in a non-native language | 2.4 billion+ |
| Cross-border e-commerce shoppers | 900 million+ |
| Online education market | $300B+ and growing 10% YoY |
| Remote cross-border workers | 73 million and growing |
| Bilibili monthly active users (Chinese video) | 340 million |
| Non-English YouTube content | 66% of all videos |

### User Scenarios Across Every Direction

| User | From Language | To Language | Scenario |
|------|:---:|:---:|---------|
| US engineer | Chinese | English | Watching AI lectures on Bilibili |
| Japanese student | English | Japanese | Taking Coursera courses |
| French researcher | German | French | Reading medical journals |
| Korean marketer | Spanish | Korean | Monitoring Latin American social media |
| Brazilian developer | Russian | Portuguese | Browsing Stack Overflow answers |
| Chinese investor | English/Japanese | Chinese | Reading global financial news |
| Arabic journalist | French/English | Arabic | Covering international events |

**The gap**: Every existing tool treats translation as "help non-English speakers read English." The reality is billions of people need **any-to-any** language translation — across webpages AND video content — and no tool does this well on modern web apps. LinguaBridge is the **first truly omnidirectional web translation engine** with video subtitle support.

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
