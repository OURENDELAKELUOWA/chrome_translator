document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('model-select');
    const saveBtn = document.getElementById('btn-save');
    const statusMsg = document.getElementById('status-msg');
    const logViewer = document.getElementById('log-viewer');
    const btnRefreshLogs = document.getElementById('btn-refresh-logs');
    const btnClearLogs = document.getElementById('btn-clear-logs');

    // Load saved settings
    chrome.storage.sync.get(['deepseekApiKey', 'deepseekModel', 'totalTokens'], (items) => {
        if (items.deepseekApiKey) {
            apiKeyInput.value = items.deepseekApiKey;
        }
        if (items.deepseekModel) {
            modelSelect.value = items.deepseekModel;
        }
        if (items.totalTokens !== undefined) {
            document.getElementById('total-tokens-display').textContent = items.totalTokens.toLocaleString();
        } else {
            document.getElementById('total-tokens-display').textContent = '0';
        }

        // Load Excluded Domains
        renderExcludedList(items.excludedDomains || []);
    });

    function renderExcludedList(list) {
        const ul = document.getElementById('excluded-list');
        ul.innerHTML = '';
        if (list.length === 0) {
            ul.innerHTML = '<li class="text-secondary italic">No excluded domains.</li>';
            return;
        }
        list.forEach(domain => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-white p-2 rounded border border-slate-200';

            const span = document.createElement('span');
            span.textContent = domain;

            const btn = document.createElement('button');
            btn.textContent = 'Remove';
            btn.className = 'text-xs text-red-500 hover:text-red-700 font-medium bg-transparent border-none cursor-pointer';
            btn.addEventListener('click', () => {
                removeDomain(domain);
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
        });
    }

    function removeDomain(domainToRemove) {
        chrome.storage.sync.get(['excludedDomains'], (items) => {
            let list = items.excludedDomains || [];
            list = list.filter(d => d !== domainToRemove);
            chrome.storage.sync.set({ excludedDomains: list }, () => {
                renderExcludedList(list);
            });
        });
    }

    // Save settings
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const model = modelSelect.value;
        // ... (existing save logic if you want to keep lines distinct, but this tool replaces blocks. I'll include save logic context)
        if (!apiKey) {
            showStatus('Please enter an API Key.', 'red');
            return;
        }

        chrome.storage.sync.set({
            deepseekApiKey: apiKey,
            deepseekModel: model
        }, () => {
            showStatus('Settings Saved!', '#10b981');
        });
    });

    // Logging Logic
    function loadLogs() {
        chrome.storage.local.get(['logs'], (result) => {
            const logs = result.logs || [];
            if (logs.length === 0) {
                logViewer.value = 'No logs available.';
                return;
            }
            const text = logs.map(l => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`).join('\n');
            logViewer.value = text;
            logViewer.scrollTop = logViewer.scrollHeight; // Scroll to bottom
        });
    }

    if (btnRefreshLogs) {
        btnRefreshLogs.addEventListener('click', loadLogs);
        // Initial load
        loadLogs();
    }

    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', async () => {
            await chrome.storage.local.set({ logs: [] });
            loadLogs();
        });
    }

    function showStatus(msg, color) {
        statusMsg.textContent = msg;
        statusMsg.style.color = color || '#10b981';
        statusMsg.style.opacity = '1';
        setTimeout(() => {
            statusMsg.style.opacity = '0';
        }, 2000);
    }
});
