import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Lock,
  ArrowLeft,
  UserCheck,
  Building,
} from 'lucide-react';
import {
  getItemById,
  getCurrentUser,
  getClaimsForItem,
  createClaim,
  reviewClaim,
  getMatchesForItem,
  dismissMatch,
  submitAbuseReport,
  subscribeDataChanges,
} from '../services/dataService';
import type { Item, Profile, Claim, MatchRecord } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { CATEGORY_LABELS } from '../lib/validation';
import confetti from 'canvas-confetti';

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Claim Submission Modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [proofDetails, setProofDetails] = useState('');
  const [claimError, setClaimError] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Review Claim Modal
  const [selectedClaimToReview, setSelectedClaimToReview] = useState<Claim | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'completed'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [handoverLocation, setHandoverLocation] = useState(
    'Campus Security Office, Student Union Bldg A, Rm 104'
  );

  // Abuse Report Modal
  const [isAbuseModalOpen, setIsAbuseModalOpen] = useState(false);
  const [abuseReason, setAbuseReason] = useState('Fraudulent / Inaccurate Listing');
  const [abuseDetails, setAbuseDetails] = useState('');

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    const user = await getCurrentUser();
    setCurrentUser(user);

    const foundItem = await getItemById(id);
    setItem(foundItem);

    if (foundItem) {
      const itemClaims = await getClaimsForItem(id);
      setClaims(itemClaims);

      const itemMatches = await getMatchesForItem(id);
      setMatches(itemMatches);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#536B63]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading item record...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#12241E]">Item Not Found</h2>
        <p className="text-xs text-[#536B63] mt-1">This report may have been removed or does not exist.</p>
        <Link to="/explore" className="mt-4 inline-block">
          <Button variant="primary" size="sm">
            Return to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === item.user_id;
  const isModerator = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canReviewClaims = isOwner || isModerator;

  // Check if current user already submitted a claim
  const userExistingClaim = claims.find(c => c.claimant_id === currentUser?.id);

  // Handle Claim Submission
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDetails.trim()) {
      setClaimError('Please provide detailed proof of ownership.');
      return;
    }
    setIsSubmittingClaim(true);
    setClaimError('');
    try {
      await createClaim(item.id, {
        claim_message: claimMessage || 'I believe this item belongs to me.',
        proof_details: proofDetails,
      });
      setIsClaimModalOpen(false);
      setClaimMessage('');
      setProofDetails('');
      alert('Your ownership claim was submitted successfully. The poster has been notified to verify.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit claim.';
      setClaimError(message);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Handle Reviewing a Claim
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimToReview) return;

    try {
      await reviewClaim(selectedClaimToReview.id, {
        status: reviewStatus,
        review_notes: reviewNotes,
        handover_instructions: handoverLocation,
      });

      if (reviewStatus === 'completed') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setSelectedClaimToReview(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to review claim.';
      alert(`Error: ${message}`);
    }
  };

  // Handle Abuse Report Submission
  const handleAbuseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitAbuseReport({
        target_item_id: item.id,
        reason: abuseReason,
        details: abuseDetails,
      });
      setIsAbuseModalOpen(false);
      alert('Abuse report submitted to campus moderators for inspection.');
    } catch {
      alert('Failed to submit report.');
    }
  };

  const categoryName = CATEGORY_LABELS[item.category] || item.category;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#536B63] hover:text-[#059669] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Item Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Main Card */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] overflow-hidden shadow-2xs">
            {/* Image Banner */}
            <div className="relative h-72 sm:h-96 w-full bg-[#EBF1EE]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#7C938C]">
                  <Tag className="w-16 h-16 opacity-40 text-[#059669] mb-2" />
                  <span className="text-sm font-semibold text-[#536B63]">{categoryName}</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <Badge reportType={item.report_type} size="md" />
                <Badge status={item.status} size="md" />
              </div>

              {item.is_sensitive && (
                <div className="absolute top-4 right-4 bg-amber-900/80 backdrop-blur-xs text-amber-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                  Sensitive Identity Document
                </div>
              )}
            </div>

            {/* Details Content */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#059669] mb-2">
                <Tag className="w-4 h-4" />
                <span>{categoryName}</span>
                {item.color && (
                  <span className="text-[#536B63] font-normal border-l border-[#CBD5CE] pl-2">
                    Color: {item.color}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight">
                {item.title}
              </h1>

              {/* Metadata row */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#536B63] pb-6 border-b border-[#E1E8E4]">
                <div className="flex items-center gap-1.5 font-medium text-[#12241E]">
                  <MapPin className="w-4 h-4 text-[#059669]" />
                  <span>{item.location_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#7C938C]" />
                  <span>
                    {item.report_type === 'lost' ? 'Lost on' : 'Found on'} {item.date_lost_found}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#7C938C]" />
                  <span>{item.campus?.name}</span>
                </div>
              </div>

              {/* Public Description */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-2">
                  Public Description
                </h3>
                <p className="text-sm text-[#12241E] leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Private Clues (Only visible to owner or moderator) */}
              {(isOwner || isModerator) && item.private_clues && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    Private Verification Clues (Owner & Moderator Only)
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {item.private_clues}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Match Suggestions Section (Visible to Owner & Moderator) */}
          {(isOwner || isModerator) && (
            <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#059669]" />
                  <h3 className="text-sm font-bold text-[#12241E]">
                    Explainable Candidate Matches ({matches.length})
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#536B63] bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#E1E8E4]">
                  Same Campus
                </span>
              </div>

              {matches.length === 0 ? (
                <p className="text-xs text-[#536B63] py-4 text-center">
                  No matching candidates currently registered. We will notify you automatically when a corresponding {item.report_type === 'lost' ? 'found' : 'lost'} item is submitted.
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map(m => {
                    const otherItem = m.lost_item_id === item.id ? m.found_item : m.lost_item;
                    if (!otherItem) return null;

                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E1E8E4] hover:border-[#059669]/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                              {m.similarity_score}% Match
                            </span>
                            <span className="text-xs font-bold text-[#12241E] truncate">
                              {otherItem.title}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#536B63] leading-relaxed">
                            💡 <strong>Match Breakdown:</strong> {m.breakdown_json.explanation}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link to={`/items/${otherItem.id}`}>
                            <Button variant="outline" size="sm">
                              Inspect Match
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => dismissMatch(m.id)}
                            className="text-xs text-[#7C938C] hover:text-rose-600 px-2 py-1 cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Claims Received Table (For Owner / Moderator) */}
          {canReviewClaims && (
            <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#059669]" />
                  <h3 className="text-sm font-bold text-[#12241E]">
                    Submitted Ownership Claims ({claims.length})
                  </h3>
                </div>
                <span className="text-[10px] text-[#536B63]">Strictly confidential to poster</span>
              </div>

              {claims.length === 0 ? (
                <p className="text-xs text-[#536B63] py-4 text-center">
                  No claims have been submitted for this item yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {claims.map(claim => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-xl border border-[#E1E8E4] bg-[#FAF9F6] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#12241E]">
                            Claim by: {claim.claimant?.full_name} ({claim.claimant?.email})
                          </span>
                          <span className="text-[11px] text-[#536B63] block">
                            Submitted on {new Date(claim.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge status={claim.status === 'pending' ? 'open' : claim.status === 'approved' ? 'claimed' : claim.status === 'completed' ? 'resolved' : 'closed'} size="sm">
                          {claim.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <p className="text-[#536B63]">
                          <strong className="text-[#12241E]">Message:</strong> {claim.claim_message}
                        </p>
                        <div className="p-3 bg-white rounded-lg border border-[#CBD5CE]">
                          <strong className="text-[#12241E] block mb-1">
                            🔐 Claimant's Verification Proof:
                          </strong>
                          <p className="text-[#12241E] font-medium leading-relaxed">
                            {claim.proof_details}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {claim.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8E4]">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedClaimToReview(claim);
                              setReviewStatus('rejected');
                            }}
                          >
                            Reject Claim
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedClaimToReview(claim);
                              setReviewStatus('approved');
                            }}
                          >
                            Approve Proof & Set Handover
                          </Button>
                        </div>
                      )}

                      {claim.status === 'approved' && (
                        <div className="flex items-center justify-between pt-2 border-t border-[#E1E8E4]">
                          <span className="text-xs text-[#059669] font-medium">
                            Approved. Handover: {claim.handover_instructions}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedClaimToReview(claim);
                              setReviewStatus('completed');
                            }}
                          >
                            Confirm Return Completed 🎉
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Actions & Safety Protocols */}
        <div className="space-y-6">
          {/* Action Card: Submit Claim */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#12241E]">Item Actions</h3>

            {isOwner ? (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-medium">
                You are the author of this report. You can review submitted claims and incoming match suggestions on this page.
              </div>
            ) : item.status === 'resolved' ? (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-semibold">
                ✓ This item has been successfully reunited with its verified owner!
              </div>
            ) : userExistingClaim ? (
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 leading-relaxed">
                <span className="font-bold block">Claim Status: {userExistingClaim.status.toUpperCase()}</span>
                {userExistingClaim.status === 'pending'
                  ? 'Your claim is currently under review by the reporter.'
                  : userExistingClaim.status === 'approved'
                  ? `Claim approved! Meet at: ${userExistingClaim.handover_instructions || 'Campus Security Desk'}.`
                  : 'Your claim was completed or rejected.'}
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#536B63] mb-3 leading-relaxed">
                  Is this your item? Submit a private ownership claim answering specific proof questions.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setIsClaimModalOpen(true)}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Submit Ownership Claim
                </Button>
              </div>
            )}

            {/* Abuse / Flag button */}
            <div className="pt-3 border-t border-[#E1E8E4] flex justify-between items-center text-xs">
              <span className="text-[#7C938C]">Notice an issue?</span>
              <button
                type="button"
                onClick={() => setIsAbuseModalOpen(true)}
                className="text-rose-600 hover:underline font-medium cursor-pointer"
              >
                Report Listing
              </button>
            </div>
          </div>

          {/* Supervised Handover Protocol */}
          <div className="bg-[#FAF9F6] rounded-2xl border border-[#E1E8E4] p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#059669]">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#12241E]">
                Safe Campus Handover
              </h4>
            </div>
            <p className="text-xs text-[#536B63] leading-relaxed">
              Back2You strictly recommends completing all physical returns at supervised campus facilities:
            </p>
            <div className="p-3 bg-white rounded-xl border border-[#CBD5CE] text-xs font-medium text-[#12241E]">
              📍 {item.campus?.security_office_location || 'Campus Safety & Security Office'}
            </div>
            <p className="text-[11px] text-[#7C938C]">
              Never meet in isolated, private, or off-campus dorm rooms for high-value belongings.
            </p>
          </div>
        </div>
      </div>

      {/* Claim Submission Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Submit Ownership Claim"
        description={`Provide verification details to prove this ${item.title} belongs to you.`}
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          {claimError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {claimError}
            </div>
          )}

          <div>
            <Textarea
              label="Introductory Message"
              rows={2}
              value={claimMessage}
              onChange={e => setClaimMessage(e.target.value)}
              placeholder="Hi, I believe this is my item that I lost earlier..."
            />
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#CBD5CE] space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#12241E]">
              🔐 Ownership Verification Proof (Required)
            </label>
            <p className="text-[11px] text-[#536B63] leading-relaxed">
              Describe specific details that only the true owner would know (e.g. lock screen photo, internal engravings, keychain charms, or serial clues).
            </p>
            <Textarea
              rows={3}
              value={proofDetails}
              onChange={e => setProofDetails(e.target.value)}
              placeholder="e.g. The lanyard has an enamel pine tree pin; the student ID ends in 4829..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8E4]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsClaimModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingClaim}
            >
              Submit Confidential Claim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Claim Modal */}
      <Modal
        isOpen={selectedClaimToReview !== null}
        onClose={() => setSelectedClaimToReview(null)}
        title={`Review Claim: ${reviewStatus.toUpperCase()}`}
        description="Verify the claimant's answer and coordinate a safe handover."
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Decision
            </label>
            <select
              value={reviewStatus}
              onChange={e =>
                setReviewStatus(e.target.value as 'approved' | 'rejected' | 'completed')
              }
              className="w-full text-xs rounded-lg border border-[#CBD5CE] bg-white px-3 py-2 text-[#12241E] cursor-pointer"
            >
              <option value="approved">Approve Claim (Valid Proof Provided)</option>
              <option value="rejected">Reject Claim (Incorrect / Unverified)</option>
              <option value="completed">Complete Return (Item Successfully Handed Over)</option>
            </select>
          </div>

          {reviewStatus === 'approved' && (
            <div>
              <Input
                label="Supervised Campus Handover Location"
                value={handoverLocation}
                onChange={e => setHandoverLocation(e.target.value)}
                placeholder="e.g. Campus Security Office, Desk Rm 104"
              />
            </div>
          )}

          <div>
            <Textarea
              label="Review Feedback Notes (Sent to claimant)"
              rows={2}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="e.g. Proof verified. Please bring your official photo ID to the front desk."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8E4]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedClaimToReview(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Abuse Report Modal */}
      <Modal
        isOpen={isAbuseModalOpen}
        onClose={() => setIsAbuseModalOpen(false)}
        title="Report Suspicious or Abusive Listing"
        description="Notify campus moderators about policy violations."
      >
        <form onSubmit={handleAbuseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Reason
            </label>
            <select
              value={abuseReason}
              onChange={e => setAbuseReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#CBD5CE] bg-white px-3 py-2 text-[#12241E] cursor-pointer"
            >
              <option value="Fraudulent / Inaccurate Listing">Fraudulent / Inaccurate Listing</option>
              <option value="Sensitive Personal Details Exposed">Sensitive Personal Details Exposed</option>
              <option value="Inappropriate / Offensive Content">Inappropriate / Offensive Content</option>
              <option value="Suspected Theft or Extortion">Suspected Theft or Extortion</option>
            </select>
          </div>

          <div>
            <Textarea
              label="Details for Campus Moderators"
              rows={3}
              value={abuseDetails}
              onChange={e => setAbuseDetails(e.target.value)}
              placeholder="Please provide context on why this listing violates campus guidelines..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8E4]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAbuseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm">
              Submit Abuse Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
