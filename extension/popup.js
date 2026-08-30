document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const pauseIndicator = document.getElementById('pause-indicator');
  const togglePauseBtn = document.getElementById('toggle-pause-btn');
  const btnIcon = document.getElementById('btn-icon');
  const togglePauseText = document.getElementById('toggle-pause-text');

  const currentGoalDisplay = document.getElementById('current-goal-display');
  const goalInput = document.getElementById('goal-input');
  const saveQuickGoalBtn = document.getElementById('save-quick-goal-btn');
  const presetTags = document.querySelectorAll('.preset-tag');

  const openDashboardGoalBtn = document.getElementById('open-dashboard-goal-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  const DEFAULT_GOAL = "Software Engineering, Programming, Machine Learning";

  // Load stored settings from chrome.storage.local
  chrome.storage.local.get(['isPaused', 'userGoal'], (result) => {
    const isPaused = result.isPaused === true;
    const userGoal = result.userGoal || DEFAULT_GOAL;

    updatePauseStateUI(isPaused);
    updateGoalUI(userGoal);
  });

  function updatePauseStateUI(isPaused) {
    if (isPaused) {
      statusBadge.className = 'badge paused';
      statusText.innerText = 'Paused';

      pauseIndicator.className = 'status-indicator paused';
      pauseIndicator.innerText = 'Monitoring Suspended';

      togglePauseBtn.className = 'btn btn-primary btn-block paused-state';
      btnIcon.innerText = '▶️';
      togglePauseText.innerText = 'Resume Monitoring';
    } else {
      statusBadge.className = 'badge active';
      statusText.innerText = 'Active';

      pauseIndicator.className = 'status-indicator running';
      pauseIndicator.innerText = 'Monitoring Live';

      togglePauseBtn.className = 'btn btn-primary btn-block';
      btnIcon.innerText = '⏸️';
      togglePauseText.innerText = 'Pause Monitoring';
    }
  }

  function updateGoalUI(goal) {
    currentGoalDisplay.innerText = goal;
    goalInput.value = goal;
  }

  // Toggle Pause/Resume handler
  togglePauseBtn.addEventListener('click', () => {
    chrome.storage.local.get(['isPaused'], (result) => {
      const newPausedState = !(result.isPaused === true);
      chrome.storage.local.set({ isPaused: newPausedState }, () => {
        updatePauseStateUI(newPausedState);
      });
    });
  });

  // Save quick goal input handler
  saveQuickGoalBtn.addEventListener('click', () => {
    const newGoal = goalInput.value.trim();
    if (!newGoal) return;

    chrome.storage.local.set({ userGoal: newGoal }, () => {
      updateGoalUI(newGoal);
      saveQuickGoalBtn.innerText = 'Saved!';
      setTimeout(() => {
        saveQuickGoalBtn.innerText = 'Save';
      }, 1500);
    });
  });

  // Preset tag clicks
  presetTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const selectedGoal = tag.getAttribute('data-goal');
      if (selectedGoal) {
        goalInput.value = selectedGoal;
        chrome.storage.local.set({ userGoal: selectedGoal }, () => {
          updateGoalUI(selectedGoal);
        });
      }
    });
  });

  // 1-Click History Sync button
  const syncHistoryBtn = document.getElementById('sync-history-btn');
  const syncHistoryStatus = document.getElementById('sync-history-status');

  if (syncHistoryBtn) {
    syncHistoryBtn.addEventListener('click', () => {
      syncHistoryBtn.innerText = '⏳ Syncing...';
      syncHistoryBtn.disabled = true;
      if (syncHistoryStatus) {
        syncHistoryStatus.style.display = 'block';
        syncHistoryStatus.innerText = 'Searching Chrome history for YouTube videos...';
      }

      chrome.history.search({ text: 'youtube.com/watch', maxResults: 50, startTime: 0 }, (historyItems) => {
        const videoItems = [];
        for (const item of historyItems) {
          if (item.url && item.url.includes('watch?v=')) {
            const urlObj = new URL(item.url);
            const vId = urlObj.searchParams.get('v');
            if (vId) {
              videoItems.push({
                video_id: vId,
                title: item.title || vId,
                timestamp: item.lastVisitTime ? new Date(item.lastVisitTime).toISOString() : new Date().toISOString(),
                goal_text: goalInput.value || DEFAULT_GOAL,
              });
            }
          }
        }

        if (videoItems.length === 0) {
          syncHistoryBtn.innerText = 'No videos found in history';
          syncHistoryBtn.disabled = false;
          if (syncHistoryStatus) syncHistoryStatus.innerText = 'No YouTube watch history found in Chrome.';
          return;
        }

        fetch('http://localhost:8000/api/v1/sync/stream/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: videoItems,
            goal_text: goalInput.value || DEFAULT_GOAL,
            job_id: 'stream_job_default'
          })
        })
        .then(res => res.json())
        .then(data => {
          syncHistoryBtn.innerText = `✅ Synced ${data.ingested_count} videos!`;
          if (syncHistoryStatus) {
            syncHistoryStatus.innerText = `Dashboard populated with ${data.ingested_count} videos.`;
          }
          setTimeout(() => {
            syncHistoryBtn.innerText = '📥 1-Click Chrome History Sync (50 vids)';
            syncHistoryBtn.disabled = false;
          }, 3000);
        })
        .catch(err => {
          console.error('History sync error:', err);
          syncHistoryBtn.innerText = 'Sync failed';
          syncHistoryBtn.disabled = false;
          if (syncHistoryStatus) syncHistoryStatus.innerText = 'Ensure backend server is running on localhost:8000.';
        });
      });
    });
  }

  // Open Dashboard Goal Editor button
  openDashboardGoalBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/?action=edit_goal' });
  });

  // Launch Dashboard button
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });
});

