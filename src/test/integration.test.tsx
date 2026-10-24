/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { ExplorePage } from '../pages/ExplorePage';
import { LoginPage } from '../pages/LoginPage';
import { MyReportsPage } from '../pages/MyReportsPage';
import { ModeratorPage } from '../pages/ModeratorPage';
import {
  switchDemoUser,
  setCurrentCampusId,
  createItem,
  createClaim,
  reviewClaim,
  getItemById,
  resetDemoData,
} from '../services/dataService';
import { CAMPUS_CONFIG } from '../lib/constants';

describe('End-to-End User & Recovery Workflows (DNR Campus)', () => {
  const DNR_CAMPUS_ID = CAMPUS_CONFIG.id;

  beforeEach(() => {
    resetDemoData();
    setCurrentCampusId(DNR_CAMPUS_ID);
    switchDemoUser('u-alfhi-lead');
  });

  it('renders landing page with DNR campus identity, live stats, and workflow', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Lost something\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Let's bring it back to you/i)).toBeInTheDocument();
    expect(screen.getByText(/DNR Campus Recovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Campus Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Explainable 100-Point Scoring Model/i)).toBeInTheDocument();
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
  });

  it('filters and searches items on the Explore page', async () => {
    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Explore Lost & Found/i)).toBeInTheDocument();
    });

    // Test search filter input
    const searchInput = screen.getByPlaceholderText(/Title, brand, location.../i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Casio' } });

    await waitFor(() => {
      expect(screen.getAllByText(/Casio fx-991EX/i).length).toBeGreaterThan(0);
    });
  });

  it('authenticates user and renders DNR team demo persona choices', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sign in to Back2You/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant Demo Logins/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue as Alfhi →/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue as Rabbani →/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue as Santosh →/i)).toBeInTheDocument();
    expect(screen.getByText(/Officer Prasad/i)).toBeInTheDocument();
  });

  it('executes full claim lifecycle: create -> claim -> review -> complete return', async () => {
    // 1. Rabbani reports a found calculator
    switchDemoUser('u-rabbani-member');
    const item = await createItem({
      campus_id: DNR_CAMPUS_ID,
      user_id: 'u-rabbani-member',
      report_type: 'found',
      title: 'Found Casio Scientific Calculator',
      category: 'electronics',
      description: 'Found in the Main Library reading hall.',
      location_name: 'Main Library',
      date_lost_found: '2026-10-24',
    });

    expect(item.status).toBe('open');

    // 2. Alfhi discovers the item and submits an ownership claim with private proof
    switchDemoUser('u-alfhi-lead');
    const claim = await createClaim(item.id, {
      claim_message: 'Hi Rabbani, I lost this Casio calculator in the library yesterday.',
      proof_details: 'The name Alfhi is written inside the sliding case, screen contrast level 7.',
    });

    expect(claim.status).toBe('pending');

    // 3. Rabbani reviews and approves the claim with security desk handover instructions
    switchDemoUser('u-rabbani-member');
    const approvedClaim = await reviewClaim(claim.id, {
      status: 'approved',
      handover_instructions: 'Meet at DNRCET Security Desk, Main Block at 2 PM',
      review_notes: 'Proof verified against owner name sticker.',
    });

    expect(approvedClaim.status).toBe('approved');
    let currentItem = await getItemById(item.id);
    expect(currentItem?.status).toBe('claimed');

    // 4. Rabbani confirms return handover is completed
    const completedClaim = await reviewClaim(claim.id, {
      status: 'completed',
    });

    expect(completedClaim.status).toBe('completed');
    currentItem = await getItemById(item.id);
    expect(currentItem?.status).toBe('resolved');
  });

  it('enforces RBAC on the Moderator page: student is denied, officer is granted', async () => {
    // Alfhi is a student -> should see access restricted screen
    switchDemoUser('u-alfhi-lead');
    const { rerender } = render(
      <MemoryRouter>
        <ModeratorPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Campus Moderator Access Required/i)).toBeInTheDocument();
    });

    // Now switch to Officer Prasad (Moderator)
    switchDemoUser('u-prasad-mod');
    rerender(
      <MemoryRouter>
        <ModeratorPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Campus Operations & Moderation/i)).toBeInTheDocument();
      expect(screen.getByText(/Campus Listings Management/i)).toBeInTheDocument();
    });
  });

  it('renders student dashboard with personal reports, team designation, and claim metrics', async () => {
    switchDemoUser('u-alfhi-lead');
    render(
      <MemoryRouter>
        <MyReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alfhi/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Lead/i)).toBeInTheDocument();
      expect(screen.getByText(/My Lost Reports/i)).toBeInTheDocument();
    });
  });
});
