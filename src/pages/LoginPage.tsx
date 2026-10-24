import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Lock,
  Mail,
  User,
  Sparkles,
} from 'lucide-react';
import {
  getCampuses,
  getAvailableDemoUsers,
  switchDemoUser,
} from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Campus } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const list = await getCampuses();
      setCampuses(list);
      if (list.length > 0) setSelectedCampusId(list[0].id);
    };
    load();
  }, []);

  const demoUsers = getAvailableDemoUsers();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                campus_id: selectedCampusId,
              },
            },
          });
          if (error) throw error;
          setMessage({
            type: 'success',
            text: 'Account registered! Please check your campus email to verify your session.',
          });
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          navigate('/my-reports');
        }
      } else {
        // In local/demo mode: match email or create profile
        const matched = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          switchDemoUser(matched.id);
        } else {
          // Switch to student
          switchDemoUser(demoUsers[0].id);
        }
        navigate('/my-reports');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const selectPersona = (userId: string) => {
    switchDemoUser(userId);
    navigate('/my-reports');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-[#E1E8E4] shadow-sm">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#059669] to-[#064E3B] flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#12241E] tracking-tight">
            {isRegister ? 'Join Your Campus Community' : 'Sign in to Back2You'}
          </h2>
          <p className="mt-1 text-xs text-[#536B63]">
            {isRegister
              ? 'Connect with your university lost-and-found registry'
              : 'Access your reports, verify matches, and coordinate returns'}
          </p>
        </div>

        {/* Message Feedback */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Fast Persona Switcher for Testing & Demonstration */}
        <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#CBD5CE] space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#12241E]">
            <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
            <span>Instant Demo Logins (Zero Friction)</span>
          </div>
          <p className="text-[11px] text-[#536B63]">
            Click any test role to immediately test student reporting, moderator auditing, or administrator governance:
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => selectPersona('u-alice-stanford')}
              className="text-left px-3 py-1.5 rounded-lg bg-white border border-[#CBD5CE] hover:border-[#059669] text-xs font-semibold text-[#12241E] flex items-center justify-between cursor-pointer"
            >
              <span>Alice Chen (Student, Stanford)</span>
              <span className="text-[10px] text-[#059669] font-bold uppercase">Log In →</span>
            </button>
            <button
              type="button"
              onClick={() => selectPersona('u-marcus-mod')}
              className="text-left px-3 py-1.5 rounded-lg bg-white border border-[#CBD5CE] hover:border-amber-600 text-xs font-semibold text-amber-900 flex items-center justify-between cursor-pointer"
            >
              <span>Officer Marcus (Moderator, Stanford)</span>
              <span className="text-[10px] text-amber-700 font-bold uppercase">Log In →</span>
            </button>
            <button
              type="button"
              onClick={() => selectPersona('u-sarah-admin')}
              className="text-left px-3 py-1.5 rounded-lg bg-white border border-[#CBD5CE] hover:border-purple-600 text-xs font-semibold text-purple-900 flex items-center justify-between cursor-pointer"
            >
              <span>Dr. Sarah Jenkins (Platform Admin)</span>
              <span className="text-[10px] text-purple-700 font-bold uppercase">Log In →</span>
            </button>
          </div>
        </div>

        {/* Traditional Credentials Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <Input
                  label="Full Name"
                  leftIcon={<User className="w-4 h-4" />}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Alice Chen"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
                  Select Your Campus
                </label>
                <select
                  value={selectedCampusId}
                  onChange={e => setSelectedCampusId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#CBD5CE] bg-white px-3 py-2 text-[#12241E] cursor-pointer"
                >
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <Input
              type="email"
              label="Campus or Personal Email"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. student@stanford.edu"
              required
            />
          </div>

          <div>
            <Input
              type="password"
              label="Password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isLoading}
          >
            {isRegister ? 'Complete Registration' : 'Sign In'}
          </Button>
        </form>

        {/* Toggle Signin / Register */}
        <div className="text-center text-xs text-[#536B63] pt-2 border-t border-[#E1E8E4]">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-[#059669] font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              First time on Back2You?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-[#059669] font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
