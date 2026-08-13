// YouTube DOM scraper, yt-navigate-finish observer, and 5s telemetry heartbeat loop.
console.log("YouTube DOM Scraper Content Script Loaded");

let shadowRoot = null;

function initOverlay() {
    if (document.getElementById('yba-overlay-root')) return;
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'yba-overlay-root';
    document.body.appendChild(overlayRoot);

    shadowRoot = overlayRoot.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
        .floating-badge {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            padding: 12px 24px;
            border-radius: 32px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: white;
            font-family: 'Inter', sans-serif;
            font-weight: 900;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        .focus-shield {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(18, 18, 18, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 1000000;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: white;
            font-family: 'Inter', sans-serif;
        }
        .focus-shield-content {
            background: rgba(255, 255, 255, 0.05);
            padding: 40px;
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            max-width: 500px;
        }
        .focus-shield h2 {
            font-weight: 900;
            margin-bottom: 20px;
        }
        .btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 12px 24px;
            border-radius: 32px;
            cursor: pointer;
            margin: 10px;
            font-weight: bold;
            transition: all 0.2s;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `;
    shadowRoot.appendChild(style);

    const badge = document.createElement('div');
    badge.id = 'yba-badge';
    badge.className = 'floating-badge';
    badge.innerText = 'Aligning...';
    shadowRoot.appendChild(badge);

    const shield = document.createElement('div');
    shield.id = 'yba-shield';
    shield.className = 'focus-shield';
    shield.innerHTML = `
        <div class="focus-shield-content">
            <h2>Focus Shield</h2>
            <p>This content appears distracting.</p>
            <div>
                <button class="btn" id="btn-continue">Continue Watching</button>
                <button class="btn" id="btn-return">Return to Goal Recommendations</button>
            </div>
        </div>
    `;
    shadowRoot.appendChild(shield);

    shadowRoot.getElementById('btn-continue').addEventListener('click', () => {
        shield.style.display = 'none';
    });
    shadowRoot.getElementById('btn-return').addEventListener('click', () => {
        window.location.href = '/';
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCORE_UPDATE') {
        const { score, classification } = msg.data;
        if (!shadowRoot) return;
        
        const badge = shadowRoot.getElementById('yba-badge');
        if (badge) {
            badge.innerText = `Score: ${score}% - ${classification}`;
        }

        const shield = shadowRoot.getElementById('yba-shield');
        if (shield) {
            if (score < 35 || classification === 'DISTRACTING') {
                shield.style.display = 'flex';
            } else {
                shield.style.display = 'none';
            }
        }
    }
});

initOverlay();

function scrapeDOM() {
    const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.innerText || "";
    const channelName = document.querySelector('ytd-channel-name yt-formatted-string')?.innerText || "";
    return { videoTitle, channelName, url: window.location.href, timestamp: Date.now() };
}

function sendTelemetry() {
    const data = scrapeDOM();
    chrome.runtime.sendMessage({ type: "TELEMETRY", data });
}

// 5s telemetry heartbeat loop
setInterval(sendTelemetry, 5000);

// yt-navigate-finish observer
document.addEventListener('yt-navigate-finish', (event) => {
    console.log("yt-navigate-finish triggered");
    sendTelemetry();
});
