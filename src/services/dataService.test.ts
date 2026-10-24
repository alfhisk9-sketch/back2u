import { describe, it, expect, beforeEach } from 'vitest';
import {
  getItems,
  getItemById,
  createItem,
  createClaim,
  reviewClaim,
  setCurrentCampusId,
  switchDemoUser,
} from './dataService';

describe('Back2You Data Service & Multi-Campus Security', () => {
  const STANFORD_ID = 'c1111111-1111-1111-1111-111111111111';
  const MIT_ID = 'c2222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    setCurrentCampusId(STANFORD_ID);
    switchDemoUser('u-alice-stanford');
  });

  it('enforces campus boundary isolation', async () => {
    // With Stanford active:
    setCurrentCampusId(STANFORD_ID);
    const stanfordItems = await getItems();
    expect(stanfordItems.every(i => i.campus_id === STANFORD_ID)).toBe(true);
    expect(stanfordItems.some(i => i.campus_id === MIT_ID)).toBe(false);

    // Switch to MIT:
    setCurrentCampusId(MIT_ID);
    const mitItems = await getItems();
    expect(mitItems.every(i => i.campus_id === MIT_ID)).toBe(true);
    expect(mitItems.some(i => i.campus_id === STANFORD_ID)).toBe(false);
  });

  it('allows creating a lost report and executes matching', async () => {
    setCurrentCampusId(STANFORD_ID);
    switchDemoUser('u-alice-stanford');

    const created = await createItem({
      campus_id: STANFORD_ID,
      user_id: 'u-alice-stanford',
      report_type: 'lost',
      title: 'Lost silver MacBook Pro 14 inch',
      category: 'electronics',
      description: 'Left on desk in Gates CS building room 204 with stickers.',
      location_name: 'Gates Computer Science Building',
      date_lost_found: '2026-10-24',
      color: 'silver',
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe('open');

    const retrieved = await getItemById(created.id);
    expect(retrieved?.title).toBe('Lost silver MacBook Pro 14 inch');
  });

  it('prevents user from claiming their own item', async () => {
    setCurrentCampusId(STANFORD_ID);
    switchDemoUser('u-alice-stanford');

    // Alice owns 'item-su-lost-1'
    await expect(
      createClaim('item-su-lost-1', {
        claim_message: 'Claiming my own item',
        proof_details: 'I am Alice',
      })
    ).rejects.toThrow('You cannot claim an item you reported yourself');
  });

  it('allows another student to submit a claim and reviewer to approve/complete it', async () => {
    setCurrentCampusId(STANFORD_ID);
    // Switch to Bob
    switchDemoUser('u-bob-student');

    // Bob claims Alice's lost item
    const claim = await createClaim('item-su-lost-1', {
      claim_message: 'Hi Alice, I have this item at the dorm reception.',
      proof_details: 'The name Alice Chen is on the ID badge.',
    });

    expect(claim.status).toBe('pending');

    // Now switch back to Alice (the owner) to approve the claim
    switchDemoUser('u-alice-stanford');
    const reviewed = await reviewClaim(claim.id, {
      status: 'approved',
      handover_instructions: 'Meet outside Tresidder Union at 3 PM',
    });

    expect(reviewed.status).toBe('approved');

    // Check that item status transitioned to 'claimed'
    const updatedItem = await getItemById('item-su-lost-1');
    expect(updatedItem?.status).toBe('claimed');

    // Now complete the claim handover
    const completed = await reviewClaim(claim.id, {
      status: 'completed',
    });
    expect(completed.status).toBe('completed');

    const resolvedItem = await getItemById('item-su-lost-1');
    expect(resolvedItem?.status).toBe('resolved');
  });
});
