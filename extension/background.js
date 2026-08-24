// 20s WebSocket keepalive to ws://localhost:8000/api/v1/sync/ws/live, HTTP POST stream relay, and chrome.storage.session state.

let ws = null;
let keepaliveInterval = null;

function connectWebSocket() {
    ws = new WebSocket("ws://localhost:8000/api/v1/sync/ws/live");

    ws.onopen = () => {
        console.log("WebSocket connected");
        keepaliveInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "KEEPALIVE", timestamp: Date.now() }));
            }
        }, 20000);
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected, retrying in 5s");
        clearInterval(keepaliveInterval);
        setTimeout(connectWebSocket, 5000);
    };
    
    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
    };
}

connectWebSocket();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TELEMETRY") {
        // save state to chrome.storage.session
        chrome.storage.session.set({ lastTelemetry: message.data });
        
        // HTTP POST stream relay
        fetch("http://localhost:8000/api/v1/sync/stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message.data)
        })
        .then(res => res.json())
        .then(data => {
            if (sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "SCORE_UPDATE", data });
            }
        })
        .catch(err => console.error("Relay error", err));
    }
});
