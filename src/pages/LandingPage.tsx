import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Lock,
  ChevronDown,
} from 'lucide-react';
import {
  getItems,
  getCampuses,
  getCurrentCampusId,
  getCampusMetrics,
  subscribeDataChanges,
} from '../services/dataService';
import type { Item, Campus } from '../types';
import { ItemCard } from '../components/items/ItemCard';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [metrics, setMetrics] = useState({
    totalReports: 0,
    resolvedItems: 0,
    openClaims: 0,
    recoveryRate: 0,
  });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const loadData = async () => {
    const campusId = getCurrentCampusId();
    const campusList = await getCampuses();
    setActiveCampus(campusList.find(c => c.id === campusId) || campusList[0] || null);

    const items = await getItems({ campus_id: campusId });
    setRecentItems(items.slice(0, 4));

    const stats = await getCampusMetrics(campusId);
    setMetrics(stats);
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const faqs = [
    {
      q: 'How does the Smart Matching Engine work?',
      a: 'When you report an item, Back2You runs a 100-point normalized explainable similarity algorithm comparing category (30 pts), title and keyword tokens (25 pts), campus location (20 pts), date proximity (15 pts), and color (10 pts). If a match exceeds 50%, both parties receive an instant in-app notification with a clear breakdown explaining why the items matched.',
    },
    {
      q: 'Are my private belongings and identity card details protected?',
      a: 'Yes. Back2You strictly separates publicly visible descriptions from private ownership verification clues (such as engraved initials, lock screen wallpaper, or masked ID numbers). In addition, listings are strictly isolated to your authorized campus through database Row Level Security (RLS) policies.',
    },
    {
      q: 'How do item handovers take place safely?',
      a: 'Back2You coordinates item returns through designated campus locations, specifically your University Campus Security Desk, Student Union Information Desk, or Library Circulation Desk. We never advise meeting in unmonitored or off-campus areas.',
    },
    {
      q: 'Can anyone claim an item without proof?',
      a: 'No. To claim an item, a claimant must submit private ownership proof answering specific verification details. The poster or campus moderator reviews this proof before approving the handover.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EBF2EE] via-[#F4F7F5] to-[#FAF9F6] pt-14 pb-20 border-b border-[#E1E8E4]">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-50/60 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Campus Lost & Found Platform</span>
            {activeCampus && (
              <span className="text-emerald-950 font-bold border-l border-emerald-300 pl-2">
                {activeCampus.name.split(' ')[0]} Edition
              </span>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#12241E] max-w-4xl mx-auto leading-[1.15]">
            Lost something? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] via-[#047857] to-[#064E3B]">
              Let's bring it back to you.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#536B63] max-w-2xl mx-auto leading-relaxed">
            A centralized, privacy-first recovery platform for universities. Report missing belongings, get intelligent match suggestions, verify claims, and coordinate safe campus handovers.
          </p>

          {/* Instant Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl border border-[#CBD5CE] shadow-lg shadow-emerald-950/5"
          >
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="w-5 h-5 text-[#7C938C] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search lost items (e.g. Student ID, Hydro Flask, AirPods, Keys)..."
                className="w-full px-3 py-2.5 text-sm text-[#12241E] placeholder-[#8EA59E] focus:outline-none bg-transparent"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl shrink-0"
            >
              Search Campus
            </Button>
          </form>

          {/* Dual Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/explore">
              <Button variant="outline" size="md" className="rounded-xl">
                Browse Campus Listings
              </Button>
            </Link>
            <Link to="/report">
              <Button
                variant="primary"
                size="md"
                className="rounded-xl"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Report Lost or Found Item
              </Button>
            </Link>
          </div>

          {/* Live Campus Database Scope Statistics */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-[#E1E8E4] shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C938C] block">
                Total Campus Reports
              </span>
              <span className="text-2xl font-bold text-[#12241E] mt-0.5 block">
                {metrics.totalReports}
              </span>
              <span className="text-[10px] text-[#536B63]">Active campus records</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-[#E1E8E4] shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C938C] block">
                Reunited Belongings
              </span>
              <span className="text-2xl font-bold text-[#059669] mt-0.5 block">
                {metrics.resolvedItems}
              </span>
              <span className="text-[10px] text-[#536B63]">Verified returns</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-[#E1E8E4] shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C938C] block">
                Recovery Rate
              </span>
              <span className="text-2xl font-bold text-[#12241E] mt-0.5 block">
                {metrics.recoveryRate}%
              </span>
              <span className="text-[10px] text-[#536B63]">Return ratio</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-[#E1E8E4] shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C938C] block">
                Pending Claims
              </span>
              <span className="text-2xl font-bold text-amber-700 mt-0.5 block">
                {metrics.openClaims}
              </span>
              <span className="text-[10px] text-[#536B63]">Under review</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Recovery Workflow */}
      <section className="py-16 bg-white border-b border-[#E1E8E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#059669] mb-2">
              How Back2You Works
            </h2>
            <p className="text-3xl font-extrabold text-[#12241E] tracking-tight">
              From Missing to Reunited in Three Steps
            </p>
            <p className="mt-2 text-sm text-[#536B63]">
              No chaotic social media threads or unorganized chat groups. Just clear, structured recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E1E8E4] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-base mb-4 border border-emerald-200">
                  1
                </div>
                <h3 className="text-lg font-bold text-[#12241E] mb-2">
                  Report Item with Privacy Clues
                </h3>
                <p className="text-xs text-[#536B63] leading-relaxed">
                  Submit details of what you lost or found. Keep sensitive attributes (such as stickers, engravings, or passcode hints) in private verification fields.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E8E4] text-[11px] font-medium text-[#059669] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> ID Masking Protected
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E1E8E4] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-base mb-4 border border-emerald-200">
                  2
                </div>
                <h3 className="text-lg font-bold text-[#12241E] mb-2">
                  Intelligent Explainable Matching
                </h3>
                <p className="text-xs text-[#536B63] leading-relaxed">
                  Our 100-point matching engine evaluates category, keyword tokens, building location, date proximity, and color to surface candidate pairs automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E8E4] text-[11px] font-medium text-[#059669] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Instant Match Alerts
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E1E8E4] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-base mb-4 border border-emerald-200">
                  3
                </div>
                <h3 className="text-lg font-bold text-[#12241E] mb-2">
                  Claim & Supervised Handover
                </h3>
                <p className="text-xs text-[#536B63] leading-relaxed">
                  Submit a private ownership claim answering verification questions. Meet safely at the campus security desk to complete the return.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E8E4] text-[11px] font-medium text-[#059669] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Safe Campus Handover
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Campus Listings Preview */}
      <section className="py-16 bg-[#FAF9F6] border-b border-[#E1E8E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#059669] block mb-1">
                Live Feed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight">
                Recent Campus Listings
              </h2>
              <p className="text-xs text-[#536B63] mt-1">
                Showing current items registered at {activeCampus?.name || 'your campus'}.
              </p>
            </div>
            <Link to="/explore">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Listings
              </Button>
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <div className="card-subtle rounded-2xl p-8 text-center max-w-md mx-auto">
              <p className="text-sm font-semibold text-[#12241E]">No items currently registered</p>
              <p className="text-xs text-[#536B63] mt-1">
                Be the first to report a lost or found item for your campus!
              </p>
              <Link to="/report" className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  Report an Item
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Smart Matching Engine Architecture Showcase */}
      <section className="py-16 bg-white border-b border-[#E1E8E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" /> Explainable 100-Point Scoring Model
              </div>
              <h2 className="text-3xl font-extrabold text-[#12241E] tracking-tight">
                Similarity Matching You Can Trust
              </h2>
              <p className="mt-3 text-sm text-[#536B63] leading-relaxed">
                Rather than treating AI as an opaque black box, Back2You relies on an explainable, deterministic scoring model. Every suggestion comes with an exact breakdown showing category alignment, location proximity, date delta, and keyword overlap.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E1E8E4]">
                  <span className="text-xs font-bold text-[#12241E]">Category Similarity</span>
                  <span className="text-xs font-bold text-[#059669]">30 Points Max</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E1E8E4]">
                  <span className="text-xs font-bold text-[#12241E]">Keyword & Description Overlap</span>
                  <span className="text-xs font-bold text-[#059669]">25 Points Max</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E1E8E4]">
                  <span className="text-xs font-bold text-[#12241E]">Campus Building Location</span>
                  <span className="text-xs font-bold text-[#059669]">20 Points Max</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E1E8E4]">
                  <span className="text-xs font-bold text-[#12241E]">Date Proximity Decay</span>
                  <span className="text-xs font-bold text-[#059669]">15 Points Max</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E1E8E4]">
                  <span className="text-xs font-bold text-[#12241E]">Color Affinity Alignment</span>
                  <span className="text-xs font-bold text-[#059669]">10 Points Max</span>
                </div>
              </div>
            </div>

            {/* Visual breakdown simulation */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E1E8E4] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#12241E]">
                  Sample Match Breakdown
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                  94.5% Match
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[#536B63] mb-1">
                    <span>Category: Campus ID Card</span>
                    <span className="font-semibold text-[#12241E]">30 / 30 pts</span>
                  </div>
                  <div className="w-full bg-[#E1E8E4] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full rounded-full w-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#536B63] mb-1">
                    <span>Keywords: "student", "card", "red", "lanyard"</span>
                    <span className="font-semibold text-[#12241E]">23.5 / 25 pts</span>
                  </div>
                  <div className="w-full bg-[#E1E8E4] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full rounded-full w-[94%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#536B63] mb-1">
                    <span>Location: Tresidder Memorial Union</span>
                    <span className="font-semibold text-[#12241E]">20 / 20 pts</span>
                  </div>
                  <div className="w-full bg-[#E1E8E4] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full rounded-full w-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#536B63] mb-1">
                    <span>Date Proximity: Within 24 hours</span>
                    <span className="font-semibold text-[#12241E]">15 / 15 pts</span>
                  </div>
                  <div className="w-full bg-[#E1E8E4] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-medium">
                💡 <strong>Explanation:</strong> Identical item category • Matched keywords (student, card, red) • Same reported building location • Reported within 24 hours of each other.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section className="py-16 bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#059669] mb-1">
              Questions & Answers
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="card-subtle rounded-xl overflow-hidden bg-white border border-[#E1E8E4]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-[#12241E] hover:text-[#059669] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#7C938C] transition-transform duration-200 ${
                      expandedFaq === idx ? 'rotate-180 text-[#059669]' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#536B63] leading-relaxed border-t border-[#E1E8E4]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-14 bg-gradient-to-r from-[#064E3B] via-[#059669] to-[#047857] text-white text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Help bring missing belongings Back2You
          </h2>
          <p className="mt-2 text-sm text-emerald-100 max-w-xl mx-auto">
            Join students and campus staff keeping our university community connected, honest, and organized.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/report">
              <Button
                variant="secondary"
                size="md"
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold"
              >
                Report an Item Now
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                variant="outline"
                size="md"
                className="bg-transparent text-white border-white/60 hover:bg-white/10"
              >
                Search Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
