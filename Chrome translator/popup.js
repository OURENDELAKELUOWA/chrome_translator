document.addEventListener('DOMContentLoaded', () => {
    const sourceSelect = document.getElementById('source-lang');
    const targetSelect = document.getElementById('target-lang');
    const inputText = document.getElementById('input-text');
    const translateBtn = document.getElementById('btn-translate');
    const outputText = document.getElementById('output-text'); // This is the container
    const apiKeyAlert = document.getElementById('api-key-alert');
    const btnSettings = document.getElementById('btn-settings');
    const btnCopy = document.getElementById('btn-copy');

    let apiKey = '';
    let model = 'deepseek-chat';

    // Helper: Parse Query Params
    const urlParams = new URLSearchParams(window.location.search);
    const initialText = urlParams.get('text');
    const autoTranslate = urlParams.get('auto');

    if (initialText) {
        inputText.value = initialText;
    }

    // 1. Load Settings & Setup
    chrome.storage.sync.get(['deepseekApiKey', 'deepseekModel', 'sourceLang', 'targetLang'], (items) => {
        if (items.sourceLang) sourceSelect.value = items.sourceLang;

        // Default Target to Chinese
        if (items.targetLang) {
            targetSelect.value = items.targetLang;
        } else {
            targetSelect.value = 'zh';
            chrome.storage.sync.set({ targetLang: 'zh' }); // Persist default immediately
        }

        if (items.deepseekApiKey) {
            apiKey = items.deepseekApiKey;
            // If we have text and auto=true, trigger translation immediately after key load
            if (initialText && autoTranslate === 'true') {
                document.getElementById('btn-translate').click();
            }
        } else {
            apiKeyAlert.style.display = 'flex';
            translateBtn.disabled = true;
            inputText.disabled = true;
        }
        if (items.deepseekModel) {
            model = items.deepseekModel;
        }
    });

    // Save language preferences
    sourceSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ sourceLang: sourceSelect.value });
    });
    targetSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ targetLang: targetSelect.value });
    });

    // Open Settings

    // Open Settings
    btnSettings.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // Auto-Translate Toggle
    const autoToggle = document.getElementById('auto-translate-toggle');
    // Load state
    chrome.storage.sync.get(['autoTranslate'], (items) => {
        autoToggle.checked = items.autoTranslate || false;
    });
    // Save state
    autoToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autoTranslate: autoToggle.checked });
    });

    // 2. Translate Logic
    translateBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) return;
        if (!apiKey) {
            alert('Please set your API Key in settings first.');
            return;
        }

        const sourceLang = sourceSelect.options[sourceSelect.selectedIndex].text;
        const targetLang = targetSelect.options[targetSelect.selectedIndex].text;

        setLoading(true);
        updateOutput(''); // Clear previous

        try {
            const translation = await callDeepSeekAPI(text, sourceLang, targetLang);
            updateOutput(translation);
        } catch (error) {
            console.error('Translation failed:', error);
            updateOutput(`Error: ${error.message || 'Unknown error occurred.'}`);
        } finally {
            setLoading(false);
        }
    });

    // 3. API Call
    async function callDeepSeekAPI(text, source, target) {
        const isAuto = sourceSelect.value === 'auto';

        let systemPrompt = `You are a professional translator. Translate the following text into ${target}.`;
        if (!isAuto) {
            systemPrompt += ` The source language is ${source}.`;
        }
        systemPrompt += " Preserve the original meaning, style, and tone. Do not add any explanations or notes, just provide the translation.";

        const url = 'https://api.deepseek.com/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 1.3 // slightly creative for better fluency, or 0 for strictness? Default is usually fine.
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();

        // Track Token Usage
        if (data.usage) {
            updateTokenUsage(data.usage.total_tokens);
        }

        return data.choices[0]?.message?.content || 'No translation returned.';
    }

    // 4. Input handling (Auto-focus)
    inputText.focus();

    // 5. Helpers
    function updateTokenUsage(newTokens) {
        chrome.storage.sync.get(['totalTokens'], (items) => {
            let total = items.totalTokens || 0;
            if (newTokens) {
                total += newTokens;
                chrome.storage.sync.set({ totalTokens: total });
            }
            const display = document.getElementById('token-usage');
            if (display) {
                display.textContent = `Tokens used: ${total.toLocaleString()}`;
            }
        });
    }

    // Initial load of token usage
    updateTokenUsage(0);

    // Domain Exclusion
    const btnExclude = document.getElementById('btn-exclude-domain');
    if (btnExclude) {
        // Check current tab domain
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    const domain = url.hostname;

                    // Check initial state
                    chrome.storage.sync.get(['excludedDomains'], (items) => {
                        const list = items.excludedDomains || [];
                        updateExcludeButton(list.includes(domain), domain);
                    });

                    // Toggle handler
                    btnExclude.onclick = () => {
                        chrome.storage.sync.get(['excludedDomains'], (items) => {
                            let list = items.excludedDomains || [];
                            const isExcluded = list.includes(domain);

                            if (isExcluded) {
                                // Remove from blacklist
                                list = list.filter(d => d !== domain);
                            } else {
                                // Add to blacklist
                                list.push(domain);
                            }

                            chrome.storage.sync.set({ excludedDomains: list }, () => {
                                updateExcludeButton(!isExcluded, domain);

                                // Auto-reload if we just re-enabled it, so user sees effect immediately
                                // if (isExcluded) chrome.tabs.reload(); // User might lose data, safer to just prompt or let them reload.
                            });
                        });
                    };

                } catch (e) {
                    btnExclude.style.display = 'none';
                }
            } else {
                btnExclude.style.display = 'none';
            }
        });
    }

    function updateExcludeButton(isExcluded, domain) {
        if (isExcluded) {
            btnExclude.textContent = `Resume translating ${domain}`;
            btnExclude.style.color = '#4f46e5'; // Primary color
        } else {
            btnExclude.textContent = `Don't translate ${domain}`;
            btnExclude.style.color = ''; // Default
        }
        btnExclude.disabled = false;
    }

    function setLoading(isLoading) {
        if (isLoading) {
            translateBtn.classList.add('loading');
            translateBtn.disabled = true;
        } else {
            translateBtn.classList.remove('loading');
            translateBtn.disabled = false;
        }
    }

    function updateOutput(text) {
        // preserve the copy button
        const copyBtn = outputText.querySelector('.copy-btn');
        outputText.innerHTML = ''; // Clear text

        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        outputText.appendChild(textSpan);

        if (copyBtn) outputText.appendChild(copyBtn);
    }

    // 6. Copy Functionality
    btnCopy.addEventListener('click', () => {
        const text = outputText.innerText; // Get visible text
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Visual feedback
            const originalIcon = btnCopy.innerHTML;
            btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
                btnCopy.innerHTML = originalIcon;
            }, 1500);
        });
    });
});
