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

  // Open Dashboard Goal Editor button
  openDashboardGoalBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/?action=edit_goal' });
  });

  // Launch Dashboard button
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });
});
