import type {
  RewardEventType,
  AchievementCode,
  AchievementDefinition,
  UserAchievement,
  MilestoneProgress,
} from '../types';

/* =============================================================================
   REWARD RULES & POINT AMOUNTS
   Centralized, configurable point values and rule definitions
   ============================================================================= */

export const REWARD_POINTS: Record<RewardEventType, number> = {
  found_report_accepted: 10,
  moderator_verified: 15,
  recovery_completed: 25,
  helpful_report_recovery: 10,
};

export const REWARD_EVENT_DESCRIPTIONS: Record<RewardEventType, string> = {
  found_report_accepted: 'Valid found-item report accepted',
  moderator_verified: 'Moderator verification of found item',
  recovery_completed: 'Successfully completed item recovery handover',
  helpful_report_recovery: 'Helpful report leading to verified return',
};

/* =============================================================================
   ACHIEVEMENT DEFINITIONS
   ============================================================================= */

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementCode, AchievementDefinition> = {
  first_finder: {
    code: 'first_finder',
    title: 'First Finder',
    description: 'Submitted first qualifying found-item report.',
    badge_tier: 'bronze',
    icon_name: 'Compass',
    target_count: 1,
    metric: 'found_reports',
  },
  bronze_helper: {
    code: 'bronze_helper',
    title: 'Bronze Helper',
    description: 'Achieved 3 verified campus contributions.',
    badge_tier: 'bronze',
    icon_name: 'Award',
    target_count: 3,
    metric: 'verified_contributions',
  },
  silver_helper: {
    code: 'silver_helper',
    title: 'Silver Helper',
    description: 'Achieved 10 verified campus contributions.',
    badge_tier: 'silver',
    icon_name: 'ShieldCheck',
    target_count: 10,
    metric: 'verified_contributions',
  },
  gold_helper: {
    code: 'gold_helper',
    title: 'Gold Helper',
    description: 'Achieved 25 verified campus contributions.',
    badge_tier: 'gold',
    icon_name: 'Star',
    target_count: 25,
    metric: 'verified_contributions',
  },
  campus_hero: {
    code: 'campus_hero',
    title: 'Campus Hero',
    description: 'Achieved 50 verified campus contributions.',
    badge_tier: 'emerald',
    icon_name: 'Crown',
    target_count: 50,
    metric: 'verified_contributions',
  },
  recovery_champion: {
    code: 'recovery_champion',
    title: 'Recovery Champion',
    description: 'Successfully completed 5 item returns.',
    badge_tier: 'gold',
    icon_name: 'HeartHandshake',
    target_count: 5,
    metric: 'completed_recoveries',
  },
  trusted_contributor: {
    code: 'trusted_contributor',
    title: 'Trusted Contributor',
    description: 'Received 10 moderator-verified found-item reports.',
    badge_tier: 'silver',
    icon_name: 'CheckCircle2',
    target_count: 10,
    metric: 'moderator_verified',
  },
};

export const ALL_ACHIEVEMENT_CODES: AchievementCode[] = [
  'first_finder',
  'bronze_helper',
  'silver_helper',
  'gold_helper',
  'campus_hero',
  'recovery_champion',
  'trusted_contributor',
];

/* =============================================================================
   IDEMPOTENCY KEY GENERATORS
   Guarantees that retry operations or duplicate submissions never issue extra points
   ============================================================================= */

export function makeFoundReportKey(itemId: string): string {
  return `found_report_${itemId}`;
}

export function makeModeratorVerifiedKey(itemId: string): string {
  return `mod_verified_${itemId}`;
}

export function makeRecoveryCompletedKey(claimId: string, userId: string): string {
  return `recovery_completed_${claimId}_${userId}`;
}

export function makeHelpfulReportKey(itemId: string, userId: string): string {
  return `helpful_report_${itemId}_${userId}`;
}

/* =============================================================================
   AUTHORITATIVE METRIC EVALUATIONS
   ============================================================================= */

export interface AuthoritativeUserMetrics {
  found_reports: number;
  verified_contributions: number;
  completed_recoveries: number;
  moderator_verified: number;
}

/**
 * Evaluates whether an achievement is unlocked given authoritative user metrics.
 */
export function isAchievementUnlocked(
  code: AchievementCode,
  metrics: AuthoritativeUserMetrics
): boolean {
  const def = ACHIEVEMENT_DEFINITIONS[code];
  if (!def) return false;
  const count = metrics[def.metric] || 0;
  return count >= def.target_count;
}

/**
 * Computes milestone progress across all achievements for a user.
 */
export function calculateMilestones(
  metrics: AuthoritativeUserMetrics,
  earnedAchievements: UserAchievement[]
): MilestoneProgress[] {
  const earnedCodes = new Set(earnedAchievements.map(a => a.achievement_code));

  return ALL_ACHIEVEMENT_CODES.map(code => {
    const def = ACHIEVEMENT_DEFINITIONS[code];
    const current_count = metrics[def.metric] || 0;
    const is_unlocked = earnedCodes.has(code) || current_count >= def.target_count;
    const percentage = Math.min(100, Math.round((current_count / def.target_count) * 100));

    return {
      achievement: def,
      current_count,
      target_count: def.target_count,
      percentage,
      is_unlocked,
    };
  });
}

/**
 * Identifies the next most relevant locked milestone to show on student cards.
 */
export function getNextMilestone(milestones: MilestoneProgress[]): MilestoneProgress | undefined {
  // Sort locked milestones by proximity to completion (highest percentage first)
  const locked = milestones.filter(m => !m.is_unlocked);
  if (locked.length === 0) return undefined;
  return locked.sort((a, b) => b.percentage - a.percentage)[0];
}

/**
 * Calculates current achievement level title based on earned badges and verified contributions.
 */
export function calculateAchievementLevel(
  earnedAchievements: UserAchievement[],
  contributions: number
): string {
  const codes = new Set(earnedAchievements.map(a => a.achievement_code));

  if (codes.has('campus_hero') || contributions >= 50) return 'Campus Hero';
  if (codes.has('gold_helper') || contributions >= 25) return 'Gold Helper';
  if (codes.has('recovery_champion')) return 'Recovery Champion';
  if (codes.has('silver_helper') || contributions >= 10) return 'Silver Helper';
  if (codes.has('trusted_contributor')) return 'Trusted Contributor';
  if (codes.has('bronze_helper') || contributions >= 3) return 'Bronze Helper';
  if (codes.has('first_finder') || contributions >= 1) return 'First Finder';
  return 'Campus Scout';
}
