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
} from './dataService';
import {
  REWARD_POINTS,
  makeFoundReportKey,
  makeRecoveryCompletedKey,
} from '../lib/rewards';


describe('Back2You Stars — Service & Security Integration', () => {
  const STANFORD_CAMPUS = 'c1111111-1111-1111-1111-111111111111';
  const MIT_CAMPUS = 'c2222222-2222-2222-2222-222222222222';
  const TEST_USER = 'u-bob-student';

  beforeEach(() => {
    localStorage.clear();
    setCurrentCampusId(STANFORD_CAMPUS);
    switchDemoUser(TEST_USER);
  });

  it('awards +10 Stars for a valid found-item report and 0 for lost reports', async () => {
    // 1. Report found item
    const foundItem = await createItem({
      campus_id: STANFORD_CAMPUS,
      user_id: TEST_USER,
      report_type: 'found',
      title: 'Found Black Leather Wallet',
      category: 'wallets_purses',
      description: 'Found on the bench outside Green Library.',
      location_name: 'Green Library',
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
      campus_id: STANFORD_CAMPUS,
      user_id: TEST_USER,
      report_type: 'lost',
      title: 'Lost Silver Earring',
      category: 'accessories',
      description: 'Lost somewhere in Meyer Green.',
      location_name: 'Meyer Green',
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
      campus_id: STANFORD_CAMPUS,
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
      campus_id: STANFORD_CAMPUS,
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
        campus_id: STANFORD_CAMPUS,
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
        campus_id: STANFORD_CAMPUS,
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
      campus_id: STANFORD_CAMPUS,
      user_id: 'u-alice-stanford',
      report_type: 'found',
      title: 'Found Scientific Calculator',
      category: 'electronics',
      description: 'Casio fx-991EX left on desk.',
      location_name: 'Science Bldg 101',
      date_lost_found: '2026-10-24',
    });

    // 2. Student trying to verify report should be rejected
    switchDemoUser('u-bob-student'); // student role
    await expect(verifyFoundItemReport(foundItem.id)).rejects.toThrow(
      /Only campus safety moderators/
    );

    // 3. Switch to campus moderator
    switchDemoUser('u-marcus-mod'); // moderator role
    const verifyTx = await verifyFoundItemReport(foundItem.id);
    expect(verifyTx).toBeDefined();
    expect(verifyTx?.points).toBe(15);
    expect(verifyTx?.event_type).toBe('moderator_verified');

    // 4. Repeated verification attempts must be idempotent
    const secondAttempt = await verifyFoundItemReport(foundItem.id);
    expect(secondAttempt?.id).toBe(verifyTx?.id);
  });

  it('awards +25 recovery bonus upon completed return and enforces achievement uniqueness', async () => {
    // Create found item reported by Bob
    switchDemoUser('u-bob-student');
    const item = await createItem({
      campus_id: STANFORD_CAMPUS,
      user_id: 'u-bob-student',
      report_type: 'found',
      title: 'Found Keys with Brass Carabiner',
      category: 'keys',
      description: 'Found near cafeteria steps.',
      location_name: 'Main Cafeteria',
      date_lost_found: '2026-10-24',
    });

    // Alice files a claim
    switchDemoUser('u-alice-stanford');
    const claim = await createClaim(item.id, {
      claim_message: 'These are my dorm keys.',
      proof_details: 'Three keys on a brass carabiner with an engraving of the letter A.',
    });

    // Bob approves claim
    switchDemoUser('u-bob-student');
    await reviewClaim(claim.id, {
      status: 'approved',
      handover_instructions: 'Meet at Tresidder Union desk at 4 PM.',
    });

    // Handover completed
    await reviewClaim(claim.id, {
      status: 'completed',
    });

    // Bob (the finder) should receive +25 Stars
    const bobSummary = await getUserRewardsSummary('u-bob-student');
    const recoveryTx = bobSummary.recent_transactions.find(
      t => t.idempotency_key === makeRecoveryCompletedKey(claim.id, 'u-bob-student')
    );
    expect(recoveryTx).toBeDefined();
    expect(recoveryTx?.points).toBe(REWARD_POINTS.recovery_completed);

    // Ensure achievement uniqueness (no duplicate badge records)
    const achievements = bobSummary.earned_achievements;
    const codes = achievements.map(a => a.achievement_code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it('strictly isolates campus leaderboards and protects student privacy', async () => {
    const stanfordBoard = await getCampusLeaderboard(STANFORD_CAMPUS, 'all_time');
    const mitBoard = await getCampusLeaderboard(MIT_CAMPUS, 'all_time');

    // Stanford board must only contain Stanford users or users with Stanford points
    stanfordBoard.forEach(entry => {
      expect(entry.campus_id).toBe(STANFORD_CAMPUS);
      // Privacy check: Never expose email, phone number, or student ID in public ranking
      // @ts-expect-error property check
      expect(entry.email).toBeUndefined();
      // @ts-expect-error property check
      expect(entry.phone_number).toBeUndefined();
      // @ts-expect-error property check
      expect(entry.student_id).toBeUndefined();
      expect(entry.display_name).toBeTruthy();
    });

    // MIT board must not leak Stanford students
    const mitUserIds = mitBoard.map(e => e.user_id);
    expect(mitUserIds).toContain('u-david-mit');
    expect(mitUserIds).not.toContain('u-bob-student');
  });
});
