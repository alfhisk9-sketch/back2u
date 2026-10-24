import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Award, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { getUserRewardsSummary, subscribeDataChanges } from '../../services/dataService';
import type { UserRewardsSummary } from '../../types';
import { Button } from '../ui/Button';

interface RewardsSummaryCardProps {
  userId: string;
}

export const RewardsSummaryCard: React.FC<RewardsSummaryCardProps> = ({ userId }) => {
  const [summary, setSummary] = useState<UserRewardsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const data = await getUserRewardsSummary(userId);
      setSummary(data);
    } catch (err) {
      console.warn('Failed to load user rewards summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    return subscribeDataChanges(loadSummary);
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 animate-pulse">
        <div className="h-4 bg-[#E1E8E4] rounded w-1/4 mb-3"></div>
        <div className="h-8 bg-[#E1E8E4] rounded w-1/2"></div>
      </div>
    );
  }

  if (!summary) return null;

  const nextMilestone = summary.next_milestone;

  return (
    <div className="bg-gradient-to-br from-[#0F3628] via-[#12241E] to-[#1A332B] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-emerald-900/50 mb-6">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-20 -mb-6 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left column: Stars balance & Level */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Back2You Stars
            </span>
            <span className="text-xs text-emerald-200/60">•</span>
            <span className="text-xs text-emerald-200/80 font-medium">
              Rank #{summary.leaderboard_rank} on Campus
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-400/40 text-amber-300 shadow-inner">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {summary.current_stars}
              </span>
            </div>
            <span className="text-sm font-semibold text-emerald-200/70">
              Total Stars Earned
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10 text-emerald-100 font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Level: {summary.achievement_level}
            </div>
            <span className="text-emerald-200/60">
              {summary.verified_contributions} verified contribution{summary.verified_contributions === 1 ? '' : 's'}
            </span>
            <span className="text-emerald-200/60">•</span>
            <span className="text-emerald-200/60">
              {summary.completed_recoveries} recovery return{summary.completed_recoveries === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Right column: Next milestone progress & CTA */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
          {nextMilestone ? (
            <div className="space-y-1.5 min-w-[200px]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-200 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Next: {nextMilestone.achievement.title}
                </span>
                <span className="text-amber-300 font-mono">
                  {nextMilestone.current_count}/{nextMilestone.target_count} ({nextMilestone.percentage}%)
                </span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${nextMilestone.percentage}%` }}
                />
              </div>
              <p className="text-[11px] text-emerald-200/70">
                {nextMilestone.target_count - nextMilestone.current_count} more to unlock badge
              </p>
            </div>
          ) : (
            <div className="text-xs text-emerald-200 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Award className="w-4 h-4" /> All Milestones Achieved!
              </span>
              <p className="text-[11px] text-emerald-200/80">You are a premier campus recovery hero.</p>
            </div>
          )}

          <Link to="/rewards" className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 cursor-pointer"
            >
              Rewards & Leaderboard
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
