import { describe, it, expect, beforeEach } from 'vitest';
import {
  issueRewardPoints,
  getUserRewardsSummary,
  getCampusLeaderboard,
  verifyFoundItemReport,
  createItem,
  createClaim,
  reviewClaim,
  setCurrentCampusId,
  switchDemoUser,
  resetDemoData,
} from './dataService';
import {
  REWARD_POINTS,
  makeFoundReportKey,
  makeRecoveryCompletedKey,
} from '../lib/rewards';
import { CAMPUS_CONFIG } from '../lib/constants';

describe('Back2You Stars — Service & Security Integration (DNR Campus)', () => {
  const DNR_CAMPUS = CAMPUS_CONFIG.id;
  const TEST_USER = 'u-rabbani-member';

  beforeEach(() => {
    resetDemoData();
    setCurrentCampusId(DNR_CAMPUS);
    switchDemoUser(TEST_USER);
  });

  it('awards +10 Stars for a valid found-item report and 0 for lost reports', async () => {
    // 1. Report found item
    const foundItem = await createItem({
      campus_id: DNR_CAMPUS,
      user_id: TEST_USER,
      report_type: 'found',
      title: 'Found Black Leather Wallet',
      category: 'wallets_purses',
      description: 'Found on the bench outside Main Library.',
      location_name: 'Main Library',
      date_lost_found: '2026-10-24',
    });

    const summaryAfterFound = await getUserRewardsSummary(TEST_USER);
    const foundTx = summaryAfterFound.recent_transactions.find(
      t => t.idempotency_key === makeFoundReportKey(foundItem.id)
    );

    expect(foundTx).toBeDefined();
    expect(foundTx?.points).toBe(REWARD_POINTS.found_report_accepted);
    expect(foundTx?.event_type).toBe('found_report_accepted');

    // 2. Report lost item — must NOT receive report points
    const lostItem = await createItem({
      campus_id: DNR_CAMPUS,
      user_id: TEST_USER,
      report_type: 'lost',
      title: 'Lost Silver Earring',
      category: 'accessories',
      description: 'Lost somewhere near seminar hall.',
      location_name: 'Seminar Hall',
      date_lost_found: '2026-10-24',
    });

    const summaryAfterLost = await getUserRewardsSummary(TEST_USER);
    const lostTx = summaryAfterLost.recent_transactions.find(
      t => t.item_id === lostItem.id
    );
    expect(lostTx).toBeUndefined(); // Lost report does not create reward transaction
  });

  it('guarantees duplicate event prevention and retry safety (idempotency)', async () => {
    const key = `manual_test_key_${Date.now()}`;

    // First call: newly issued
    const res1 = await issueRewardPoints({
      user_id: TEST_USER,
      campus_id: DNR_CAMPUS,
      event_type: 'found_report_accepted',
      points: 10,
      description: 'Test found item report',
      idempotency_key: key,
    });
    expect(res1.is_new).toBe(true);
    expect(res1.transaction.points).toBe(10);

    // Second call with same idempotency key (retry/refresh simulation)
    const res2 = await issueRewardPoints({
      user_id: TEST_USER,
      campus_id: DNR_CAMPUS,
      event_type: 'found_report_accepted',
      points: 10,
      description: 'Test found item report (retry)',
      idempotency_key: key,
    });
    expect(res2.is_new).toBe(false);
    expect(res2.transaction.id).toBe(res1.transaction.id);

    // Total points should not have doubled
    const summary = await getUserRewardsSummary(TEST_USER);
    const matchingTxs = summary.recent_transactions.filter(t => t.idempotency_key === key);
    expect(matchingTxs).toHaveLength(1);
  });

  it('rejects unauthorized or tampered reward points', async () => {
    // Attempting to grant 50 points instead of rule-mandated 10 points
    await expect(
      issueRewardPoints({
        user_id: TEST_USER,
        campus_id: DNR_CAMPUS,
        event_type: 'found_report_accepted',
        points: 50, // TAMPERED
        description: 'Tampered points request',
        idempotency_key: `tampered_${Date.now()}`,
      })
    ).rejects.toThrow(/Invalid points amount/);

    // Attempting negative points
    await expect(
      issueRewardPoints({
        user_id: TEST_USER,
        campus_id: DNR_CAMPUS,
        event_type: 'found_report_accepted',
        points: -10,
        description: 'Negative points',
        idempotency_key: `neg_${Date.now()}`,
      })
    ).rejects.toThrow();
  });

  it('awards +15 moderator verification bonus only when authorized moderator verifies', async () => {
    // 1. Create a found item
    const foundItem = await createItem({
      campus_id: DNR_CAMPUS,
      user_id: 'u-alfhi-lead',
      report_type: 'found',
      title: 'Found Scientific Calculator',
      category: 'electronics',
      description: 'Casio fx-991EX left on desk.',
      location_name: 'Main Library',
      date_lost_found: '2026-10-24',
    });

    // 2. Student trying to verify report should be rejected
    switchDemoUser('u-rabbani-member'); // student role
    await expect(verifyFoundItemReport(foundItem.id)).rejects.toThrow(
      /Only campus safety moderators/
    );

    // 3. Switch to campus moderator
    switchDemoUser('u-prasad-mod'); // moderator role
    const verifyTx = await verifyFoundItemReport(foundItem.id);
    expect(verifyTx).toBeDefined();
    expect(verifyTx?.points).toBe(15);
    expect(verifyTx?.event_type).toBe('moderator_verified');

    // 4. Repeated verification attempts must be idempotent
    const secondAttempt = await verifyFoundItemReport(foundItem.id);
    expect(secondAttempt?.id).toBe(verifyTx?.id);
  });

  it('awards +25 recovery bonus upon completed return and enforces achievement uniqueness', async () => {
    // Create found item reported by Rabbani
    switchDemoUser('u-rabbani-member');
    const item = await createItem({
      campus_id: DNR_CAMPUS,
      user_id: 'u-rabbani-member',
      report_type: 'found',
      title: 'Found Keys with Bike Keychain',
      category: 'keys',
      description: 'Found near cafeteria steps.',
      location_name: 'College Canteen',
      date_lost_found: '2026-10-24',
    });

    // Alfhi files a claim
    switchDemoUser('u-alfhi-lead');
    const claim = await createClaim(item.id, {
      claim_message: 'These are my bike keys.',
      proof_details: 'Honda rubber emblem with red mini torch attached.',
    });

    // Rabbani approves claim
    switchDemoUser('u-rabbani-member');
    await reviewClaim(claim.id, {
      status: 'approved',
      handover_instructions: 'Meet at DNRCET Security Desk at 4 PM.',
    });

    // Handover completed
    await reviewClaim(claim.id, {
      status: 'completed',
    });

    // Rabbani (the finder) should receive +25 Stars
    const rabbaniSummary = await getUserRewardsSummary('u-rabbani-member');
    const recoveryTx = rabbaniSummary.recent_transactions.find(
      t => t.idempotency_key === makeRecoveryCompletedKey(claim.id, 'u-rabbani-member')
    );
    expect(recoveryTx).toBeDefined();
    expect(recoveryTx?.points).toBe(REWARD_POINTS.recovery_completed);

    // Ensure achievement uniqueness (no duplicate badge records)
    const achievements = rabbaniSummary.earned_achievements;
    const codes = achievements.map(a => a.achievement_code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it('strictly isolates campus leaderboards and protects student privacy', async () => {
    const dnrBoard = await getCampusLeaderboard(DNR_CAMPUS, 'all_time');

    // DNR board must contain only DNR students with valid points
    expect(dnrBoard.length).toBeGreaterThan(0);
    dnrBoard.forEach(entry => {
      expect(entry.campus_id).toBe(DNR_CAMPUS);
      // Privacy check: Never expose email, phone number, or student ID in public ranking
      // @ts-expect-error property check
      expect(entry.email).toBeUndefined();
      // @ts-expect-error property check
      expect(entry.phone_number).toBeUndefined();
      // @ts-expect-error property check
      expect(entry.student_id).toBeUndefined();
      expect(entry.display_name).toBeTruthy();
    });

    const dnrNames = dnrBoard.map(e => e.display_name);
    expect(dnrNames).toContain('Rabbani');
    expect(dnrNames).toContain('Alfhi');
  });
});
