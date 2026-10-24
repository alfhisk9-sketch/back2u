import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  switchDemoUser,
  getAvailableDemoUsers,
  getCampuses,
  getCurrentCampusId,
  setCurrentCampusId,
  subscribeDataChanges,
} from '../../services/dataService';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, Campus } from '../../types';
import { Sparkles, Building, UserCheck } from 'lucide-react';

export const DevBar: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [activeCampusId, setActiveCampusId] = useState<string>('');

  useEffect(() => {
    const refresh = async () => {
      const user = await getCurrentUser();
      const campusList = await getCampuses();
      setCurrentUser(user);
      setCampuses(campusList);
      setActiveCampusId(getCurrentCampusId());
    };

    refresh();
    return subscribeDataChanges(refresh);
  }, []);

  const demoUsers = getAvailableDemoUsers();

  return (
    <aside
      aria-label="Development & Evaluation Mode Switcher"
      className="bg-[#0C1A15] text-[#E1E8E4] text-xs border-b border-emerald-950/40 px-3 py-1.5 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Environment Tag */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-spin-slow" />
            {isSupabaseConfigured ? 'Supabase Live Connected' : 'Evaluation & Demo Mode'}
          </span>
          <span className="hidden sm:inline text-neutral-400">
            {isSupabaseConfigured
              ? 'Using PostgreSQL & Auth'
              : 'Interactive seed records & instant role switching for judges & testing'}
          </span>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-3">
          {/* Campus Switcher */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <label htmlFor="dev-campus-select" className="text-neutral-400 font-medium hidden md:inline">
              Campus:
            </label>
            <select
              id="dev-campus-select"
              value={activeCampusId}
              onChange={e => setCurrentCampusId(e.target.value)}
              className="bg-[#142921] border border-[#234237] text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {campuses.map(campus => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          {/* Persona Switcher */}
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <label htmlFor="dev-role-select" className="text-neutral-400 font-medium hidden md:inline">
              Test Role:
            </label>
            <select
              id="dev-role-select"
              value={currentUser?.id || ''}
              onChange={e => switchDemoUser(e.target.value)}
              className="bg-[#142921] border border-[#234237] text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
            >
              {demoUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Role Badge Indicator */}
          {currentUser && (
            <span
              className={`px-2 py-0.5 rounded font-mono uppercase text-[10px] tracking-wide font-bold ${
                currentUser.role === 'admin'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                  : currentUser.role === 'moderator'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
              }`}
            >
              {currentUser.role}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
