import React, { useState } from 'react';
import { Compass, ShieldCheck, Mail, HelpCircle, Lock, BookOpen } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'help' | 'contact' | null>(null);

  return (
    <footer className="bg-[#12241E] text-[#CBD5CE] pt-12 pb-8 border-t border-[#234237]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Back2You</span>
            </div>
            <p className="text-xs text-[#8EA59E] leading-relaxed mb-4">
              Lost something? Let's bring it back to you. The multi-campus lost-and-found platform built with explainable matching, private claim verification, and supervised campus handover.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Security Aligned</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/explore" className="hover:text-emerald-400 transition-colors">
                  Explore Campus Items
                </a>
              </li>
              <li>
                <a href="/report" className="hover:text-emerald-400 transition-colors">
                  Report a Lost Item
                </a>
              </li>
              <li>
                <a href="/report" className="hover:text-emerald-400 transition-colors">
                  Register a Found Belonging
                </a>
              </li>
              <li>
                <a href="/my-reports" className="hover:text-emerald-400 transition-colors">
                  My Reports & Active Claims
                </a>
              </li>
            </ul>
          </div>

          {/* Safety & Protocol */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Recovery Safety</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-[#8EA59E] block">Private Ownership Clues</span>
              </li>
              <li>
                <span className="text-[#8EA59E] block">Campus Security Office Desk</span>
              </li>
              <li>
                <span className="text-[#8EA59E] block">Identity Masking on Badges</span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('help')}
                  className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Handover Guidelines
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Transparency</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Privacy & Student Data
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Platform Terms of Use
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('contact')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Contact Campus Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="border-t border-[#234237] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7C938C] gap-2">
          <p>© {new Date().getFullYear()} Back2You Platform. Multi-Campus Lost & Found SaaS.</p>
          <p className="text-neutral-400">
            For emergencies or immediate theft reports, contact your local Campus Police or Public Safety department.
          </p>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy & Data Protection Policy"
        description="How Back2You safeguards student identification and belongings"
      >
        <div className="space-y-3 text-xs text-[#3C534B] leading-relaxed">
          <p>
            <strong>1. Identification Card Privacy:</strong> When reporting lost student IDs, driver's licenses, or passports, full identification numbers are masked and hidden from public explore feeds.
          </p>
          <p>
            <strong>2. Private Ownership Clues:</strong> Specific verification details (e.g., engravings, passcode hints, lock screen photo descriptions) are strictly stored in private fields only accessible to authorized item reviewers and campus safety moderators.
          </p>
          <p>
            <strong>3. Campus Boundary Isolation:</strong> Records are strictly isolated by campus using PostgreSQL Row Level Security (RLS) policies to prevent cross-institution data leakage.
          </p>
          <p>
            <strong>4. Contact Information:</strong> Personal phone numbers and email addresses are masked by default and only shared upon approved claim review.
          </p>
        </div>
      </Modal>

      {/* Terms Modal */}
      <Modal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Use"
        description="Guidelines for safe community recovery"
      >
        <div className="space-y-3 text-xs text-[#3C534B] leading-relaxed">
          <p>
            <strong>Community Honesty:</strong> Submitting fraudulent claims for items you do not own violates university honor codes and will result in campus account suspension and disciplinary referral.
          </p>
          <p>
            <strong>Safe Handover Protocol:</strong> All exchanges must be conducted in supervised public university facilities, preferably the campus security lost property desk or student center information desk.
          </p>
          <p>
            <strong>No Commercial Solicitation:</strong> Back2You is strictly for non-commercial recovery of lost personal belongings.
          </p>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={activeModal === 'help'}
        onClose={() => setActiveModal(null)}
        title="Campus Handover Guidelines"
        description="Best practices for a secure return"
      >
        <div className="space-y-3 text-xs text-[#3C534B] leading-relaxed">
          <p>
            <strong>Step 1: Verify Ownership via Private Clues</strong> — Always check the claimant's answer to distinguishing questions before agreeing to meet.
          </p>
          <p>
            <strong>Step 2: Choose a Supervised Campus Location</strong> — We recommend meeting at your campus security office, campus library circulation desk, or student union information desk during daylight hours.
          </p>
          <p>
            <strong>Step 3: Confirm the Return in Back2You</strong> — Once the item has been returned to its rightful owner, mark the claim as "Completed" to auto-resolve the listing.
          </p>
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        title="Contact Campus Support"
        description="Reach out to your campus coordinator"
      >
        <div className="space-y-3 text-xs text-[#3C534B] leading-relaxed">
          <p>
            If you need assistance with an item dispute or suspect fraudulent activity, contact your campus lost and found administrator:
          </p>
          <div className="p-3 bg-[#E7EFEA] rounded-lg border border-[#CBD5CE]">
            <p className="font-semibold text-[#12241E]">Campus Safety Coordination Office</p>
            <p className="text-neutral-600">Email: support@back2you.campus</p>
            <p className="text-neutral-600">Hours: Monday – Friday, 8:00 AM – 5:00 PM</p>
          </div>
        </div>
      </Modal>
    </footer>
  );
};
