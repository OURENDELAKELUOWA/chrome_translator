// content.js - Handles page translation with Shadow DOM support

let isTranslating = false;
const processedNodes = new WeakSet();
const translationCache = new Map(); // Cache: "Original Text" -> "Translated Text"
let observer = null;
let debounceTimer = null;

// Guard: check if extension context is still valid (becomes false after extension reload)
function isExtensionValid() {
    try { return !!chrome.runtime.id; } catch (e) { return false; }
}

// Observed Roots (Shadow Roots)
const observedRoots = new WeakSet();
// Global observer instance
let globalObserver = null;

// Feature: Original Text Map & Toggle State
const originalTextMap = new WeakMap(); // Node -> Original String
let isOriginalShown = false;
let tooltipElement = null;

// Feature: Video Subtitle Translation
let subtitleObserver = null;
let subtitleDebounce = null;
let lastSubtitleText = '';
let isInjectingSubtitle = false; // Guard to prevent observer loop

// 1. Listen for messages or check settings on load
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TRANSLATE_PAGE') {
        startTranslation();
    } else if (request.action === 'TOGGLE_TRANSLATION') {
        toggleTranslation();
    }
});

// Check auto-translate setting on load
chrome.storage.sync.get(['autoTranslate', 'excludedDomains'], (items) => {
    const isAuto = items.autoTranslate || false;
    const excluded = items.excludedDomains || [];
    const domain = window.location.hostname;

    if (isAuto && !excluded.includes(domain)) {
        Logger.info('Content', `Auto-translating page: ${domain}`);
        startTranslation();
    }
});

function startTranslation() {
    Logger.info('Content', 'Starting translation process...');

    // Initialize Tooltip
    if (!tooltipElement) {
        createTooltip();
        setupHoverListener();
    }

    // Initialize Global Observer if not exists
    if (!globalObserver) {
        globalObserver = new MutationObserver((mutations) => {
            // Skip mutations caused by our own injected UI
            const hasPageMutation = mutations.some(m =>
                !m.target.closest?.('[data-deepseek-ui]'));
            if (!hasPageMutation) return;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                Logger.info('Content', 'Dynamic content detected, triggering translation.');
                translatePage();
            }, 1000);
        });
    }

    // Observe Light DOM (Body)
    if (!observedRoots.has(document.body)) {
        observeDom(document.body);
        observedRoots.add(document.body);
    }

    // Initial translation
    translatePage();

    // Initialize Video Subtitle Translation
    initSubtitleTranslation();

    // Safety net: periodic scan for untranslated content (handles SPA navigation edge cases)
    setInterval(() => {
        // Stop if extension was reloaded (old content script is orphaned)
        if (!isExtensionValid()) return;
        // Reset stuck isTranslating flag after 30s
        if (isTranslating) return;

        const textNodes = getTextNodes(document.body);
        if (textNodes.length > 0) {
            Logger.info('Content', `Periodic scan found ${textNodes.length} untranslated nodes. Triggering translation.`);
            translatePage();
        }
    }, 5000);
}


// --- UX Features: Hover & Toggle ---

function createTooltip() {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'deepseek-translator-tooltip notranslate';
    tooltipElement.setAttribute('translate', 'no');
    tooltipElement.setAttribute('data-deepseek-ui', 'tooltip');
    document.body.appendChild(tooltipElement);
}

function setupHoverListener() {
    document.addEventListener('mouseover', (e) => {
        if (isOriginalShown) return; // Don't show tooltip if already showing original text

        const target = e.target;
        // Check if target has any child text nodes that we translated
        // Simple heuristic: check the direct text content or finding the specific text node is hard via event.
        // We really want to know if the *mouse* is over a specific *text node*.
        // But mouseover only fires on Elements. 
        // So we look at the element's direct text nodes.

        // Fast check: does this element have any translated nodes?
        let hasTranslatedNode = false;
        let originalText = [];

        for (const node of target.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && originalTextMap.has(node)) {
                hasTranslatedNode = true;
                originalText.push(originalTextMap.get(node));
            }
        }

        // Fallback: check parent data attribute (survives SPA node replacement)
        if (!hasTranslatedNode && target.dataset?.deepseekOriginal) {
            hasTranslatedNode = true;
            originalText.push(target.dataset.deepseekOriginal);
        }

        if (hasTranslatedNode) {
            showTooltip(e, originalText.join(' '));
        }
    }, true);

    document.addEventListener('mouseout', (e) => {
        hideTooltip();
    }, true);

    // Update tooltip position on move
    document.addEventListener('mousemove', (e) => {
        if (tooltipElement.style.opacity === '1') {
            updateTooltipPosition(e);
        }
    }, true);
}

function showTooltip(e, text) {
    if (!tooltipElement) return;
    tooltipElement.textContent = text;
    tooltipElement.classList.add('visible');
    updateTooltipPosition(e);
}

function hideTooltip() {
    if (!tooltipElement) return;
    tooltipElement.classList.remove('visible');
}

function updateTooltipPosition(e) {
    if (!tooltipElement) return;
    const offset = 15;
    let left = e.clientX + offset;
    let top = e.clientY + offset;

    // Boundary check (simple)
    if (left + 300 > window.innerWidth) left = e.clientX - 315;
    if (top + 100 > window.innerHeight) top = e.clientY - 115;

    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
}

function toggleTranslation() {
    isOriginalShown = !isOriginalShown;
    Logger.info('Content', `Toggling translation. Show Original: ${isOriginalShown}`);

    // We need to iterate all known nodes. 
    // Since WeakMap is not iterable, we can't easily find all nodes "we touched".
    // Strategy: We can re-scan the DOM or keep a Set of processed nodes (we have processedNodes!)
    // processedNodes is a WeakSet, also not iterable.

    // CHANGE: We need a way to track all translated nodes for toggling.
    // WeakSet is good for memory but bad for toggling. 
    // But since we want to toggle *visible* page, re-scanning is okay?
    // Scanning the whole DOM to check `processedNodes.has(node)` is expensive?
    // Maybe not. `getTextNodes` does traversal.

    // Alternative: Just traverse the DOM again using our existing walker.
    const allTextNodes = getAllTextNodesForToggle(document.body);

    let count = 0;
    for (const node of allTextNodes) {
        if (originalTextMap.has(node)) {
            const original = originalTextMap.get(node);
            const translated = translationCache.get(original); // Key is original text

            // Wait, translationCache key is "original text".
            // If we are showing original, current value is "Original".
            // If we are showing translated, current value is "Translated".

            if (isOriginalShown) {
                // Restore Original
                if (node.nodeValue !== original) {
                    node.nodeValue = original;
                    count++;
                }
            } else {
                // Restore Translated
                if (translated && node.nodeValue !== translated) {
                    node.nodeValue = translated;
                    count++;
                }
            }
        }
    }
    Logger.info('Content', `Toggled ${count} nodes.`);
}

function getAllTextNodesForToggle(root) {
    // Simplified traversal just to find nodes we care about
    let allNodes = [];
    let stack = [root];

    while (stack.length > 0) {
        let node = stack.pop();
        if (node.shadowRoot) stack.push(node.shadowRoot);
        if (node.nodeType === Node.TEXT_NODE && originalTextMap.has(node)) {
            allNodes.push(node);
        }
        if (node.childNodes) {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                stack.push(node.childNodes[i]);
            }
        }
    }
    return allNodes;
}

// ... (getTextNodes, isCodeLike, isHidden remain similar but need to ensure no duplication)
// Wait, I need to make sure I don't overwrite the helper functions if I'm using replace_file_content carefully. 
// I will target the top section and insert the new logic, then checking `processChunk` modification separately or in same tool call? 
// The tool call `replace_file_content` works on contiguous blocks. 
// I am replacing from `const observedRoots` down to `translatePage`.
// Wait, `processChunk` is further down and needs modification to POPULATE `originalTextMap`.
// So I will split into two edits.

// Edit 1: Top section (Listeners, Init, UX functions)
// Edit 2: processChunk (Populate Map)

function observeDom(targetNode) {
    if (globalObserver) {
        globalObserver.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }
}

async function translatePage() {
    if (isTranslating) return;
    // If we are currently showing original text, DO NOT translate new content or we overwrite it.
    if (isOriginalShown) return;

    // Stop if extension context was invalidated (e.g., extension reloaded)
    if (!isExtensionValid()) return;

    isTranslating = true;

    // Safety timeout: reset isTranslating after 30s in case of errors
    const safetyTimeout = setTimeout(() => {
        if (isTranslating) {
            Logger.warn('Content', 'translatePage safety timeout: resetting isTranslating flag.');
            isTranslating = false;
        }
    }, 30000);


    // Scan for NEW nodes only (Recursive Shadow DOM traversal)
    const textNodes = getTextNodes(document.body);
    if (textNodes.length === 0) {
        Logger.info('Content', 'Scan finished. No new translatable text nodes found.');
        clearTimeout(safetyTimeout);
        isTranslating = false;
        return;
    }

    Logger.info('Content', `Found ${textNodes.length} new text nodes to translate.`);

    // Batching strategy
    // Reduced to 600 to prevent Service Worker timeout
    const MAX_CHUNK_SIZE = 600;
    let currentChunk = [];
    let currentLength = 0;

    // Filter out cached nodes first
    const nodesToFetch = [];

    for (const node of textNodes) {
        const text = node.nodeValue.trim();
        if (!text) continue;
        const parent = node.parentNode;

        // ANTI-FLICKER: Detect SPA framework re-render restoring original text
        // If parent was previously translated and current text matches original,
        // re-apply cached translation instantly (no API call, no observer loop)
        if (parent?.dataset?.deepseekOriginal === text && parent?.dataset?.deepseekTranslated) {
            node.nodeValue = parent.dataset.deepseekTranslated;
            originalTextMap.set(node, text);
            processedNodes.add(node);
            continue;
        }

        if (translationCache.has(text)) {
            // Apply cached translation immediately
            const translated = translationCache.get(text);
            node.nodeValue = translated;
            // Annotate parent for anti-flicker on future re-renders
            if (parent && parent.nodeType === Node.ELEMENT_NODE) {
                parent.dataset.deepseekOriginal = text;
                parent.dataset.deepseekTranslated = translated;
            }
            originalTextMap.set(node, text);
            processedNodes.add(node);
        } else {
            nodesToFetch.push(node);
        }
    }

    if (nodesToFetch.length === 0) {
        clearTimeout(safetyTimeout);
        isTranslating = false;
        return;
    }

    Logger.info('Content', `Processing ${nodesToFetch.length} nodes (others were cached).`);

    for (const node of nodesToFetch) {
        const text = node.nodeValue.trim();
        if (currentLength + text.length > MAX_CHUNK_SIZE) {
            await processChunk(currentChunk);
            currentChunk = [];
            currentLength = 0;
        }

        currentChunk.push(node);
        currentLength += text.length;
    }

    if (currentChunk.length > 0) {
        await processChunk(currentChunk);
    }

    clearTimeout(safetyTimeout);
    isTranslating = false;
}

// Recursive function to get text nodes, traversing Shadow Roots
function getTextNodes(root) {
    let allNodes = [];
    let stack = [root];

    // Ensure we observe the root if it's a ShadowRoot and not yet observed
    if (root instanceof ShadowRoot && !observedRoots.has(root)) {
        observeDom(root);
        observedRoots.add(root);
    }

    while (stack.length > 0) {
        let node = stack.pop();

        // Check if node is missing or invalid
        if (!node) continue;

        // Optimization: If node is Element and hidden, skip it and its children
        if (node.nodeType === Node.ELEMENT_NODE && isHidden(node)) {
            continue;
        }

        // 1. Handle Shadow Root (Dive in!)
        if (node.shadowRoot) {
            stack.push(node.shadowRoot);

            // Attach observer to this new shadow root
            if (!observedRoots.has(node.shadowRoot)) {
                observeDom(node.shadowRoot);
                observedRoots.add(node.shadowRoot);
            }
        }

        // 2. Handle Text Nodes
        if (node.nodeType === Node.TEXT_NODE) {
            // Safe parent check
            const parent = node.parentNode;
            if (!parent) continue;

            // Filter logic
            // Note: We already pruned hidden trees above, so checking parentNode hidden again is redundant but safe.
            // However, parentNode could be ShadowRoot (DocumentFragment), which isHidden now handles.
            if (!processedNodes.has(node) &&
                !isCodeLike(parent) && // NEW: Smart Code Detection
                !isOwnUI(parent) && // Exclude ALL our injected UI elements
                !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(parent.tagName) &&
                node.nodeValue.trim().length >= 2) {

                // Double check visibility of parent just in case (safe version)
                if (!isHidden(parent)) {
                    allNodes.push(node);
                    // Note: processedNodes.add() is done in processChunk AFTER successful translation
                }
            }
        }

        // 3. Handle Element/Root Children
        if (node.childNodes && node.childNodes.length > 0) {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                stack.push(node.childNodes[i]);
            }
        }
    }

    return allNodes;
}

// Check if element looks like code (Monospace, class names, tags)
function isCodeLike(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    // 1. Explicit Tags
    if (['CODE', 'PRE', 'SAMP', 'VAR', 'KBD'].includes(el.tagName)) return true;

    // 2. Class Name Heuristics
    // Use try-catch for className access just in case
    try {
        const cls = el.className;
        if (typeof cls === 'string' && /code|token|syntax|highlight|linenums|hljs|cm-|mr-/i.test(cls)) {
            return true;
        }
    } catch (e) { }

    // 3. Computed Style (Monospace font is the strongest signal)
    try {
        const style = window.getComputedStyle(el);
        const fontFamily = style.fontFamily || '';
        if (/monospace|courier|consolas|menlo|monaco|source code pro|fira code/i.test(fontFamily)) {
            return true;
        }
    } catch (e) { }

    return false;
}

// Check if element is inside any of our injected UI (should not be page-translated)
function isOwnUI(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    return !!el.closest('[data-deepseek-ui], .vjs-text-track-cue, .vjs-text-track-display, .jw-text-track-cue, .jw-text-track-display');
}

function isHidden(el) {
    if (!el) return true;

    // Handle ShadowRoot (DocumentFragment) -> check host
    if (el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        if (el.host) return isHidden(el.host);
        return false;
    }

    // Must be ELEMENT
    if (el.nodeType !== Node.ELEMENT_NODE) return false;

    try {
        const style = window.getComputedStyle(el);
        return (style.display === 'none' || style.visibility === 'hidden');
    } catch (e) {
        return false; // Fail safe
    }
}

async function processChunk(nodes, retryCount = 0) {
    // Stop if extension context invalidated
    if (!isExtensionValid()) return;

    // Extract text
    const texts = nodes.map(n => n.nodeValue.trim());

    // Retrieve Key
    let storage;
    try {
        storage = await chrome.storage.sync.get(['deepseekApiKey', 'deepseekModel']);
    } catch (e) {
        Logger.warn('Content', `Cannot access storage: ${e.message}`);
        return;
    }
    if (!storage.deepseekApiKey) return;

    try {
        const inputJson = JSON.stringify(texts);

        // Send to background using Long-lived Port (connect) to prevent "Channel closed" errors
        const response = await new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: 'deepseek_translation_worker' });

            // Send request
            port.postMessage({
                action: 'CALL_API',
                data: {
                    textJson: inputJson,
                    apiKey: storage.deepseekApiKey,
                    model: storage.deepseekModel
                }
            });

            // Listen for response
            port.onMessage.addListener((msg) => {
                resolve(msg);
                port.disconnect(); // Close immediately after success
            });

            // Handle disconnection (error)
            port.onDisconnect.addListener(() => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    reject(new Error("Connection to background worker lost."));
                }
            });
        });

        if (!response.success) {
            // Check for timeout or transient errors to retry
            if (retryCount < 3 && response.error && (response.error.includes('timed out') || response.error.includes('server'))) {
                Logger.warn('Content', `API stuck/timeout. Retrying batch (${retryCount + 1}/3)...`);
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                return processChunk(nodes, retryCount + 1);
            }

            Logger.error('Content', `API Error: ${response.error}`);
            return;
        }

        const data = response.data;
        let content = data.choices[0]?.message?.content;

        if (!content) return;

        // Clean markdown code blocks
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            Logger.error('Content', 'Failed to parse JSON response.');
            return;
        }

        let translatedTexts = null;
        if (result.translations && Array.isArray(result.translations)) {
            translatedTexts = result.translations;
        } else if (Array.isArray(result)) {
            translatedTexts = result;
        }

        if (!translatedTexts) {
            Logger.error('Content', 'JSON response format incorrect.');
            return;
        }

        if (translatedTexts.length !== nodes.length) {
            Logger.warn('Content', `Length mismatch! Expected ${nodes.length}, got ${translatedTexts.length}. Applying safe subset.`);
        }

        // Apply translations
        const applyCount = Math.min(nodes.length, translatedTexts.length);
        for (let i = 0; i < applyCount; i++) {
            const originalText = texts[i];
            const translatedText = translatedTexts[i];

            // Only update if text hasn't drastically changed (simple sanity check)

            // Store original text for hover/toggle features
            if (!originalTextMap.has(nodes[i])) {
                originalTextMap.set(nodes[i], originalText);
            }

            nodes[i].nodeValue = translatedText;
            processedNodes.add(nodes[i]); // ADDED: Mark as processed only on success

            // Annotate parent element for anti-flicker (survives SPA re-renders)
            if (nodes[i].parentNode && nodes[i].parentNode.nodeType === Node.ELEMENT_NODE) {
                nodes[i].parentNode.dataset.deepseekOriginal = originalText;
                nodes[i].parentNode.dataset.deepseekTranslated = translatedText;
            }

            // Update Cache
            translationCache.set(originalText, translatedText);
        }

        Logger.info('Content', `Successfully updated ${applyCount} text nodes.`);

        // Track Usage
        if (data.usage) {
            chrome.storage.sync.get(['totalTokens'], (items) => {
                let total = items.totalTokens || 0;
                total += data.usage.total_tokens;
                chrome.storage.sync.set({ totalTokens: total });
            });
        }
    } catch (e) {
        // Retry logic for connection loss
        if (retryCount < 3 && (e.message.includes('Connection') || e.message.includes('lost'))) {
            Logger.warn('Content', `Connection lost. Retrying batch (${retryCount + 1}/3)...`);
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s
            return processChunk(nodes, retryCount + 1);
        }

        Logger.error('Content', `Batch processing failed: ${e.message}`);
    }
}

// ============================================================
// FEATURE: Video Bilingual Subtitle Translation (Enhanced)
// ============================================================

// Additional state for enhanced subtitle system
let currentVideoElement = null;
let subtitleBodyWatcher = null;
let transcriptPanel = null;
let transcriptBtn = null;
let allCueData = []; // [{startTime, endTime, text, translation}]
let preTranslateInProgress = false;

function initSubtitleTranslation() {
    // Start (or restart) the persistent body watcher
    if (subtitleBodyWatcher) {
        subtitleBodyWatcher.disconnect();
        subtitleBodyWatcher = null;
    }

    // Try to attach to existing player immediately
    tryAttachToVideoPlayer();

    // Persistent watcher: keep scanning for new/replaced video players (SPA navigation)
    subtitleBodyWatcher = new MutationObserver(() => {
        // Check if the current video element is gone or replaced
        const currentDisplay = document.querySelector('.vjs-text-track-display, .jw-text-track-display');
        if (currentDisplay && !subtitleObserver) {
            // New player appeared, attach
            tryAttachToVideoPlayer();
        } else if (!currentDisplay && subtitleObserver) {
            // Player was removed (video changed), reset
            Logger.info('Content', 'Video player removed. Resetting subtitle system for next video.');
            resetSubtitleSystem();
        }
    });

    subtitleBodyWatcher.observe(document.body, { childList: true, subtree: true });

    // Also poll periodically for video changes (catches src changes that don't add/remove DOM)
    setInterval(() => {
        const video = document.querySelector('video');
        if (video && video !== currentVideoElement) {
            Logger.info('Content', 'New video element detected. Re-initializing subtitle system.');
            resetSubtitleSystem();
            tryAttachToVideoPlayer();
        }
    }, 3000);
}

function resetSubtitleSystem() {
    if (subtitleObserver) {
        subtitleObserver.disconnect();
        subtitleObserver = null;
    }
    currentVideoElement = null;
    lastSubtitleText = '';
    allCueData = [];
    preTranslateInProgress = false;

    // Remove transcript UI (will be re-created for new video)
    if (transcriptPanel) { transcriptPanel.remove(); transcriptPanel = null; }
    if (transcriptBtn) { transcriptBtn.remove(); transcriptBtn = null; }
}

function tryAttachToVideoPlayer() {
    const display = document.querySelector('.vjs-text-track-display, .jw-text-track-display');
    if (!display) return;

    const video = document.querySelector('video');
    if (!video) return;

    // Already watching this video
    if (video === currentVideoElement && subtitleObserver) return;

    const playerType = display.classList.contains('jw-text-track-display') ? 'JW Player' : 'Video.js';
    Logger.info('Content', `Attaching to ${playerType} for subtitle translation.`);
    currentVideoElement = video;

    // 1. Attach DOM observer for real-time subtitle injection
    attachSubtitleObserver(display);

    // 2. Try to pre-translate all cues via textTracks API
    attemptPreTranslation(video);

    // 3. Create the transcript panel UI
    createTranscriptPanel(video);
}

function attachSubtitleObserver(container) {
    if (subtitleObserver) subtitleObserver.disconnect();

    subtitleObserver = new MutationObserver((mutations) => {
        // Skip mutations caused by our own UI injection (structural check, not temporal)
        const isOwnMutation = mutations.every(m =>
            m.target.closest?.('[data-deepseek-ui]'));
        if (isOwnMutation) return;

        // Short debounce (20ms) to batch rapid DOM changes but not lose subtitles
        clearTimeout(subtitleDebounce);
        subtitleDebounce = setTimeout(() => {
            handleSubtitleChange(container);
        }, 20);
    });

    subtitleObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true
    });

    handleSubtitleChange(container);
}

function handleSubtitleChange(container) {
    const cueElement = container.querySelector('.vjs-text-track-cue, .jw-text-track-cue');

    // Remove previous overlay — search container and parent (JW Player appends overlay higher)
    const overlayParent = container.closest('.jw-captions, .jw-text-track-container') || container;
    const oldOverlay = overlayParent.querySelector('.deepseek-subtitle-translation');
    if (oldOverlay) oldOverlay.remove();

    if (!cueElement) {
        lastSubtitleText = '';
        return;
    }

    // Get subtitle text — Video.js uses nested div, JW Player has text directly in cue
    const textDiv = cueElement.querySelector('div') || cueElement;

    const currentText = textDiv.textContent.trim();
    if (!currentText || currentText === lastSubtitleText) return;
    lastSubtitleText = currentText;

    // Dynamic transcript building: add to allCueData if not already present at this time
    addToDynamicTranscript(currentText);

    // Highlight in transcript panel
    highlightTranscriptRow(currentText);

    // Cache hit = instant display
    if (translationCache.has(currentText)) {
        injectSubtitleTranslation(cueElement, translationCache.get(currentText));
        return;
    }

    // Cache miss: context-aware API call
    translateSubtitleText(currentText, cueElement);
}

function addToDynamicTranscript(text) {
    const time = currentVideoElement ? currentVideoElement.currentTime : 0;

    // Smart dedup: skip only if SAME text appeared within 2 seconds
    // This allows repeated phrases at different points in the video
    const isDuplicate = allCueData.some(c =>
        c.text === text && Math.abs(c.startTime - time) < 2);
    if (isDuplicate) return;

    const newEntry = {
        startTime: time,
        endTime: time + 5,
        text: text,
        translation: translationCache.get(text) || ''
    };

    // Insert at correct position (sorted by startTime) to handle seeking
    let insertIdx = allCueData.length;
    for (let i = 0; i < allCueData.length; i++) {
        if (allCueData[i].startTime > time) {
            insertIdx = i;
            break;
        }
    }
    allCueData.splice(insertIdx, 0, newEntry);

    // Update transcript panel
    updateTranscriptContent();
}


// ---- Bulk Pre-Translation via textTracks API (with fallback) ----

function attemptPreTranslation(video) {
    if (preTranslateInProgress) return;

    // Strategy 1: Try Video.js player API (more reliable)
    const tryVideoJsApi = () => {
        try {
            const playerId = video.closest('.video-js')?.id;
            if (playerId && window.videojs && window.videojs.players) {
                const player = window.videojs.players[playerId];
                if (player) {
                    const tracks = player.textTracks();
                    for (let i = 0; i < tracks.length; i++) {
                        const track = tracks[i];
                        if (track.cues && track.cues.length > 0) {
                            Logger.info('Content', `Found Video.js text track "${track.label || track.language}" with ${track.cues.length} cues via player API.`);
                            extractAndPreTranslate(track);
                            return true;
                        }
                    }
                }
            }
        } catch (e) {
            Logger.warn('Content', `Video.js API access failed: ${e.message}`);
        }
        return false;
    };

    // Strategy 2: Try native textTracks API
    const tryNativeApi = () => {
        if (!video.textTracks || video.textTracks.length === 0) return false;
        for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            if (track.cues && track.cues.length > 0) {
                Logger.info('Content', `Found native text track "${track.label || track.language}" with ${track.cues.length} cues.`);
                extractAndPreTranslate(track);
                return true;
            }
        }
        return false;
    };

    // Try both strategies immediately
    if (tryVideoJsApi() || tryNativeApi()) return;

    // Poll for a short time (10s max), then fall back to dynamic mode
    Logger.info('Content', 'Text tracks not available yet. Polling for 10s, then switching to dynamic mode...');
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (tryVideoJsApi() || tryNativeApi()) {
            clearInterval(checkInterval);
            return;
        }
        if (attempts >= 10 || !currentVideoElement || currentVideoElement !== video) {
            clearInterval(checkInterval);
            Logger.info('Content', 'Text tracks unavailable. Using dynamic mode: subtitles will be collected and translated as they appear.');
            // Dynamic mode is already active via handleSubtitleChange + addToDynamicTranscript
        }
    }, 1000);
}


async function extractAndPreTranslate(track) {
    if (preTranslateInProgress) return;
    preTranslateInProgress = true;

    const cues = Array.from(track.cues);
    allCueData = cues.map(c => ({
        startTime: c.startTime,
        endTime: c.endTime,
        text: c.text.trim(),
        translation: ''
    }));

    // Collect texts that need translation (skip cached ones)
    const uncachedIndices = [];
    const uncachedTexts = [];

    for (let i = 0; i < allCueData.length; i++) {
        const text = allCueData[i].text;
        if (translationCache.has(text)) {
            allCueData[i].translation = translationCache.get(text);
        } else if (text.length >= 2) {
            uncachedIndices.push(i);
            uncachedTexts.push(text);
        }
    }

    Logger.info('Content', `Pre-translation: ${allCueData.length} total cues, ${uncachedTexts.length} need translation, ${allCueData.length - uncachedTexts.length} cached.`);

    // Batch translate in groups of 15
    const BATCH_SIZE = 15;
    const storage = await chrome.storage.sync.get(['deepseekApiKey', 'deepseekModel']);
    if (!storage.deepseekApiKey) { preTranslateInProgress = false; return; }

    for (let i = 0; i < uncachedTexts.length; i += BATCH_SIZE) {
        const batchTexts = uncachedTexts.slice(i, i + BATCH_SIZE);
        const batchIndices = uncachedIndices.slice(i, i + BATCH_SIZE);

        try {
            const translations = await batchTranslateTexts(batchTexts, storage);
            if (translations) {
                for (let j = 0; j < translations.length && j < batchIndices.length; j++) {
                    const idx = batchIndices[j];
                    allCueData[idx].translation = translations[j];
                    translationCache.set(allCueData[idx].text, translations[j]);
                }
            }

            // Update transcript panel progressively
            updateTranscriptContent();

            const done = Math.min(i + BATCH_SIZE, uncachedTexts.length);
            Logger.info('Content', `Pre-translated ${done}/${uncachedTexts.length} subtitle cues.`);
        } catch (e) {
            Logger.warn('Content', `Pre-translation batch failed: ${e.message}. Continuing with next batch.`);
        }

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < uncachedTexts.length) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    preTranslateInProgress = false;
    Logger.info('Content', 'Pre-translation complete! All subtitles should now display instantly.');
    updateTranscriptContent();

    // Set up cuechange listener for transcript highlighting
    if (track.mode !== 'showing' && track.mode !== 'hidden') {
        track.mode = 'hidden'; // Ensure cues fire events
    }
    track.addEventListener('cuechange', () => {
        if (track.activeCues && track.activeCues.length > 0) {
            const activeText = track.activeCues[0].text.trim();
            highlightTranscriptRow(activeText);
        }
    });
}

async function batchTranslateTexts(texts, storage) {
    const inputJson = JSON.stringify(texts);

    const response = await new Promise((resolve, reject) => {
        const port = chrome.runtime.connect({ name: 'deepseek_translation_worker' });

        port.postMessage({
            action: 'CALL_API',
            data: {
                textJson: inputJson,
                apiKey: storage.deepseekApiKey,
                model: storage.deepseekModel
            }
        });

        port.onMessage.addListener((msg) => {
            resolve(msg);
            port.disconnect();
        });

        port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                reject(new Error("Connection lost."));
            }
        });
    });

    if (!response.success) throw new Error(response.error);

    let content = response.data.choices[0]?.message?.content;
    if (!content) return null;

    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(content);

    let translatedTexts = null;
    if (result.translations && Array.isArray(result.translations)) {
        translatedTexts = result.translations;
    } else if (Array.isArray(result)) {
        translatedTexts = result;
    }

    // Track usage
    if (response.data.usage) {
        chrome.storage.sync.get(['totalTokens'], (items) => {
            let total = items.totalTokens || 0;
            total += response.data.usage.total_tokens;
            chrome.storage.sync.set({ totalTokens: total });
        });
    }

    return translatedTexts;
}

// ---- Subtitle Injection (unchanged core logic with guard) ----

function injectSubtitleTranslation(cueElement, translatedText) {
    isInjectingSubtitle = true;
    // All subtitle injection is marked with data-deepseek-ui for isolation
    try {
        // Find the best container to append the overlay
        // For Video.js: .vjs-text-track-display; For JW Player: .jw-captions or .jw-text-track-container
        const overlayContainer = cueElement.closest('.vjs-text-track-display, .jw-captions, .jw-text-track-container')
            || cueElement.parentElement;

        const existing = overlayContainer?.querySelector('.deepseek-subtitle-translation');
        if (existing) existing.remove();

        const translationDiv = document.createElement('div');
        translationDiv.className = 'deepseek-subtitle-translation notranslate';
        translationDiv.setAttribute('translate', 'no');
        translationDiv.setAttribute('data-deepseek-ui', 'subtitle-overlay');

        const cueStyle = window.getComputedStyle(cueElement);
        const isJwPlayer = !!cueElement.closest('.jw-captions');

        if (isJwPlayer) {
            // JW Player: position below the captions area
            translationDiv.style.cssText = `
                direction: ltr; writing-mode: horizontal-tb; unicode-bidi: plaintext;
                text-align: center; white-space: pre-line;
                position: absolute; left: 0; right: 0; bottom: 0;
                pointer-events: none; z-index: 10;
            `;
        } else {
            // Video.js: original positioning logic
            translationDiv.style.cssText = `
                direction: ltr; writing-mode: horizontal-tb; unicode-bidi: plaintext;
                text-align: center; font: ${cueStyle.font}; white-space: pre-line;
                position: absolute; width: ${cueStyle.width};
                left: ${cueElement.style.left || '0px'}; right: ${cueElement.style.right || '0px'};
            `;
            const cueBottom = parseInt(cueElement.style.bottom) || 0;
            const cueHeight = cueElement.offsetHeight || 26;
            translationDiv.style.bottom = Math.max(cueBottom - cueHeight - 4, 0) + 'px';
        }

        const innerSpan = document.createElement('div');
        innerSpan.style.cssText = `
            color: #FFD700; background-color: rgba(0, 0, 0, 0.75);
            position: relative; display: inline;
            font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 0.9em;
        `;
        innerSpan.textContent = translatedText;

        translationDiv.appendChild(innerSpan);
        overlayContainer.appendChild(translationDiv);
    } finally {
        setTimeout(() => { isInjectingSubtitle = false; }, 50);
    }
}

// ---- Context-aware subtitle translation (includes previous subtitles for coherence) ----

async function translateSubtitleText(text, cueElement) {
    const storage = await chrome.storage.sync.get(['deepseekApiKey', 'deepseekModel']);
    if (!storage.deepseekApiKey) return;

    try {
        // Build context window: include previous 2 subtitles for sentence continuity
        const contextTexts = [];
        const contextIndices = []; // indices in allCueData
        const currentIdx = allCueData.findIndex(c => c.text === text);

        if (currentIdx > 0) {
            // Add up to 2 previous subtitles as context
            for (let i = Math.max(0, currentIdx - 2); i < currentIdx; i++) {
                contextTexts.push(allCueData[i].text);
                contextIndices.push(i);
            }
        }

        // Add the current subtitle
        contextTexts.push(text);

        // Translate the whole batch (previous + current) together
        const translations = await batchTranslateTexts(contextTexts, storage);
        if (!translations || translations.length === 0) return;

        // Apply translations for ALL items in the context window
        for (let i = 0; i < translations.length && i < contextTexts.length; i++) {
            const srcText = contextTexts[i];
            const translated = translations[i];

            // Update cache (may refine previous translations)
            translationCache.set(srcText, translated);

            // Update allCueData entry
            const cueEntry = allCueData.find(c => c.text === srcText);
            if (cueEntry) cueEntry.translation = translated;
        }

        // Update transcript panel with refined translations
        updateTranscriptContent();

        // Inject the current subtitle's translation on screen
        const currentTranslation = translations[translations.length - 1];
        if (lastSubtitleText === text) {
            injectSubtitleTranslation(cueElement, currentTranslation);
        }

        Logger.info('Content', `Subtitle translated with ${contextTexts.length}-cue context: "${text.substring(0, 30)}..."`);
    } catch (e) {
        Logger.warn('Content', `Subtitle translation failed: ${e.message}`);
    }
}

// ============================================================
// FEATURE: Floating Transcript Panel
// ============================================================

function createTranscriptPanel(video) {
    // Remove existing
    if (transcriptBtn) transcriptBtn.remove();
    if (transcriptPanel) transcriptPanel.remove();

    // Find the video container to position relative to
    const videoContainer = video.closest('.video-js, .jwplayer, .video-player, .flex-video') || video.parentElement;
    if (!videoContainer) return;

    // Ensure container is positioned
    const containerStyle = window.getComputedStyle(videoContainer);
    if (containerStyle.position === 'static') {
        videoContainer.style.position = 'relative';
    }

    // --- Toggle Button ---
    transcriptBtn = document.createElement('div');
    transcriptBtn.className = 'deepseek-transcript-btn notranslate';
    transcriptBtn.setAttribute('translate', 'no');
    transcriptBtn.setAttribute('data-deepseek-ui', 'transcript-btn');
    transcriptBtn.innerHTML = '🔤';
    transcriptBtn.title = 'Toggle Bilingual Transcript';
    transcriptBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent JW Player from interpreting click as play/pause
        e.preventDefault();
        if (transcriptPanel) {
            const isVisible = transcriptPanel.style.display !== 'none';
            transcriptPanel.style.display = isVisible ? 'none' : 'flex';
        }
    });
    videoContainer.appendChild(transcriptBtn);

    // --- Panel ---
    transcriptPanel = document.createElement('div');
    transcriptPanel.className = 'deepseek-transcript-panel notranslate';
    transcriptPanel.setAttribute('translate', 'no');
    transcriptPanel.setAttribute('data-deepseek-ui', 'transcript-panel');
    transcriptPanel.style.display = 'none'; // Hidden by default

    // Header
    const header = document.createElement('div');
    header.className = 'deepseek-transcript-header';
    header.innerHTML = `
        <span style="font-weight:600; font-size:14px;">📋 双语字幕 Bilingual Transcript</span>
        <span style="display:flex; align-items:center; gap:8px;">
            <span class="deepseek-transcript-download" style="cursor:pointer; font-size:16px; padding:2px 6px; border-radius:4px; opacity:0.7; transition:opacity 0.2s;" title="Download bilingual transcript">📥</span>
            <span class="deepseek-transcript-close" style="cursor:pointer; font-size:18px; padding:0 4px;">✕</span>
        </span>
    `;
    header.querySelector('.deepseek-transcript-close').addEventListener('click', () => {
        transcriptPanel.style.display = 'none';
    });
    header.querySelector('.deepseek-transcript-download').addEventListener('click', exportTranscript);
    header.querySelector('.deepseek-transcript-download').addEventListener('mouseenter', (e) => { e.target.style.opacity = '1'; });
    header.querySelector('.deepseek-transcript-download').addEventListener('mouseleave', (e) => { e.target.style.opacity = '0.7'; });
    transcriptPanel.appendChild(header);

    // Subtitle status
    const status = document.createElement('div');
    status.className = 'deepseek-transcript-status';
    status.textContent = 'Loading subtitles...';
    transcriptPanel.appendChild(status);

    // Content area
    const content = document.createElement('div');
    content.className = 'deepseek-transcript-content';
    transcriptPanel.appendChild(content);

    // Add to page (after the video container, not inside it)
    videoContainer.parentElement.insertBefore(transcriptPanel, videoContainer.nextSibling);

    // Populate if we already have data
    updateTranscriptContent();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTranscriptContent() {
    if (!transcriptPanel) return;

    const content = transcriptPanel.querySelector('.deepseek-transcript-content');
    const status = transcriptPanel.querySelector('.deepseek-transcript-status');
    if (!content) return;

    if (allCueData.length === 0) {
        if (status) status.textContent = 'Waiting for subtitle track to load...';
        return;
    }

    const translated = allCueData.filter(c => c.translation).length;
    if (status) {
        if (translated === allCueData.length) {
            status.textContent = `✅ All ${allCueData.length} subtitles translated`;
        } else {
            status.textContent = `⏳ Translating... ${translated}/${allCueData.length}`;
        }
    }

    content.innerHTML = '';
    allCueData.forEach((cue, idx) => {
        const row = document.createElement('div');
        row.className = 'deepseek-transcript-row';
        row.dataset.cueText = cue.text;
        row.dataset.cueIndex = idx;

        // Click to seek
        row.addEventListener('click', () => {
            if (currentVideoElement) {
                currentVideoElement.currentTime = cue.startTime;
            }
        });

        row.innerHTML = `
            <div class="deepseek-transcript-time">${formatTime(cue.startTime)}</div>
            <div class="deepseek-transcript-texts">
                <div class="deepseek-transcript-en">${escapeHtml(cue.text)}</div>
                <div class="deepseek-transcript-zh">${cue.translation ? escapeHtml(cue.translation) : '<span style="color:#888;">⏳</span>'}</div>
            </div>
        `;

        content.appendChild(row);
    });
}

function highlightTranscriptRow(text) {
    if (!transcriptPanel) return;

    const rows = transcriptPanel.querySelectorAll('.deepseek-transcript-row');
    rows.forEach(row => {
        if (row.dataset.cueText === text) {
            row.classList.add('deepseek-transcript-active');
            // Auto-scroll into view
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            row.classList.remove('deepseek-transcript-active');
        }
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---- Transcript Export / Download ----

function exportTranscript() {
    if (allCueData.length === 0) {
        Logger.warn('Content', 'No subtitle data to export.');
        return;
    }

    // Extract course info from page (multi-strategy)
    const courseTitle = getCourseTitle();
    const courseSection = getCourseSection();
    const courseUrl = window.location.href;
    const exportTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    // Build file content

    const separator = '═'.repeat(60);
    const thinSep = '─'.repeat(60);
    let lines = [];

    lines.push(separator);
    lines.push('  📋 双语字幕导出 Bilingual Transcript Export');
    lines.push(separator);
    lines.push('');
    lines.push(`  课程名称: ${courseTitle}`);
    if (courseSection) lines.push(`  课程章节: ${courseSection}`);
    lines.push(`  课程链接: ${courseUrl}`);
    lines.push(`  导出时间: ${exportTime}`);
    lines.push(`  字幕总数: ${allCueData.length}`);
    const translatedCount = allCueData.filter(c => c.translation).length;
    lines.push(`  已翻译数: ${translatedCount}/${allCueData.length}`);
    lines.push('');
    lines.push(separator);
    lines.push('');

    allCueData.forEach((cue, idx) => {
        const timeStr = formatTime(cue.startTime);
        const endStr = cue.endTime ? ` → ${formatTime(cue.endTime)}` : '';
        lines.push(`[${timeStr}${endStr}]`);
        lines.push(`EN: ${cue.text}`);
        lines.push(`CN: ${cue.translation || '(未翻译)'}`);
        lines.push('');
    });

    lines.push(thinSep);
    lines.push('Exported by DeepSeek Translator Chrome Extension');
    lines.push(thinSep);

    // Generate filename
    const safeTitle = courseTitle.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${safeTitle}_bilingual_${dateStr}.txt`;

    // Trigger download with BOM for Chinese encoding support
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    Logger.info('Content', `Transcript exported: ${filename}`);
}

// ---- Course Metadata Extraction ----

function getCourseTitle() {
    // Strategy 1: Great Learning - look for the main heading in the content area
    // The page shows "Pre-work" (small) + "1.02 : AI Technology Landscape" (h2)
    const headings = document.querySelectorAll('h1, h2');
    for (const h of headings) {
        const text = h.textContent.trim();
        // Skip very short headings or platform/generic headings
        if (text.length < 3) continue;
        if (/^(great learning|dashboard|activities|courses|community|learning)$/i.test(text)) continue;
        // Skip sidebar headings (usually inside panels/nav)
        const inSidebar = h.closest('nav, [role="navigation"], aside, [class*="sidebar"], [class*="side-panel"]');
        if (inSidebar) continue;
        return text;
    }

    // Strategy 2: Meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
    if (ogTitle && ogTitle.length > 3) return ogTitle;

    // Strategy 3: Document title, cleaned
    const rawTitle = document.title;
    // Remove common suffixes like " | Great Learning", " - Platform Name"
    const cleaned = rawTitle.replace(/\s*[\|–\-]\s*(Great Learning|Olympus|Platform).*$/i, '').trim();
    if (cleaned.length > 3 && cleaned !== rawTitle) return cleaned;

    return rawTitle || 'Unknown Course';
}

function getCourseSection() {
    // Strategy 1: Great Learning breadcrumb-like section
    // Look for small text above the main heading (like "Pre-work" label)
    const breadcrumbs = document.querySelectorAll(
        '.breadcrumb, [class*="breadcrumb"], [class*="section-name"], [class*="module-name"]'
    );
    for (const el of breadcrumbs) {
        const text = el.textContent.trim();
        if (text.length > 2 && text.length < 200) return text;
    }

    // Strategy 2: Great Learning sidebar - module/section title
    // The sidebar shows "Pre-work: Landscape of AI, Generative AI and Agentic AI"
    const sidebarHeadings = document.querySelectorAll(
        '[class*="sidebar"] h3, [class*="sidebar"] h4, [class*="side-panel"] h3, [class*="panel"] [class*="title"]'
    );
    for (const el of sidebarHeadings) {
        const text = el.textContent.trim();
        if (text.length > 5 && !/^(learning|slides|video|assessment)/i.test(text)) return text;
    }

    return '';
}
