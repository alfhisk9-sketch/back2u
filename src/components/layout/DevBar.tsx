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

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.DEV;

  // Security Hardening: Never render DevBar in production unless explicitly in demo mode
  if (import.meta.env.PROD && !isDemo) {
    return null;
  }

  const demoUsers = getAvailableDemoUsers();

  return (
    <aside
      aria-label="Demo Account Switcher"
      className="bg-[#0A1A14] text-[#E1E8E4] text-xs border-b border-emerald-900/60 px-3 py-2 shadow-inner"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Visible DEMO MODE Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            DEMO MODE
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-300 font-semibold text-xs bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {isSupabaseConfigured ? 'Supabase Live Connected' : 'Sample Campus Data'}
          </span>

          <span className="hidden lg:inline text-[#8EA59E] text-[11px]">
            Switch student personas instantly to review personal reports, claims, and Stars.
          </span>
        </div>

        {/* Right: Quick Persona Switcher Buttons & Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Direct Continue As Quick Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 hidden xl:inline">
              Switch Persona:
            </span>
            {demoUsers
              .filter(u => u.role === 'student')
              .map(u => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => switchDemoUser(u.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-300 shadow-sm font-bold scale-105'
                        : 'bg-[#142C23] hover:bg-[#1A382D] text-emerald-200 border-[#234237]'
                    }`}
                    title={`Continue as ${u.full_name} (${u.team_designation || 'Student'})`}
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-900/60 text-emerald-200 text-[10px] flex items-center justify-center font-bold">
                      {u.full_name.slice(0, 2).toUpperCase()}
                    </span>
                    <span>Continue as {u.full_name}</span>
                    {u.team_designation && (
                      <span className="text-[10px] opacity-75 font-normal hidden md:inline">
                        • {u.team_designation}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Full Dropdown for all roles including Moderator */}
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              id="dev-role-select"
              aria-label="Select Demo User"
              value={currentUser?.id || ''}
              onChange={e => switchDemoUser(e.target.value)}
              className="bg-[#142C23] border border-[#234237] text-white rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
            >
              {demoUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} {u.team_designation ? `(${u.team_designation})` : `(${u.role})`}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Indicator / Switcher */}
          {campuses.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                id="dev-campus-select"
                aria-label="Select Campus Scope"
                value={activeCampusId}
                onChange={e => setCurrentCampusId(e.target.value)}
                className="bg-[#142C23] border border-[#234237] text-emerald-100 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {campuses.map(campus => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Role & Team Badge */}
          {currentUser && (
            <div className="flex items-center gap-1">
              <span
                className={`px-2 py-0.5 rounded-full font-mono uppercase text-[10px] tracking-wide font-bold ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-600/50'
                    : currentUser.role === 'moderator'
                    ? 'bg-amber-900/80 text-amber-200 border border-amber-600/50'
                    : 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/50'
                }`}
              >
                {currentUser.role}
              </span>
              {currentUser.team_designation && (
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  {currentUser.team_designation}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
