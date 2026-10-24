import { describe, it, expect, beforeEach } from 'vitest';
import {
  createItem,
  createClaim,
  reviewClaim,
  switchDemoUser,
  setCurrentCampusId,
  getItemById,
  getClaimsForItem,
  resetDemoData,
} from './dataService';
import { CAMPUS_CONFIG } from '../lib/constants';

describe('Security & Authorization Boundary Tests (DNR Campus)', () => {
  const DNR_CAMPUS_ID = CAMPUS_CONFIG.id;

  beforeEach(() => {
    resetDemoData();
    setCurrentCampusId(DNR_CAMPUS_ID);
    switchDemoUser('u-alfhi-lead');
  });

  it('guarantees that Alfhi, Rabbani, and Santosh all hold Student role', async () => {
    const alfhi = switchDemoUser('u-alfhi-lead');
    expect(alfhi.role).toBe('student');
    expect(alfhi.team_designation).toBe('Project Lead');

    const rabbani = switchDemoUser('u-rabbani-member');
    expect(rabbani.role).toBe('student');
    expect(rabbani.team_designation).toBe('Team Member');

    const santosh = switchDemoUser('u-santosh-member');
    expect(santosh.role).toBe('student');
    expect(santosh.team_designation).toBe('Team Member');
  });

  it('enforces claim state transition rules: cannot complete a pending claim without approval', async () => {
    switchDemoUser('u-rabbani-member');

    // Create an item owned by Rabbani
    const item = await createItem({
      campus_id: DNR_CAMPUS_ID,
      user_id: 'u-rabbani-member',
      report_type: 'found',
      title: 'Found Casio Scientific Calculator in Lab',
      category: 'electronics',
      description: 'Found on table',
      location_name: 'Computer Science Laboratory',
      date_lost_found: '2026-10-24',
    });

    // Alfhi claims it
    switchDemoUser('u-alfhi-lead');
    const claim = await createClaim(item.id, {
      claim_message: 'This is my calculator',
      proof_details: 'Has white name sticker inside lid',
    });

    // Rabbani tries to complete without approving first
    switchDemoUser('u-rabbani-member');
    await expect(
      reviewClaim(claim.id, { status: 'completed' })
    ).rejects.toThrow('Pending claims must be approved before completing return');
  });

  it('enforces terminal state: completed claims cannot be altered', async () => {
    switchDemoUser('u-rabbani-member');
    const item = await createItem({
      campus_id: DNR_CAMPUS_ID,
      user_id: 'u-rabbani-member',
      report_type: 'found',
      title: 'Found Keys',
      category: 'keys',
      description: 'Keychain with bike key',
      location_name: 'Parking Area',
      date_lost_found: '2026-10-24',
    });

    switchDemoUser('u-alfhi-lead');
    const claim = await createClaim(item.id, {
      claim_message: 'My Honda bike keys',
      proof_details: 'Has red LED torch',
    });

    // Rabbani approves
    switchDemoUser('u-rabbani-member');
    await reviewClaim(claim.id, { status: 'approved' });

    // Rabbani completes
    await reviewClaim(claim.id, { status: 'completed' });

    // Attempt to modify after completion
    await expect(
      reviewClaim(claim.id, { status: 'rejected' })
    ).rejects.toThrow('Completed claims are finalized and cannot be modified');
  });

  it('prevents user from claiming their own registered item', async () => {
    switchDemoUser('u-alfhi-lead');
    const alfhiItem = await createItem({
      campus_id: DNR_CAMPUS_ID,
      user_id: 'u-alfhi-lead',
      report_type: 'lost',
      title: 'Alfhi Watch',
      category: 'accessories',
      description: 'Lost digital watch',
      location_name: 'Sports Ground',
      date_lost_found: '2026-10-24',
    });

    await expect(
      createClaim(alfhiItem.id, {
        claim_message: 'I am claiming my own watch',
        proof_details: 'It has my name on it',
      })
    ).rejects.toThrow('You cannot claim an item you reported yourself');
  });

  it('updates item status to claimed when claim is approved, and resolved when completed', async () => {
    switchDemoUser('u-alfhi-lead');
    const item = await createItem({
      campus_id: DNR_CAMPUS_ID,
      user_id: 'u-alfhi-lead',
      report_type: 'found',
      title: 'Found Umbrella',
      category: 'accessories',
      description: 'Black folding umbrella',
      location_name: 'Main Entrance',
      date_lost_found: '2026-10-24',
    });

    switchDemoUser('u-santosh-member');
    const claim = await createClaim(item.id, {
      claim_message: 'My umbrella',
      proof_details: 'Wooden handle with wrist loop',
    });

    switchDemoUser('u-alfhi-lead');
    await reviewClaim(claim.id, { status: 'approved' });

    let updatedItem = await getItemById(item.id);
    expect(updatedItem?.status).toBe('claimed');

    await reviewClaim(claim.id, { status: 'completed' });
    updatedItem = await getItemById(item.id);
    expect(updatedItem?.status).toBe('resolved');
  });

  it('strictly protects private claim details: non-owners cannot view private clues', async () => {
    // Rabbani has reported a found item with private clues
    const item = await getItemById('item-dnr-found-calc');
    expect(item).not.toBeNull();

    // Santosh is an unrelated third party
    switchDemoUser('u-santosh-member');
    const claims = await getClaimsForItem(item!.id);
    
    // Santosh did not file a claim and is not the poster -> cannot see Alfhi's proof details
    claims.forEach(c => {
      if (c.claimant_id !== 'u-santosh-member') {
        expect(c.proof_details).toBe('[Protected Confidential Ownership Proof]');
      }
    });
  });
});
