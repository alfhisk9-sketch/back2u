import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RewardsPage } from '../../pages/RewardsPage';
import { switchDemoUser, setCurrentCampusId } from '../../services/dataService';

describe('Back2You Stars — Rewards Dashboard UI', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentCampusId('c1111111-1111-1111-1111-111111111111');
    switchDemoUser('u-rabbani-member');
  });

  it('renders star balance, achievement level, and milestone badges', async () => {
    render(
      <BrowserRouter>
        <RewardsPage />
      </BrowserRouter>
    );

    // Header and balance
    expect(await screen.findByText(/Back2You Stars & Achievements/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Stars Earned/i)).toBeInTheDocument();

    // Achievement Badges Tab
    expect(screen.getByText(/Achievement Badges/i)).toBeInTheDocument();
    expect(screen.getByText(/First Finder/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bronze Helper/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Campus Hero/i)).toBeInTheDocument();
  });

  it('allows switching to Campus Leaderboard tab with timeframe controls', async () => {
    render(
      <BrowserRouter>
        <RewardsPage />
      </BrowserRouter>
    );

    const leaderboardTab = await screen.findByRole('button', { name: /Campus Leaderboard/i });
    fireEvent.click(leaderboardTab);

    // Leaderboard table columns & controls
    expect(await screen.findByText(/Campus Contributor/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Past 30 Days/i)).toBeInTheDocument();
    expect(screen.getByText(/This Week/i)).toBeInTheDocument();

    // Privacy notice
    expect(screen.getByText(/Privacy Guaranteed/i)).toBeInTheDocument();

    // Switch timeframe to monthly
    fireEvent.click(screen.getByText(/Past 30 Days/i));
    await waitFor(() => {
      expect(screen.getByText(/Past 30 Days/i)).toHaveClass('font-bold');
    });
  });

  it('allows switching to Reward Ledger tab to inspect transactions', async () => {
    render(
      <BrowserRouter>
        <RewardsPage />
      </BrowserRouter>
    );

    const historyTab = await screen.findByRole('button', { name: /Reward Ledger/i });
    fireEvent.click(historyTab);

    // Ledger table headers
    expect(await screen.findByText(/Date & Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Contribution Event/i)).toBeInTheDocument();
    expect(screen.getByText(/Stars Credited/i)).toBeInTheDocument();
  });
});
