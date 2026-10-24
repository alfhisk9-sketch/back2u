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
} from '../services/dataService';

describe('End-to-End User & Recovery Workflows', () => {
  const STANFORD_ID = 'c1111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    setCurrentCampusId(STANFORD_ID);
    switchDemoUser('u-alice-stanford');
  });

  it('renders landing page with product identity, live campus stats, and workflow', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Lost something\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Let's bring it back to you/i)).toBeInTheDocument();
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

    fireEvent.change(searchInput, { target: { value: 'Hydro Flask' } });

    await waitFor(() => {
      expect(screen.getByText(/Blue Hydro Flask/i)).toBeInTheDocument();
    });
  });

  it('authenticates user and renders login persona choices', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sign in to Back2You/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant Demo Logins/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice Chen \(Student, Stanford\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Officer Marcus \(Moderator, Stanford\)/i)).toBeInTheDocument();
  });

  it('executes full claim lifecycle: create -> claim -> review -> complete return', async () => {
    // 1. Bob reports a found set of keys
    switchDemoUser('u-bob-student');
    const item = await createItem({
      campus_id: STANFORD_ID,
      user_id: 'u-bob-student',
      report_type: 'found',
      title: 'Brass Dorm Room Key on Blue Ring',
      category: 'keys',
      description: 'Found outside Stern dining hall',
      location_name: 'Stern Hall',
      date_lost_found: '2026-10-24',
    });

    expect(item.status).toBe('open');

    // 2. Alice discovers the item and submits an ownership claim
    switchDemoUser('u-alice-stanford');
    const claim = await createClaim(item.id, {
      claim_message: 'Hi Bob, I lost these keys yesterday outside Stern.',
      proof_details: 'The brass key is stamped with room number 214.',
    });

    expect(claim.status).toBe('pending');

    // 3. Bob reviews and approves the claim with security desk handover instructions
    switchDemoUser('u-bob-student');
    const approvedClaim = await reviewClaim(claim.id, {
      status: 'approved',
      handover_instructions: 'Meet at Tresidder Union security desk at 2 PM',
      review_notes: 'Room 214 confirmed against dorm registry.',
    });

    expect(approvedClaim.status).toBe('approved');
    let currentItem = await getItemById(item.id);
    expect(currentItem?.status).toBe('claimed');

    // 4. Bob confirms return handover is completed
    const completedClaim = await reviewClaim(claim.id, {
      status: 'completed',
    });

    expect(completedClaim.status).toBe('completed');
    currentItem = await getItemById(item.id);
    expect(currentItem?.status).toBe('resolved');
  });

  it('enforces RBAC on the Moderator page', async () => {
    // Alice is a student -> should see access restricted screen
    switchDemoUser('u-alice-stanford');
    const { rerender } = render(
      <MemoryRouter>
        <ModeratorPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Campus Moderator Access Required/i)).toBeInTheDocument();
    });

    // Now switch to Officer Marcus Brody (Moderator)
    switchDemoUser('u-marcus-mod');
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

  it('renders student dashboard with personal reports and claim metrics', async () => {
    switchDemoUser('u-alice-stanford');
    render(
      <MemoryRouter>
        <MyReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alice Chen/i)).toBeInTheDocument();
      expect(screen.getByText(/My Lost Reports/i)).toBeInTheDocument();
      expect(screen.getByText(/Successfully Reunited/i)).toBeInTheDocument();
    });
  });
});
