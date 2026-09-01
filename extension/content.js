// YouTube DOM scraper, yt-navigate-finish observer, and 5s telemetry heartbeat loop.
console.log("YouTube DOM Scraper Content Script Loaded");

let shadowRoot = null;
let isPaused = false;
let snoozeUntil = 0;
let userGoal = "Software Engineering, Programming, Machine Learning";
let activeJobId = "stream_job_default";
let currentVideoId = "";
let dismissedForVideo = false;
let isCurrentlyMisaligned = false;

let lastScoreText = "YBA: Monitoring...";

// Sync settings from chrome.storage.local
function syncSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['isPaused', 'snoozeUntil', 'userGoal', 'activeJobId'], (result) => {
            if (result.isPaused !== undefined) isPaused = result.isPaused === true;
            if (result.snoozeUntil !== undefined) snoozeUntil = Number(result.snoozeUntil) || 0;
            if (result.userGoal) userGoal = result.userGoal;
            if (result.activeJobId) activeJobId = result.activeJobId;
            updateOverlayUIState();
        });
    }
}

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            if (changes.isPaused !== undefined) {
                const wasPaused = isPaused;
                isPaused = changes.isPaused.newValue === true;
                if (wasPaused && !isPaused) {
                    // Instantly trigger telemetry when unpausing
                    setTimeout(sendTelemetry, 200);
                }
            }
            if (changes.snoozeUntil !== undefined) snoozeUntil = Number(changes.snoozeUntil.newValue) || 0;
            if (changes.userGoal !== undefined) userGoal = changes.userGoal.newValue;
            if (changes.activeJobId !== undefined) activeJobId = changes.activeJobId.newValue;
            updateOverlayUIState();
        }
    });
}

function isSnoozed() {
    return snoozeUntil > Date.now();
}

function updateOverlayUIState() {
    if (!shadowRoot) return;
    const badge = shadowRoot.getElementById('yba-badge');
    const toast = shadowRoot.getElementById('yba-toast');
    const btnPause = shadowRoot.getElementById('btn-toast-pause');

    if (badge) {
        if (isPaused) {
            badge.innerText = '⏸️ Monitoring Paused (Click to resume)';
            badge.style.background = 'rgba(217, 119, 6, 0.95)';
            badge.style.borderColor = 'rgba(245, 158, 11, 0.6)';
            badge.style.color = '#ffffff';
        } else if (isSnoozed()) {
            const minsLeft = Math.ceil((snoozeUntil - Date.now()) / 60000);
            badge.innerText = `☕ Break Mode (${minsLeft}m left)`;
            badge.style.background = 'rgba(43, 166, 64, 0.95)';
            badge.style.borderColor = 'rgba(74, 222, 128, 0.6)';
            badge.style.color = '#ffffff';
        } else {
            badge.innerText = lastScoreText || 'YBA: Monitoring...';
            badge.style.background = 'rgba(15, 15, 15, 0.92)';
            badge.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            badge.style.color = '#ffffff';
        }
    }

    if (btnPause) {
        btnPause.innerText = isPaused ? '▶️ Resume' : '⏸️ Pause';
    }

    if (toast && isSnoozed()) {
        toast.style.display = 'none';
    }
}


function initOverlay() {
    if (document.getElementById('yba-overlay-root')) return;
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'yba-overlay-root';
    document.body.appendChild(overlayRoot);

    shadowRoot = overlayRoot.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700;900&display=swap');

        .floating-badge {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999998;
            padding: 8px 16px;
            border-radius: 9999px;
            background: rgba(15, 15, 15, 0.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #ffffff;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-weight: 600;
            font-size: 12px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            user-select: none;
        }

        .floating-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        }

        /* High-fidelity Toast UI Notification */
        .toast-notification {
            position: fixed;
            top: 24px;
            right: 24px;
            width: 350px;
            z-index: 999999;
            background: #ffffff;
            border: 1px solid #dbdbdb;
            border-radius: 16px;
            padding: 16px;
            color: #0f0f0f;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
            display: none;
            flex-direction: column;
            gap: 12px;
            animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .toast-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .toast-title {
            font-size: 14px;
            font-weight: 700;
            color: #e1002d;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .btn-close {
            background: none;
            border: none;
            color: #606060;
            font-size: 14px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 9999px;
            transition: all 0.2s ease;
        }

        .btn-close:hover {
            color: #0f0f0f;
            background: #eeeeee;
        }

        .toast-body {
            font-size: 12px;
            color: #606060;
            line-height: 1.4;
        }

        .toast-msg {
            font-weight: 600;
            color: #0f0f0f;
            background: #f5f5f5;
            padding: 8px 12px;
            border-radius: 12px;
            border: 1px solid #dbdbdb;
            margin-top: 6px;
            word-break: break-word;
        }

        .toast-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 2px;
        }

        .toast-btn {
            flex: 1;
            font-family: inherit;
            font-size: 11px;
            font-weight: 600;
            padding: 8px 12px;
            border-radius: 9999px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toast-btn-primary {
            background: #e1002d;
            color: #ffffff;
        }

        .toast-btn-primary:hover {
            background: #cc0026;
            box-shadow: 0 2px 6px rgba(225, 0, 45, 0.25);
        }

        .toast-btn-primary:active {
            background: #b30000;
            transform: scale(0.98);
        }

        .toast-btn-secondary {
            background: #eeeeee;
            color: #0f0f0f;
            border: 1px solid #dbdbdb;
        }

        .toast-btn-secondary:hover {
            background: #e8e8e8;
            border-color: #c6c6c6;
        }

        .toast-btn-secondary:active {
            background: #dedede;
            transform: scale(0.98);
        }
    `;
    shadowRoot.appendChild(style);

    // Subtle bottom-right floating badge
    const badge = document.createElement('div');
    badge.id = 'yba-badge';
    badge.className = 'floating-badge';
    badge.innerText = 'YBA: Aligning...';
    shadowRoot.appendChild(badge);

    // Non-intrusive Toast UI Notification (pops up ONLY when misaligned)
    const toast = document.createElement('div');
    toast.id = 'yba-toast';
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">⚠️ Video Not Aligned</span>
            <button id="btn-toast-dismiss" class="btn-close" title="Dismiss">✕</button>
        </div>
        <div class="toast-body">
            This video content is off-target from your active target goal:
            <div id="toast-msg" class="toast-msg">Not aligned with goal</div>
        </div>
        <div class="toast-actions">
            <button id="btn-toast-edit" class="toast-btn toast-btn-primary">🎯 Goal</button>
            <button id="btn-toast-pause" class="toast-btn toast-btn-secondary">⏸️ Pause</button>
        </div>
    `;
    shadowRoot.appendChild(toast);

    // Toast button event listeners
    shadowRoot.getElementById('btn-toast-dismiss').addEventListener('click', () => {
        dismissedForVideo = true;
        toast.style.display = 'none';
    });

    shadowRoot.getElementById('btn-toast-edit').addEventListener('click', () => {
        window.open('http://localhost:5173/?action=edit_goal', '_blank');
    });

    shadowRoot.getElementById('btn-toast-pause').addEventListener('click', () => {
        const nextPaused = !isPaused;
        isPaused = nextPaused;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ isPaused: nextPaused });
        }
        updateOverlayUIState();
        if (!nextPaused) {
            sendTelemetry();
            toast.style.display = 'none';
        }
    });


    badge.addEventListener('click', () => {
        if (isPaused) {
            // Clicking badge when paused immediately unpauses monitoring
            isPaused = false;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ isPaused: false });
            }
            updateOverlayUIState();
            sendTelemetry();
            return;
        }

        // When video is aligned (e.g. 100% ALIGNED), do not pop up the warning component
        if (!isCurrentlyMisaligned) {
            return;
        }

        // Toggle toast visibility manually on badge click only when misaligned
        if (toast.style.display === 'flex' || toast.style.display === 'block') {
            toast.style.display = 'none';
        } else {
            dismissedForVideo = false;
            toast.style.display = 'flex';
        }
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCORE_UPDATE') {
        let rawScore = msg.data.alignment_score ?? msg.data.score;
        let score = rawScore !== undefined ? (rawScore <= 1.0 ? rawScore * 100 : rawScore) : 0;
        const classification = msg.data.classification;
        const videoId = msg.data.video_id;

        if (videoId && videoId !== currentVideoId) {
            currentVideoId = videoId;
            dismissedForVideo = false; // Reset dismiss state for new video page
            isCurrentlyMisaligned = false;
        }

        lastScoreText = `YBA: ${Math.round(score)}% (${classification || 'UNKNOWN'})`;

        if (!shadowRoot) return;
        
        const badge = shadowRoot.getElementById('yba-badge');
        if (badge && !isPaused) {
            badge.innerText = lastScoreText;
        }

        const toast = shadowRoot.getElementById('yba-toast');
        if (toast && !isPaused) {
            // ONLY pop up toast if content is NOT aligned (score < 35 or DISTRACTING)
            const isMisaligned = score < 35 || classification === 'DISTRACTING';
            isCurrentlyMisaligned = isMisaligned;
            
            if (isMisaligned && !dismissedForVideo) {
                const toastMsg = shadowRoot.getElementById('toast-msg');
                if (toastMsg) {
                    toastMsg.innerText = `Score: ${Math.round(score)}% — Off-target from "${userGoal}"`;
                }
                toast.style.display = 'flex';
            } else {
                toast.style.display = 'none';
            }
        }
    }
});

syncSettings();
initOverlay();

function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    let videoId = urlParams.get('v');
    if (!videoId) {
        const path = window.location.pathname;
        const match = path.match(/\/(shorts|live|embed)\/([a-zA-Z0-9_-]+)/);
        if (match && match[2]) {
            videoId = match[2];
        }
    }
    return videoId || 'unknown_video';
}

function scrapeDOM() {
    let videoTitle = document.querySelector(
        'h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata, #title h1, yt-formatted-string.style-scope.ytd-watch-metadata, h2.ytd-reel-player-header-renderer'
    )?.innerText || "";

    if (!videoTitle && document.title) {
        const cleaned = document.title.replace(/\s*-\s*YouTube$/, '').trim();
        if (cleaned && cleaned.toLowerCase() !== 'youtube') {
            videoTitle = cleaned;
        }
    }

    const channelName = document.querySelector(
        'ytd-channel-name yt-formatted-string, #channel-name yt-formatted-string, #owner #channel-name, #text.ytd-channel-name, ytd-reel-player-header-renderer #channel-name'
    )?.innerText || "";

    const videoId = getVideoId();
    
    return { 
        job_id: activeJobId,
        video_id: videoId,
        title: videoTitle.trim(), 
        channel_name: channelName.trim(), 
        timestamp: new Date().toISOString(),
        goal_text: userGoal
    };
}


function sendTelemetry() {
    if (isPaused) return; // Skip telemetry when paused
    const data = scrapeDOM();
    if (!data.video_id || data.video_id === 'unknown_video') return; // Don't send telemetry on non-video pages
    chrome.runtime.sendMessage({ type: "TELEMETRY", data });
}

// Immediate trigger on script load (with 800ms debounce for DOM to settle)
setTimeout(sendTelemetry, 800);

// 5s telemetry heartbeat loop
setInterval(sendTelemetry, 5000);

// yt-navigate-finish observer
document.addEventListener('yt-navigate-finish', (event) => {
    console.log("yt-navigate-finish triggered");
    setTimeout(sendTelemetry, 500);
});

