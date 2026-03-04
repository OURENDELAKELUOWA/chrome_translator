// utils/logger.js

class Logger {
    static async log(message, level = 'INFO', source = 'Unknown') {
        const entry = {
            timestamp: new Date().toISOString(),
            source: source,
            level: level,
            message: typeof message === 'object' ? JSON.stringify(message) : String(message)
        };

        // Console output for immediate debugging
        console.log(`[${source}] [${level}]`, message);

        try {
            // Check if extension context is valid before accessing storage
            if (!chrome.runtime?.id) return;

            // Retrieve existing logs
            const result = await chrome.storage.local.get(['logs']);
            let logs = result.logs || [];

            // Append new log
            logs.push(entry);

            // Limit log size (e.g., keep last 500 entries to save space)
            if (logs.length > 500) {
                logs = logs.slice(-500);
            }

            // Save back
            await chrome.storage.local.set({ logs: logs });
        } catch (e) {
            console.error('Failed to save log:', e);
        }
    }

    static info(source, message) {
        this.log(message, 'INFO', source);
    }

    static warn(source, message) {
        this.log(message, 'WARN', source);
    }

    static error(source, message) {
        this.log(message, 'ERROR', source);
    }

    static async getLogs() {
        const result = await chrome.storage.local.get(['logs']);
        return result.logs || [];
    }

    static async clearLogs() {
        await chrome.storage.local.set({ logs: [] });
    }
}

// Attach to window/global for access in other scripts
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}
