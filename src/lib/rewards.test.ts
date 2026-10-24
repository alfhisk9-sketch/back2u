import { describe, it, expect } from 'vitest';
import {
  REWARD_POINTS,
  ACHIEVEMENT_DEFINITIONS,
  makeFoundReportKey,
  makeModeratorVerifiedKey,
  makeRecoveryCompletedKey,
  makeHelpfulReportKey,
  isAchievementUnlocked,
  calculateMilestones,
  getNextMilestone,
  calculateAchievementLevel,
  type AuthoritativeUserMetrics,
} from './rewards';
import type { UserAchievement } from '../types';

describe('Back2You Stars — Reward Rules & Points Engine', () => {
  it('enforces exact required point values for all reward events', () => {
    expect(REWARD_POINTS.found_report_accepted).toBe(10);
    expect(REWARD_POINTS.moderator_verified).toBe(15);
    expect(REWARD_POINTS.recovery_completed).toBe(25);
    expect(REWARD_POINTS.helpful_report_recovery).toBe(10);
  });

  it('generates consistent and unique idempotency keys for reward transactions', () => {
    const key1 = makeFoundReportKey('item-123');
    const key2 = makeFoundReportKey('item-123');
    const keyDiff = makeFoundReportKey('item-456');

    expect(key1).toBe('found_report_item-123');
    expect(key1).toBe(key2);
    expect(key1).not.toBe(keyDiff);

    expect(makeModeratorVerifiedKey('item-123')).toBe('mod_verified_item-123');
    expect(makeRecoveryCompletedKey('claim-abc', 'user-xyz')).toBe('recovery_completed_claim-abc_user-xyz');
    expect(makeHelpfulReportKey('item-123', 'user-xyz')).toBe('helpful_report_item-123_user-xyz');
  });

  it('accurately evaluates achievement unlocking from authoritative metrics', () => {
    const zeroMetrics: AuthoritativeUserMetrics = {
      found_reports: 0,
      verified_contributions: 0,
      completed_recoveries: 0,
      moderator_verified: 0,
    };

    expect(isAchievementUnlocked('first_finder', zeroMetrics)).toBe(false);
    expect(isAchievementUnlocked('bronze_helper', zeroMetrics)).toBe(false);

    // 1 found report unlocks First Finder
    const firstFoundMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, found_reports: 1 };
    expect(isAchievementUnlocked('first_finder', firstFoundMetrics)).toBe(true);
    expect(isAchievementUnlocked('bronze_helper', firstFoundMetrics)).toBe(false);

    // 3 verified contributions unlocks Bronze Helper
    const bronzeMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, verified_contributions: 3 };
    expect(isAchievementUnlocked('bronze_helper', bronzeMetrics)).toBe(true);
    expect(isAchievementUnlocked('silver_helper', bronzeMetrics)).toBe(false);

    // 10 verified contributions unlocks Silver Helper
    const silverMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, verified_contributions: 10 };
    expect(isAchievementUnlocked('silver_helper', silverMetrics)).toBe(true);
    expect(isAchievementUnlocked('gold_helper', silverMetrics)).toBe(false);

    // 25 verified contributions unlocks Gold Helper
    const goldMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, verified_contributions: 25 };
    expect(isAchievementUnlocked('gold_helper', goldMetrics)).toBe(true);
    expect(isAchievementUnlocked('campus_hero', goldMetrics)).toBe(false);

    // 50 verified contributions unlocks Campus Hero
    const heroMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, verified_contributions: 50 };
    expect(isAchievementUnlocked('campus_hero', heroMetrics)).toBe(true);

    // 5 recoveries unlocks Recovery Champion
    const recoveryMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, completed_recoveries: 5 };
    expect(isAchievementUnlocked('recovery_champion', recoveryMetrics)).toBe(true);

    // 10 moderator-verified items unlocks Trusted Contributor
    const modMetrics: AuthoritativeUserMetrics = { ...zeroMetrics, moderator_verified: 10 };
    expect(isAchievementUnlocked('trusted_contributor', modMetrics)).toBe(true);
  });

  it('computes milestone progress and determines next milestone accurately', () => {
    const metrics: AuthoritativeUserMetrics = {
      found_reports: 1,
      verified_contributions: 2,
      completed_recoveries: 1,
      moderator_verified: 0,
    };

    const earned: UserAchievement[] = [
      {
        id: 'ua-1',
        user_id: 'u-1',
        campus_id: 'c-1',
        achievement_code: 'first_finder',
        earned_at: '2026-10-24T00:00:00Z',
      },
    ];

    const milestones = calculateMilestones(metrics, earned);
    expect(milestones).toHaveLength(7);

    const firstFinder = milestones.find(m => m.achievement.code === 'first_finder');
    expect(firstFinder?.is_unlocked).toBe(true);
    expect(firstFinder?.percentage).toBe(100);

    const bronze = milestones.find(m => m.achievement.code === 'bronze_helper');
    expect(bronze?.is_unlocked).toBe(false);
    expect(bronze?.current_count).toBe(2);
    expect(bronze?.target_count).toBe(3);
    expect(bronze?.percentage).toBe(67); // 2/3 * 100 rounded

    const next = getNextMilestone(milestones);
    expect(next?.achievement.code).toBe('bronze_helper');
  });

  it('determines the user achievement level title based on contributions', () => {
    expect(calculateAchievementLevel([], 0)).toBe('Campus Scout');
    expect(calculateAchievementLevel([], 1)).toBe('First Finder');
    expect(calculateAchievementLevel([], 3)).toBe('Bronze Helper');
    expect(calculateAchievementLevel([], 10)).toBe('Silver Helper');
    expect(calculateAchievementLevel([], 25)).toBe('Gold Helper');
    expect(calculateAchievementLevel([], 50)).toBe('Campus Hero');

    // When specific badges are present
    const withChampion: UserAchievement[] = [
      {
        id: 'ua-2',
        user_id: 'u-1',
        campus_id: 'c-1',
        achievement_code: 'recovery_champion',
        earned_at: '2026-10-24T00:00:00Z',
      },
    ];
    expect(calculateAchievementLevel(withChampion, 5)).toBe('Recovery Champion');
  });

  it('provides all 7 required achievement definitions with proper metadata', () => {
    const expectedCodes = [
      'first_finder',
      'bronze_helper',
      'silver_helper',
      'gold_helper',
      'campus_hero',
      'recovery_champion',
      'trusted_contributor',
    ];

    expectedCodes.forEach(code => {
      // @ts-expect-error key access
      const def = ACHIEVEMENT_DEFINITIONS[code];
      expect(def).toBeDefined();
      expect(def.title).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.target_count).toBeGreaterThan(0);
      expect(def.icon_name).toBeTruthy();
    });
  });
});
