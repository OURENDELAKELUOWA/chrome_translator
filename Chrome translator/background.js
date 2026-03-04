try {
    importScripts('utils/logger.js');
} catch (e) {
    console.error(e);
}

// Create Context Menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "deepseek-translate",
        title: "Translate with DeepSeek / 使用 DeepSeek 翻译",
        contexts: ["selection"]
    });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "deepseek-translate" && info.selectionText) {
        const text = info.selectionText;

        // Open the popup.html in a new small window to act as a "popup"
        // This is a common workaround since you can't programmatically open the extension action popup
        chrome.windows.create({
            url: `popup.html?text=${encodeURIComponent(text)}&auto=true`,
            type: "popup",
            width: 380,
            height: 520
        });
    }
});

// Handle API Calls from Content Script (Long-lived connection to avoid SW termination)
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'deepseek_translation_worker') {
        port.onMessage.addListener((request) => {
            if (request.action === 'CALL_API') {
                Logger.info('Background', `Received persistent connection request via port.`);

                callDeepSeekAPI(request.data)
                    .then(result => {
                        Logger.info('Background', `API Success. Tokens: ${result.usage?.total_tokens}`);
                        port.postMessage({ success: true, data: result });
                    })
                    .catch(error => {
                        Logger.error('Background', `API Failed: ${error.message}`);
                        port.postMessage({ success: false, error: error.message });
                    });
            }
        });
    }
});

async function callDeepSeekAPI(payload) {
    const { textJson, apiKey, model } = payload;

    Logger.info('Background', `Calling DeepSeek API... Model: ${model || 'default'}`);

    const url = 'https://api.deepseek.com/chat/completions';

    // Get stored target language preference (Default to Chinese if not set)
    const storage = await chrome.storage.sync.get(['targetLang']);
    const targetLangCode = storage.targetLang || 'zh';

    // Map codes to names for better prompting
    const langMap = {
        'zh': 'Chinese (Simplified)',
        'en': 'English',
        'ja': 'Japanese',
        'ko': 'Korean',
        'fr': 'French',
        'de': 'German',
        'es': 'Spanish',
        'ru': 'Russian'
    };
    const targetLangName = langMap[targetLangCode] || 'English';

    // Prompt: Translate to User's chosen language. 
    // IMPORTANT: Context-Aware prompts for split sentences.
    const systemPrompt = `You are a professional web translator. 
    You will receive a JSON array of text segments from a webpage. 
    **Crucial Context**: These segments are often parts of a larger sentence split by HTML tags (like bold, links, spans).
    
    Task:
    1. Translate each segment into ${targetLangName}.
    2. Uses the context of adjacent segments to ensure the translation forms coherent, grammatically correct sentences when joined.
    3. Do NOT merge the segments in the output. You must return exactly one translated string for each input string.
    4. Maintain the original tone and technical accuracy.
    
    Return a JSON object: { "translations": ["Trans 1", "Trans 2", ...] } with the exact same length as the input.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout (Strict logic to prevent Chrome killing SW)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: textJson }
                ],
                temperature: 1.1,
                response_format: { type: 'json_object' }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle error
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error ${response.status}: ${err}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('API Timeout (server took > 28s). Try reducing usage or checking connection.');
        }
        throw error;
    }
}
