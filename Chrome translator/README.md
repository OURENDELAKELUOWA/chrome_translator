# DeepSeek Translator | 深度求索翻译

A Chrome extension for high-quality webpage and video subtitle translation, powered by DeepSeek AI.

一款由 DeepSeek AI 驱动的 Chrome 翻译插件，支持网页全文翻译和视频双语字幕。

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-brightgreen) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features | 功能特色

### 🌐 Webpage Translation | 网页翻译
- **Full-page translation** with intelligent text node detection
- **Hover tooltip** showing original text when hovering over translated content
- **Toggle switch** (Alt+Q) to switch between original and translated text
- **Smart SPA support** — handles dynamic content, React/Vue re-renders without flickering
- **Shadow DOM traversal** for complex web components

### 🎬 Video Subtitle Translation | 视频字幕翻译
- **Bilingual subtitle overlay** — Chinese translation displayed below English captions
- **Context-aware translation** — uses surrounding subtitles for more natural translations
- **Live transcript panel** with synchronized highlighting
- **Transcript download** — export bilingual subtitles as `.txt` file with course metadata
- Supports **Video.js** (Great Learning) and **JW Player** (Skilljar/Anthropic Courses)

### 🎯 Supported Platforms | 支持的平台
| Platform | Page Translation | Video Subtitles |
|----------|:---:|:---:|
| Any website | ✅ | — |
| Great Learning (Olympus) | ✅ | ✅ |
| Skilljar (Anthropic Courses) | ✅ | ✅ |

## 📦 Installation | 安装方法

### From Source (Developer Mode)

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this project folder
5. Click the extension icon → enter your **DeepSeek API Key**

### Get a DeepSeek API Key

1. Visit [platform.deepseek.com](https://platform.deepseek.com/)
2. Sign up and create an API key
3. Paste it in the extension's Settings page

## 🗂️ Project Structure | 项目结构

```
Chrome translator/
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker (API calls to DeepSeek)
├── content.js           # Content script (page & subtitle translation)
├── content.css          # Styles for subtitle overlay & transcript panel
├── popup.html / .js     # Extension popup UI
├── options.html / .js   # Settings page
├── styles.css           # Popup & options styling
├── utils/
│   └── logger.js        # Logging utility
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## ⚙️ Configuration | 配置说明

Open the extension Settings page to configure:

| Setting | Description |
|---------|-------------|
| **API Key** | Your DeepSeek API key |
| **Model** | DeepSeek model to use (default: `deepseek-chat`) |
| **Auto-translate** | Automatically translate pages on load |
| **Excluded domains** | Domains to skip auto-translation |

## 🛠️ Development | 开发指南

### Prerequisites
- Google Chrome (or Chromium-based browser)
- A DeepSeek API key

### Making Changes
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the **refresh** button on the extension card
4. Reload the target webpage

### Key Architecture Decisions
- **MutationObserver** for detecting dynamic content changes
- **Parent-element annotation** (`data-deepseek-original/translated`) for anti-flicker on SPA frameworks
- **Structural check** (`[data-deepseek-ui]`) to prevent observer loops
- **Context-aware subtitle translation** — sends surrounding subtitles as context for better coherence

## 🤝 Contributing | 参与贡献

Contributions are welcome! Please:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [DeepSeek AI](https://deepseek.com/) for the translation API
- Built with Chrome Extension Manifest V3
