// Real-time bidirectional goal sync between Web Dashboard (localhost:5173) and Chrome Extension.
console.log("[YBA Goal Sync] Dashboard sync content script initialized.");

const GOAL_STORAGE_KEY = 'yba_user_goal';

// 1. Initial sync on page load
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['userGoal'], (result) => {
    const extGoal = result.userGoal;
    const localGoal = localStorage.getItem(GOAL_STORAGE_KEY);

    if (extGoal) {
      if (localGoal !== extGoal) {
        localStorage.setItem(GOAL_STORAGE_KEY, extGoal);
        window.postMessage({ type: 'YBA_GOAL_INITIAL_SYNC', goal: extGoal }, '*');
      }
    } else if (localGoal) {
      chrome.storage.local.set({ userGoal: localGoal });
    }
  });

  // 2. Listen for chrome.storage changes (e.g. goal updated in Extension Popup)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.userGoal) {
      const newGoal = changes.userGoal.newValue;
      if (newGoal) {
        localStorage.setItem(GOAL_STORAGE_KEY, newGoal);
        window.postMessage({ type: 'YBA_GOAL_SYNC', goal: newGoal }, '*');
        console.log("[YBA Goal Sync] Synced goal from Extension to Dashboard:", newGoal);
      }
    }
  });
}

// 3. Listen for window messages from Dashboard React App (e.g. goal updated in Dashboard Modal or active job set)
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.type === 'YBA_GOAL_CHANGED' && event.data.goal) {
    const newGoal = event.data.goal.trim();
    if (!newGoal) return;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['userGoal'], (result) => {
        if (result.userGoal !== newGoal) {
          chrome.storage.local.set({ userGoal: newGoal }, () => {
            console.log("[YBA Goal Sync] Synced goal from Dashboard to Extension storage:", newGoal);
          });
        }
      });
    }
  }

  if (event.data.type === 'YBA_JOB_SYNC' && event.data.jobId) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ activeJobId: event.data.jobId }, () => {
        console.log("[YBA Job Sync] Synced active job ID from Dashboard to Extension storage:", event.data.jobId);
      });
    }
  }
});
