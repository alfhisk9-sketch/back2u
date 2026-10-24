import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Award,
  Crown,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Lock,
  Calendar,
  Building,
  TrendingUp,
  Sparkles,
  History,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  getCurrentUser,
  getCampuses,
  getCurrentCampusId,
  getUserRewardsSummary,
  getCampusLeaderboard,
  subscribeDataChanges,
} from '../services/dataService';
import type {
  Profile,
  Campus,
  UserRewardsSummary,
  LeaderboardEntry,
  AchievementTier,
} from '../types';
import { Button } from '../components/ui/Button';

// Icon resolver helper for achievement badges
const renderAchievementIcon = (iconName: string, className = 'w-6 h-6') => {
  switch (iconName) {
    case 'Compass':
      return <Compass className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    default:
      return <Award className={className} />;
  }
};

const getTierStyles = (tier: AchievementTier, isUnlocked: boolean) => {
  if (!isUnlocked) {
    return {
      card: 'bg-[#FAF9F6] border-[#CBD5CE] opacity-80',
      badge: 'bg-stone-200 text-stone-600 border-stone-300',
      iconBox: 'bg-stone-100 text-stone-400 border-stone-300',
    };
  }

  switch (tier) {
    case 'emerald':
      return {
        card: 'bg-gradient-to-br from-emerald-50 to-teal-50/80 border-emerald-300 shadow-sm',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        iconBox: 'bg-emerald-600 text-white border-emerald-500 shadow-xs',
      };
    case 'gold':
      return {
        card: 'bg-gradient-to-br from-amber-50 to-yellow-50/80 border-amber-300 shadow-sm',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        iconBox: 'bg-amber-500 text-white border-amber-400 shadow-xs',
      };
    case 'silver':
      return {
        card: 'bg-gradient-to-br from-slate-50 to-stone-50 border-slate-300 shadow-sm',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        iconBox: 'bg-slate-600 text-white border-slate-500 shadow-xs',
      };
    case 'bronze':
    default:
      return {
        card: 'bg-gradient-to-br from-orange-50/70 to-amber-50/50 border-amber-200 shadow-sm',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        iconBox: 'bg-amber-700 text-white border-amber-600 shadow-xs',
      };
  }
};

export const RewardsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [summary, setSummary] = useState<UserRewardsSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard' | 'history'>('badges');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      const campusId = getCurrentCampusId();
      const campuses = await getCampuses();
      const campus = campuses.find(c => c.id === campusId) || null;
      setActiveCampus(campus);

      if (user) {
        const userSummary = await getUserRewardsSummary(user.id);
        setSummary(userSummary);
      }

      const board = await getCampusLeaderboard(campusId, timeframe);
      setLeaderboard(board);
    } catch (err) {
      console.warn('Failed to load rewards dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-[#536B63]">
        <div className="w-9 h-9 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading Back2You Stars & Achievements...
      </div>
    );
  }

  if (!currentUser || !summary) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm font-semibold text-[#12241E]">Sign In Required</p>
        <p className="text-xs text-[#536B63] mt-2">
          Please sign in to view your Back2You Stars balance, earned badges, and campus ranking.
        </p>
        <Link to="/login" className="mt-4 inline-block">
          <Button variant="primary" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const nextMilestone = summary.next_milestone;
  const filteredMilestones = summary.milestones.filter(m => {
    if (badgeFilter === 'earned') return m.is_unlocked;
    if (badgeFilter === 'locked') return !m.is_unlocked;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#E1E8E4] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              Verified Contribution Rewards
            </span>
            <span className="text-xs text-[#536B63]">•</span>
            <span className="text-xs font-semibold text-[#12241E] flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#059669]" /> {activeCampus?.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight mt-1">
            Back2You Stars & Achievements
          </h1>
          <p className="text-xs text-[#536B63] mt-0.5">
            Earn Stars, unlock milestone badges, and get recognized for reuniting lost belongings across campus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/report">
            <Button variant="primary" size="sm">
              Report Found Item (+10★)
            </Button>
          </Link>
        </div>
      </div>

      {/* Rewards Hero Banner */}
      <div className="mt-6 bg-gradient-to-br from-[#0F3628] via-[#12241E] to-[#1A332B] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-emerald-900/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-8 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main User Stat */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center border border-amber-400/40 text-amber-300 shadow-inner">
                <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white block">
                  {summary.current_stars}
                </span>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-200/80">
                  Total Stars Earned
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/10 font-bold text-amber-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> {summary.achievement_level}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/10 font-semibold text-emerald-100">
                Rank #{summary.leaderboard_rank} on Campus
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/10 font-medium text-emerald-200/80">
                {summary.verified_contributions} Verified Contribution{summary.verified_contributions === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/10 font-medium text-emerald-200/80">
                {summary.completed_recoveries} Item{summary.completed_recoveries === 1 ? '' : 's'} Returned
              </span>
            </div>
          </div>

          {/* Next Milestone Box */}
          <div className="md:col-span-5 bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-xs space-y-3">
            {nextMilestone ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-amber-400" /> Next Milestone
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {nextMilestone.percentage}%
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {nextMilestone.achievement.title}
                  </h3>
                  <p className="text-xs text-emerald-200/70 mt-0.5">
                    {nextMilestone.achievement.description}
                  </p>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${nextMilestone.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-200/80 font-medium">
                  <span>Current: {nextMilestone.current_count}</span>
                  <span>Goal: {nextMilestone.target_count}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-2 space-y-2">
                <Crown className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-base font-extrabold text-white">Legendary Campus Hero!</h3>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  You have unlocked all currently available milestone achievements. Thank you for your leadership in keeping campus belongings safe!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-[#E1E8E4] flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'badges'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-[#536B63] hover:text-[#12241E]'
          }`}
        >
          <Award className="w-4 h-4" />
          Achievement Badges ({summary.earned_achievements.length}/{summary.milestones.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'leaderboard'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-[#536B63] hover:text-[#12241E]'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-600" />
          Campus Leaderboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-[#536B63] hover:text-[#12241E]'
          }`}
        >
          <History className="w-4 h-4" />
          Reward Ledger ({summary.recent_transactions.length})
        </button>
      </div>

      {/* TAB 1: ACHIEVEMENT BADGES */}
      {activeTab === 'badges' && (
        <div className="mt-6 space-y-6">
          {/* Sub-filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1.5 bg-[#FAF9F6] p-1 rounded-xl border border-[#CBD5CE]">
              <button
                type="button"
                onClick={() => setBadgeFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  badgeFilter === 'all'
                    ? 'bg-white text-[#12241E] shadow-2xs'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                All Badges ({summary.milestones.length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('earned')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  badgeFilter === 'earned'
                    ? 'bg-white text-[#12241E] shadow-2xs'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                Unlocked ({summary.earned_achievements.length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('locked')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  badgeFilter === 'locked'
                    ? 'bg-white text-[#12241E] shadow-2xs'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                Locked ({summary.milestones.length - summary.earned_achievements.length})
              </button>
            </div>

            {/* How to earn info pill */}
            <div className="text-xs text-[#536B63] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#059669]" />
              Found reports (+10★) • Moderator verify (+15★) • Recovery returns (+25★)
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMilestones.map(m => {
              const def = m.achievement;
              const isUnlocked = m.is_unlocked;
              const styles = getTierStyles(def.badge_tier, isUnlocked);
              const earnedRecord = summary.earned_achievements.find(
                a => a.achievement_code === def.code
              );

              return (
                <div
                  key={def.code}
                  className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${styles.card}`}
                >
                  <div>
                    {/* Header: Tier & Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}
                      >
                        {def.badge_tier} Tier
                      </span>
                      {isUnlocked ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-300 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-stone-400" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Icon and Title */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${styles.iconBox}`}
                      >
                        {renderAchievementIcon(def.icon_name)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-[#12241E] leading-snug">
                          {def.title}
                        </h3>
                        <p className="text-xs text-[#536B63] leading-relaxed">
                          {def.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress or Earned Footer */}
                  <div className="mt-5 pt-3 border-t border-[#E1E8E4]/60">
                    {isUnlocked ? (
                      <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        Unlocked{' '}
                        {earnedRecord
                          ? new Date(earnedRecord.earned_at).toLocaleDateString()
                          : 'Active'}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#536B63]">
                          <span>Progress</span>
                          <span className="font-mono text-[#12241E]">
                            {m.current_count} / {m.target_count} ({m.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#E1E8E4] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${m.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CAMPUS LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="mt-6 space-y-6">
          {/* Timeframe & Privacy Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-1.5 bg-[#FAF9F6] p-1 rounded-xl border border-[#CBD5CE]">
              <button
                type="button"
                onClick={() => setTimeframe('all_time')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'all_time'
                    ? 'bg-white text-[#12241E] shadow-2xs font-bold'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                All-Time
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-white text-[#12241E] shadow-2xs font-bold'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                Past 30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-white text-[#12241E] shadow-2xs font-bold'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                This Week
              </button>
            </div>

            <div className="text-[11px] text-[#536B63] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E1E8E4]">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              <strong>Privacy Guaranteed:</strong> Student IDs, emails & phone numbers are never exposed.
            </div>
          </div>

          {/* Podium for Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto pt-6 pb-2 items-end">
              {/* 2nd Place */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs flex flex-col items-center order-1">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center mb-2">
                  2
                </span>
                <img
                  src={
                    leaderboard[1].avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      leaderboard[1].display_name
                    )}`
                  }
                  alt={leaderboard[1].display_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 shadow-2xs"
                />
                <h4 className="text-xs font-bold text-[#12241E] mt-2 truncate max-w-full">
                  {leaderboard[1].display_name}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-amber-700 font-extrabold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {leaderboard[1].stars}★
                </div>
                <span className="text-[10px] text-[#536B63] mt-0.5">
                  {leaderboard[1].verified_contributions} contributions
                </span>
              </div>

              {/* 1st Place */}
              <div className="bg-gradient-to-b from-amber-50/80 to-white rounded-2xl border-2 border-amber-300 p-5 text-center shadow-md flex flex-col items-center order-2 relative scale-105 z-10">
                <Crown className="w-6 h-6 text-amber-500 -mt-2 mb-1 animate-bounce" />
                <span className="w-7 h-7 rounded-full bg-amber-400 text-white text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                  1
                </span>
                <img
                  src={
                    leaderboard[0].avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      leaderboard[0].display_name
                    )}`
                  }
                  alt={leaderboard[0].display_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                />
                <h4 className="text-sm font-extrabold text-[#12241E] mt-2 truncate max-w-full">
                  {leaderboard[0].display_name}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-amber-700 font-black text-sm">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {leaderboard[0].stars}★
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full mt-1">
                  {leaderboard[0].achievement_level}
                </span>
              </div>

              {/* 3rd Place */}
              <div className="bg-white rounded-2xl border border-amber-100 p-4 text-center shadow-2xs flex flex-col items-center order-3">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-xs font-black flex items-center justify-center mb-2">
                  3
                </span>
                <img
                  src={
                    leaderboard[2].avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      leaderboard[2].display_name
                    )}`
                  }
                  alt={leaderboard[2].display_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-2xs"
                />
                <h4 className="text-xs font-bold text-[#12241E] mt-2 truncate max-w-full">
                  {leaderboard[2].display_name}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-amber-700 font-extrabold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {leaderboard[2].stars}★
                </div>
                <span className="text-[10px] text-[#536B63] mt-0.5">
                  {leaderboard[2].verified_contributions} contributions
                </span>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E1E8E4] text-[#536B63] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Campus Contributor</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4 text-center">Verified Actions</th>
                  <th className="py-3 px-4 text-right">Back2You Stars</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8E4]">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#536B63]">
                      No recorded contributions for this timeframe yet. Be the first to report a found item!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map(entry => {
                    const isSelf = entry.user_id === currentUser.id;
                    return (
                      <tr
                        key={entry.user_id}
                        className={`hover:bg-[#FAF9F6] transition-colors ${
                          isSelf ? 'bg-emerald-50/70 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {entry.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-white font-extrabold text-xs">
                              1
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-extrabold text-xs">
                              2
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-extrabold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-[#536B63] font-mono font-bold">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                entry.avatar_url ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                  entry.display_name
                                )}`
                              }
                              alt={entry.display_name}
                              className="w-8 h-8 rounded-full object-cover border border-[#CBD5CE]"
                            />
                            <div>
                              <span className="font-bold text-[#12241E] block">
                                {entry.display_name}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-200 px-1.5 py-0.2 rounded">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-[#536B63]">
                                {entry.badge_count} badge{entry.badge_count === 1 ? '' : 's'} earned
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF9F6] text-[#12241E] border border-[#CBD5CE]">
                            {entry.achievement_level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-[#12241E]">
                          {entry.verified_contributions}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {entry.stars}★
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REWARD TRANSACTION LEDGER */}
      {activeTab === 'history' && (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E1E8E4] text-[#536B63] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Contribution Event</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Stars Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8E4]">
                {summary.recent_transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#536B63]">
                      No Stars transactions recorded yet. Report a found item to start earning!
                    </td>
                  </tr>
                ) : (
                  summary.recent_transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3 px-4 text-[#536B63] font-mono">
                        {new Date(tx.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#12241E]">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] uppercase">
                          {tx.event_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#536B63]">{tx.description}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                          +{tx.points}★
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
