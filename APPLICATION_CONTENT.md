# Zovo Labs Founding Builder — Application Content

> This document contains prepared content for filling out the Zovo Labs application form.
> Copy-paste the relevant sections into the application at https://zovo.one/zovo-labs#apply

---

## Basic Info

- **Name**: Jie Liu
- **GitHub**: [Your GitHub URL]
- **Project**: LinguaBridge — AI-Powered Universal Web Translation Engine
- **Repository**: [Your repo URL]

---

## One-liner / Elevator Pitch

**LinguaBridge: An AI-powered Chrome extension that translates any webpage, adds bilingual subtitles to any video, and turns foreign-language content into downloadable knowledge — any language to any language — making the entire internet a classroom with no language walls.**

---

## What have you built? / Describe your extension

LinguaBridge is a production-ready Chrome extension (Manifest V3) that solves a universal problem: **language barriers on the web are omnidirectional, but every existing tool treats them as one-way — and none of them help you actually learn or keep the knowledge.**

An American engineer watching Chinese AI lectures on Bilibili has no subtitle help. A Japanese student taking English Coursera courses gets no bilingual support. A French researcher reading German papers can't translate without breaking the layout. And when they're done watching or reading, the knowledge disappears — no notes, no vocabulary, no searchable record of what they learned.

LinguaBridge solves this with three core capabilities:

1. **Webpage translation that actually works on modern web apps (any language → any language)** — Unlike Google Translate which breaks on SPAs and ignores Shadow DOM, LinguaBridge uses a custom MutationObserver architecture with anti-flicker technology to translate React/Vue/Angular apps seamlessly. Works for Chinese→English, English→Japanese, Spanish→Korean — every direction. It traverses Shadow DOM boundaries, groups split-sentence HTML for context-aware translation, and maintains hover tooltips to show original text.

2. **Bilingual video subtitles (any language → any language)** — No Chrome extension currently offers real-time bilingual subtitle translation for Video.js and JW Player (used by platforms like Great Learning, Skilljar, and Anthropic Academy). LinguaBridge intercepts caption cues, translates them with surrounding context for coherence, and renders a synchronized bilingual overlay + scrolling transcript panel with export. Phase 2 extends this to YouTube, Bilibili, Niconico, and all major video platforms worldwide.

3. **Knowledge capture & language learning** — LinguaBridge isn't just for instant translation. The bilingual transcript panel turns hours of video content into structured, downloadable text with timestamps and course metadata — one click and your video course becomes searchable study notes. Hover-to-learn tooltips help users build vocabulary in context. The bilingual output format means users absorb new language naturally while consuming content they actually care about. Phase 3 adds vocabulary building, spaced repetition export (Anki/Quizlet), and one-click export to Notion/Obsidian.

The extension already ships with:
- Full-page translation with Shadow DOM penetration — any language to any language
- SPA anti-flicker system (zero re-render flicker on React/Vue/Angular)
- Bilingual video subtitle overlay with context-aware translation
- Live transcript panel with bilingual export (video → knowledge, one click)
- Hover-to-learn: see original text on hover, building vocabulary in context
- Translation caching, token tracking, auto-translate, domain exclusion
- Right-click context menu translation
- 8 target languages with auto-detection (expanding to 50+ in Phase 2)
- Dark mode support

Tech stack: Chrome Extension Manifest V3, Service Worker, MutationObserver, Shadow DOM API, DeepSeek AI API (multi-provider architecture planned for Claude, GPT, Gemini).

---

## Why you? / What makes you the right builder?

I'm a developer who ships. I built LinguaBridge from scratch as a solo project — from the DOM traversal engine to the video subtitle synchronization system. The codebase is production-quality with:

- 1,200+ lines of content script handling complex DOM manipulation
- A novel anti-flicker system for SPA translation (parent-element annotation strategy)
- Shadow DOM recursive traversal that no competing extension implements
- A video subtitle engine that abstracts over multiple player APIs

I didn't just build a wrapper around a translation API. I solved hard browser engineering problems — MutationObserver loops, Shadow DOM boundaries, SPA re-render detection, video cue synchronization — that most developers avoid.

I'm looking for Zovo Labs because I want to:
- Scale LinguaBridge to millions of users through Zovo's distribution
- Use Claude Code Max to accelerate Phase 2 development (YouTube/Coursera subtitles, multi-provider AI, offline mode)
- Be part of a builder community that ships real, useful software

---

## What would you build at Zovo Labs? / Roadmap

**Phase 2 (Months 1-3): Any Video, Any Language**
- YouTube subtitle translation — all language directions (EN↔ZH, EN↔JA, ES↔KO, etc.)
- Bilibili / Niconico / VK Video subtitle translation (Chinese/Japanese/Russian → any language)
- Coursera / Udemy / edX course subtitle support
- PDF in-browser translation overlay
- Image OCR + translation
- Multi-provider AI backend (Claude, GPT, Gemini)
- Expand from 8 to 50+ language pairs

**Phase 3 (Months 4-6): Learning Engine & Knowledge Intelligence**
- Vocabulary builder — auto-collect words from browsing with context sentences
- Spaced repetition export — send vocabulary to Anki / Quizlet for long-term retention
- Video knowledge base — organize transcripts by course/topic, searchable personal library
- AI study notes — auto-summarize video transcripts into key points and study guides
- One-click export to Notion / Obsidian / Google Docs — structured bilingual notes with timestamps
- Translation Memory — learn from corrections, build personal glossary per language pair
- Domain-specific terminology packs (Medical, Legal, Engineering) × multiple languages
- Offline mode with on-device AI models

**Phase 4 (Months 7-12): Global Platform & Monetization**
- Freemium model: free basic translation, Pro for video subtitles + advanced features
- Team glossary management for multinational enterprises
- Translation analytics dashboard with language heatmap
- Regional pricing for global accessibility
- Language community hubs

**Revenue potential**: Translation extensions have massive TAM. Immersive Translate (a comparable product) has 1M+ users and charges $10-20/month for Pro. But Immersive Translate focuses almost entirely on English→Chinese. LinguaBridge's **omnidirectional translation + video subtitle engine** targets ALL language directions — a dramatically larger market with zero direct competition.

---

## Market size / Why this matters

**Language barriers are omnidirectional — not just an "English problem."**

- **3.4B Chrome users** worldwide — virtually ALL of them encounter foreign-language content
- **$65B** global language services market, growing to $95B by 2030
- **2.4B people** regularly consume content in a non-native language
- **900M** cross-border e-commerce shoppers need translated product pages
- **$300B** online education market — students in EVERY country need video subtitle translation
- **73M** remote cross-border workers need daily bidirectional translation
- **340M** Bilibili MAU (Chinese video) — untapped by any English-language translation tool
- **66%** of YouTube content is non-English — unwatched by English speakers due to language barriers

Every existing tool (Google Translate, DeepL, Immersive Translate) treats translation as a one-way street: "help non-English speakers read English." The reality: an American watching Chinese tech talks, a Korean reading Japanese manga, a Brazilian browsing French news — **everyone** needs omnidirectional translation. LinguaBridge is the first tool built for **all directions** with video subtitle support.

---

## How does this fit Zovo Labs?

1. **Chrome extension native** — LinguaBridge is already a fully functional Chrome extension, perfectly aligned with Zovo's Chrome extension ecosystem
2. **High user demand** — Translation is one of the top Chrome extension categories globally
3. **Clear monetization path** — Freemium model with Pro features (video subtitles, advanced AI, team glossary)
4. **Distribution synergy** — Zovo's 3,500+ existing user base and Chrome Web Store SEO provides instant launch advantage
5. **AI-first architecture** — Multi-provider AI pipeline means we can leverage the Claude Code Max subscription to its fullest
6. **Community fit** — Translation is inherently community-driven (glossary sharing, quality voting, terminology packs)

---

## Short version (if character-limited)

**What**: LinguaBridge — Chrome extension that translates any webpage, adds bilingual subtitles to any video, and turns foreign-language content into downloadable knowledge. **Any language to any language** — not just English→other, but Chinese→English, Japanese→Spanish, Korean→French — every direction.

**Three pillars**: (1) Omnidirectional web translation (SPA/Shadow DOM aware), (2) Bilingual video subtitles for any online course/video, (3) Knowledge capture — one-click export of bilingual transcripts as structured study notes.

**Why it's hard**: Custom MutationObserver for SPA anti-flicker, Shadow DOM traversal, video player abstraction for subtitle sync — real browser engineering, not an API wrapper.

**Why now**: 66% of YouTube is non-English. 340M people use Bilibili. Yet no tool supports omnidirectional video subtitles + knowledge capture. Every competitor is English→Chinese only. $65B market, every direction underserved.

**Why Zovo**: Chrome-native, massive TAM (3.4B Chrome users × every language pair), clear monetization ($10-20/mo Pro). Ready to ship Phase 2 with Claude Code Max.

**Traction**: Production-ready, 1,200+ lines content script, 8 languages, 2 video players, auto-translate, bilingual transcript export.

---

## Links to include

- GitHub repository: [your-repo-url]
- Demo video: [record a 2-min demo showing: page translation → hover tooltip → video subtitle translation → transcript panel → export]
- Chrome Web Store: [if published]
