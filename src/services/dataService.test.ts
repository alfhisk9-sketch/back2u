import { describe, it, expect, beforeEach } from 'vitest';
import {
  getItems,
  getItemById,
  createItem,
  createClaim,
  reviewClaim,
  setCurrentCampusId,
  switchDemoUser,
  resetDemoData,
} from './dataService';
import { CAMPUS_CONFIG } from '../lib/constants';

describe('Back2You Data Service & Multi-Campus Security (DNR Campus)', () => {
  const DNR_CAMPUS_ID = CAMPUS_CONFIG.id;
  const SRKR_CAMPUS_ID = 'c2222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    resetDemoData();
    setCurrentCampusId(DNR_CAMPUS_ID);
    switchDemoUser('u-alfhi-lead');
  });

  it('enforces campus boundary isolation', async () => {
    // With DNR active:
    setCurrentCampusId(DNR_CAMPUS_ID);
    const dnrItems = await getItems();
    expect(dnrItems.length).toBeGreaterThan(0);
    expect(dnrItems.every(i => i.campus_id === DNR_CAMPUS_ID)).toBe(true);
    expect(dnrItems.some(i => i.campus_id === SRKR_CAMPUS_ID)).toBe(false);

    // Switch to SRKR:
    setCurrentCampusId(SRKR_CAMPUS_ID);
    const srkrItems = await getItems();
    expect(srkrItems.every(i => i.campus_id === SRKR_CAMPUS_ID)).toBe(true);
    expect(srkrItems.some(i => i.campus_id === DNR_CAMPUS_ID)).toBe(false);
  });

  it('allows creating a lost report and executes matching', async () => {
    setCurrentCampusId(DNR_CAMPUS_ID);
    switchDemoUser('u-alfhi-lead');

    const created = await createItem({
      campus_id: DNR_CAMPUS_ID,
      user_id: 'u-alfhi-lead',
      report_type: 'lost',
      title: 'Lost Dell Laptop 15 inch Charger',
      category: 'electronics',
      description: 'Left on workbench 4 in Computer Science lab.',
      location_name: 'Computer Science Laboratory',
      date_lost_found: '2026-10-24',
      color: 'black',
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe('open');

    const retrieved = await getItemById(created.id);
    expect(retrieved?.title).toBe('Lost Dell Laptop 15 inch Charger');
  });

  it('prevents user from claiming their own item', async () => {
    setCurrentCampusId(DNR_CAMPUS_ID);
    switchDemoUser('u-alfhi-lead');

    // Alfhi owns 'item-dnr-lost-calc'
    await expect(
      createClaim('item-dnr-lost-calc', {
        claim_message: 'Claiming my own item',
        proof_details: 'I am Alfhi',
      })
    ).rejects.toThrow('You cannot claim an item you reported yourself');
  });

  it('allows another student to submit a claim and reviewer to approve/complete it', async () => {
    setCurrentCampusId(DNR_CAMPUS_ID);
    // Switch to Rabbani
    switchDemoUser('u-rabbani-member');

    // Rabbani claims Alfhi's lost item
    const claim = await createClaim('item-dnr-lost-calc', {
      claim_message: 'Hi Alfhi, I found this calculator in the library.',
      proof_details: 'Has your name Alfhi written inside the cover.',
    });

    expect(claim.status).toBe('pending');

    // Now switch back to Alfhi (the owner) to approve the claim
    switchDemoUser('u-alfhi-lead');
    const reviewed = await reviewClaim(claim.id, {
      status: 'approved',
      handover_instructions: 'Meet at DNRCET Main Library Desk at 3 PM',
    });

    expect(reviewed.status).toBe('approved');

    // Check that item status transitioned to 'claimed'
    const updatedItem = await getItemById('item-dnr-lost-calc');
    expect(updatedItem?.status).toBe('claimed');

    // Now complete the claim handover
    const completed = await reviewClaim(claim.id, {
      status: 'completed',
    });

    expect(completed.status).toBe('completed');
    const resolvedItem = await getItemById('item-dnr-lost-calc');
    expect(resolvedItem?.status).toBe('resolved');
  });
});
