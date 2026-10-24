import { describe, it, expect, beforeEach } from 'vitest';
import {
  createItem,
  createClaim,
  reviewClaim,
  switchDemoUser,
  setCurrentCampusId,
  getItemById,
} from './dataService';

describe('Security & Authorization Boundary Tests', () => {
  const STANFORD_ID = 'c1111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    setCurrentCampusId(STANFORD_ID);
    switchDemoUser('u-alice-stanford');
  });

  it('enforces claim state transition rules: cannot complete a pending claim without approval', async () => {
    switchDemoUser('u-bob-student');

    // Create an item owned by Bob
    const bobItem = await createItem({
      campus_id: STANFORD_ID,
      user_id: 'u-bob-student',
      report_type: 'found',
      title: 'Found TI Calculator in Math Hall',
      category: 'electronics',
      description: 'Found on table',
      location_name: 'Math Hall Rm 101',
      date_lost_found: '2026-10-24',
    });

    // Alice claims it
    switchDemoUser('u-alice-stanford');
    const claim = await createClaim(bobItem.id, {
      claim_message: 'This is my calculator',
      proof_details: 'Has silver sharpie mark',
    });

    // Bob tries to complete without approving first
    switchDemoUser('u-bob-student');
    await expect(
      reviewClaim(claim.id, { status: 'completed' })
    ).rejects.toThrow('Pending claims must be approved before completing return');
  });

  it('enforces terminal state: completed claims cannot be altered', async () => {
    switchDemoUser('u-bob-student');
    const item = await createItem({
      campus_id: STANFORD_ID,
      user_id: 'u-bob-student',
      report_type: 'found',
      title: 'Found Keys',
      category: 'keys',
      description: 'Keychain with brass key',
      location_name: 'Dining Hall',
      date_lost_found: '2026-10-24',
    });

    switchDemoUser('u-alice-stanford');
    const claim = await createClaim(item.id, {
      claim_message: 'My brass keys',
      proof_details: 'Has blue carabiner',
    });

    // Bob approves
    switchDemoUser('u-bob-student');
    await reviewClaim(claim.id, { status: 'approved' });

    // Bob completes
    await reviewClaim(claim.id, { status: 'completed' });

    // Attempt to modify after completion
    await expect(
      reviewClaim(claim.id, { status: 'rejected' })
    ).rejects.toThrow('Completed claims are finalized and cannot be modified');
  });

  it('prevents user from claiming their own registered item', async () => {
    switchDemoUser('u-alice-stanford');
    const aliceItem = await createItem({
      campus_id: STANFORD_ID,
      user_id: 'u-alice-stanford',
      report_type: 'lost',
      title: 'Alice Watch',
      category: 'accessories',
      description: 'Lost gold watch',
      location_name: 'Gym',
      date_lost_found: '2026-10-24',
    });

    await expect(
      createClaim(aliceItem.id, {
        claim_message: 'I am claiming my own watch',
        proof_details: 'It has my name on it',
      })
    ).rejects.toThrow('You cannot claim an item you reported yourself');
  });

  it('updates item status to claimed when claim is approved, and resolved when completed', async () => {
    switchDemoUser('u-alice-stanford');
    const item = await createItem({
      campus_id: STANFORD_ID,
      user_id: 'u-alice-stanford',
      report_type: 'found',
      title: 'Found Blue Jacket',
      category: 'clothing',
      description: 'Columbia fleece',
      location_name: 'Library',
      date_lost_found: '2026-10-24',
    });

    switchDemoUser('u-bob-student');
    const claim = await createClaim(item.id, {
      claim_message: 'My jacket',
      proof_details: 'Size L with name tag inside',
    });

    switchDemoUser('u-alice-stanford');
    await reviewClaim(claim.id, { status: 'approved' });

    let updatedItem = await getItemById(item.id);
    expect(updatedItem?.status).toBe('claimed');

    await reviewClaim(claim.id, { status: 'completed' });
    updatedItem = await getItemById(item.id);
    expect(updatedItem?.status).toBe('resolved');
  });
});
