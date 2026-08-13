import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import * as api from './services/api';

vi.mock('./services/api', () => ({
  getAnalyticsResults: vi.fn(),
  getVelocityAnalytics: vi.fn().mockResolvedValue(null),
  getCohortAnalytics: vi.fn().mockResolvedValue(null),
  updateJobGoal: vi.fn().mockResolvedValue({ status: 'success' }),
}));

describe('App Goal Configuration & Analytics Routing (TDD Seams)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (api.getAnalyticsResults as any).mockResolvedValue({
      job_id: 'stream_job_default',
      goal_text: 'Software Engineering, Programming, Machine Learning',
      metrics: null,
      alignment_score: null,
      recommended_channels: [],
      categories: [],
      hourly_heatmap: [],
      behavioral_nudges: [],
    });
  });

  it('Seam 1a: New user (no goal in localStorage) lands on Goal Setup View', async () => {
    render(<App />);

    expect(screen.getByText(/Configure Your Target Watching Goal/i)).toBeInTheDocument();
    expect(screen.queryByText(/Building Analytics Dashboard/i)).not.toBeInTheDocument();
  });

  it('Seam 1b: Returning user (goal in localStorage) lands directly on Analytics Dashboard', async () => {
    localStorage.setItem('yba_user_goal', 'Data Science & Machine Learning');
    render(<App />);

    await waitFor(() => {
      expect(api.getAnalyticsResults).toHaveBeenCalledWith('stream_job_default');
    });
    expect(screen.queryByText(/Configure Your Target Watching Goal/i)).not.toBeInTheDocument();
  });

  it('Seam 1c: URL query action=edit_goal forces landing on Goal Setup View even if goal exists', async () => {
    localStorage.setItem('yba_user_goal', 'Data Science & Machine Learning');
    delete (window as any).location;
    (window as any).location = new URL('http://localhost:5173/?action=edit_goal');

    render(<App />);
    expect(screen.getByText(/Configure Your Target Watching Goal/i)).toBeInTheDocument();
  });

  it('Seam 2: Saving a goal updates localStorage and navigates to Analytics Dashboard', async () => {
    render(<App />);

    const customInput = screen.getByPlaceholderText(/e.g., Master React, Web Performance/i);
    fireEvent.change(customInput, { target: { value: 'Quantum Computing' } });

    const saveButton = screen.getByRole('button', { name: /Save Goal & Continue/i });
    fireEvent.click(saveButton);

    expect(localStorage.getItem('yba_user_goal')).toBe('Quantum Computing');
    await waitFor(() => {
      expect(api.updateJobGoal).toHaveBeenCalledWith('stream_job_default', 'Quantum Computing');
    });
  });

  it('Seam 3: Clicking Edit Goal button on Analytics Dashboard routes back to Goal Setup View', async () => {
    localStorage.setItem('yba_user_goal', 'Data Science & Machine Learning');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-goal-nav-btn')).toBeInTheDocument();
    });

    const editBtn = screen.getByTestId('edit-goal-nav-btn');
    fireEvent.click(editBtn);

    expect(screen.getByText(/Configure Your Target Watching Goal/i)).toBeInTheDocument();
  });
});
