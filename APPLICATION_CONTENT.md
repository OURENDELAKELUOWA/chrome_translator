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

**LinguaBridge: An AI-powered Chrome extension that translates any webpage and adds bilingual subtitles to online course videos — making 75% of the internet accessible to non-English speakers.**

---

## What have you built? / Describe your extension

LinguaBridge is a production-ready Chrome extension (Manifest V3) that solves two problems no existing tool handles well:

1. **Webpage translation that actually works on modern web apps** — Unlike Google Translate which breaks on SPAs and ignores Shadow DOM, LinguaBridge uses a custom MutationObserver architecture with anti-flicker technology to translate React/Vue/Angular apps seamlessly. It traverses Shadow DOM boundaries, groups split-sentence HTML for context-aware translation, and maintains hover tooltips to show original text.

2. **Bilingual video subtitles for online courses** — No Chrome extension currently offers real-time bilingual subtitle translation for Video.js and JW Player (used by platforms like Great Learning, Skilljar, and Anthropic Academy). LinguaBridge intercepts caption cues, translates them with surrounding context for coherence, and renders a synchronized bilingual overlay + scrolling transcript panel with export.

The extension already ships with:
- Full-page translation with Shadow DOM penetration
- SPA anti-flicker system (zero re-render flicker on React/Vue)
- Bilingual video subtitle overlay with context-aware translation
- Live transcript panel with bilingual export
- Translation caching, token tracking, auto-translate, domain exclusion
- Right-click context menu translation
- 8 target languages with auto-detection
- Dark mode support

Tech stack: Chrome Extension Manifest V3, Service Worker, MutationObserver, Shadow DOM API, DeepSeek AI API (multi-provider architecture planned).

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

**Phase 2 (Months 1-3): Universal Media Translation**
- YouTube / Vimeo / Bilibili subtitle translation
- Coursera / Udemy / edX course subtitle support
- PDF in-browser translation overlay
- Image OCR + translation
- Multi-provider AI backend (Claude, GPT, Gemini)

**Phase 3 (Months 4-6): Translation Intelligence**
- Translation Memory — learn from corrections, build personal glossary
- Domain-specific terminology packs (Medical, Legal, Engineering)
- Side-by-side bilingual reading mode
- Offline mode with on-device AI models

**Phase 4 (Months 7-12): Monetization**
- Freemium model: free basic translation, Pro for video subtitles + advanced features
- Team glossary management for enterprises
- Translation analytics dashboard

**Revenue potential**: Translation extensions have massive TAM. Immersive Translate (a comparable product) has 1M+ users and charges $10-20/month for Pro. LinguaBridge's video subtitle feature is a unique differentiator with zero direct competition.

---

## Market size / Why this matters

- **3.4B Chrome users** worldwide, 75% are non-English speakers
- **$65B** global language services market, growing to $95B by 2030
- **1.5B** English learners worldwide need bilingual content tools
- **$300B** online education market — students need video subtitle translation
- **73M** remote cross-border workers need daily translation tools

Existing tools (Google Translate extension, DeepL) fail on modern SPAs, completely ignore video subtitles, and lack AI-quality translations. LinguaBridge occupies the whitespace at the intersection of: web translation + video subtitles + frontier AI quality.

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

**What**: LinguaBridge — Chrome extension that translates webpages (including SPAs/Shadow DOM) and adds bilingual subtitles to online course videos using AI.

**Why it's hard**: Custom MutationObserver architecture for SPA anti-flicker, Shadow DOM traversal, video player abstraction layer for subtitle sync — real browser engineering, not an API wrapper.

**Why Zovo**: Chrome-native, high demand, clear monetization (translation extensions charge $10-20/mo Pro), fits Zovo's distribution model. Ready to ship Phase 2 with Claude Code Max.

**Traction**: Production-ready extension with 1,200+ lines of content script, supporting 8 languages, 2 video players, auto-translate, transcript export.

---

## Links to include

- GitHub repository: [your-repo-url]
- Demo video: [record a 2-min demo showing: page translation → hover tooltip → video subtitle translation → transcript panel → export]
- Chrome Web Store: [if published]
