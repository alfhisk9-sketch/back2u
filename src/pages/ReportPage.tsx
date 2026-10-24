import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldAlert,
  Lock,
  Sparkles,
  CheckCircle,
  Camera,
  X,
} from 'lucide-react';
import {
  createItem,
  getCampuses,
  getCurrentCampusId,
  getCurrentUser,
  getMatchesForItem,
  uploadItemImage,
} from '../services/dataService';
import type { Campus, ItemReportType, MatchRecord } from '../types';
import {
  reportItemSchema,
  type ReportItemFormData,
  ITEM_CATEGORIES,
  CATEGORY_LABELS,
} from '../lib/validation';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import confetti from 'canvas-confetti';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = (searchParams.get('type') as ItemReportType) || 'lost';

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [activeCampusId, setActiveCampusId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Success Match Modal state
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [foundMatches, setFoundMatches] = useState<MatchRecord[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportItemFormData>({
    resolver: zodResolver(reportItemSchema),
    defaultValues: {
      report_type: defaultType,
      title: '',
      category: 'identity_cards',
      description: '',
      private_clues: '',
      color: '',
      location_name: '',
      date_lost_found: new Date().toISOString().split('T')[0],
      is_sensitive: false,
    },
  });

  const currentReportType = watch('report_type');
  const selectedCategory = watch('category');

  useEffect(() => {
    const init = async () => {
      const campusList = await getCampuses();
      setCampuses(campusList);
      setActiveCampusId(getCurrentCampusId());
    };
    init();
  }, []);

  // Update sensitivity flag automatically if ID card or wallet is chosen
  useEffect(() => {
    if (selectedCategory === 'identity_cards' || selectedCategory === 'wallets_purses') {
      setValue('is_sensitive', true);
    }
  }, [selectedCategory, setValue]);

  // Handle image upload and client validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }

      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setValue('image_url', previewUrl);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setValue('image_url', undefined);
  };

  const onSubmit = async (data: ReportItemFormData) => {
    setIsSubmitting(true);
    try {
      const user = await getCurrentUser();

      // Upload to storage if a file was selected
      let uploadedUrl = data.image_url;
      if (selectedFile) {
        uploadedUrl = await uploadItemImage(selectedFile);
      }

      const item = await createItem({
        campus_id: activeCampusId,
        user_id: user.id,
        report_type: data.report_type,
        title: data.title,
        category: data.category,
        description: data.description,
        private_clues: data.private_clues,
        color: data.color,
        location_name: data.location_name,
        date_lost_found: data.date_lost_found,
        image_url: uploadedUrl,
        is_sensitive: data.is_sensitive,
      });

      // Check if instant matches were detected
      const matches = await getMatchesForItem(item.id);
      setCreatedItemId(item.id);
      setFoundMatches(matches);

      if (matches.length > 0 && matches[0].similarity_score >= 60) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setShowMatchModal(true);
      } else {
        navigate(`/items/${item.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create report.';
      alert(`Error submitting report: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">
          Campus Recovery Desk
        </span>
        <h1 className="text-3xl font-extrabold text-[#12241E] tracking-tight mt-1">
          Report an Item
        </h1>
        <p className="text-xs text-[#536B63] mt-2 max-w-lg mx-auto">
          Register a lost or found belonging. Our intelligent matching engine will scan other campus reports to discover potential matches.
        </p>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-[#E1E8E4] p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Step 1: Report Type Toggle (Lost vs Found) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-2">
            What are you reporting?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('report_type', 'lost')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                currentReportType === 'lost'
                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                  : 'border-[#CBD5CE] hover:border-[#94A39B] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-rose-900">I Lost an Item</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    currentReportType === 'lost'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {currentReportType === 'lost' && <CheckCircle className="w-3 h-3" />}
                </span>
              </div>
              <p className="text-xs text-[#536B63] mt-1">
                Looking to retrieve your missing belongings.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setValue('report_type', 'found')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                currentReportType === 'found'
                  ? 'border-[#059669] bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-[#CBD5CE] hover:border-[#94A39B] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-900">I Found an Item</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    currentReportType === 'found'
                      ? 'border-[#059669] bg-[#059669] text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {currentReportType === 'found' && <CheckCircle className="w-3 h-3" />}
                </span>
              </div>
              <p className="text-xs text-[#536B63] mt-1">
                Safeguarding someone else's item to reunite them.
              </p>
            </button>
          </div>
        </div>

        {/* Sensitive Item Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block">Privacy and Safety First:</span>
            Never publish full credit card numbers, government passwords, or full student ID numbers in the public description. Mask sensitive numbers (e.g. "Card ending in 4829").
          </div>
        </div>

        {/* Campus & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Campus Scope
            </label>
            <div className="relative">
              <select
                value={activeCampusId}
                onChange={e => setActiveCampusId(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#CBD5CE] bg-white px-3.5 py-2 text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {campuses.map(campus => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Item Title"
              placeholder="e.g. Stanford Student ID Card, Blue Hydro Flask 32oz"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>
        </div>

        {/* Category & Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full text-sm rounded-lg border border-[#CBD5CE] bg-white px-3.5 py-2 text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {ITEM_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Primary Color"
              placeholder="e.g. Blue, Black, Silver, Red"
              {...register('color')}
              error={errors.color?.message}
            />
          </div>
        </div>

        {/* Location & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label={currentReportType === 'lost' ? 'Last Seen Location' : 'Found Location'}
              placeholder="e.g. Green Library 2nd Floor, Tresidder Cafe"
              {...register('location_name')}
              error={errors.location_name?.message}
            />
          </div>

          <div>
            <Input
              type="date"
              label={currentReportType === 'lost' ? 'Date Lost' : 'Date Found'}
              {...register('date_lost_found')}
              error={errors.date_lost_found?.message}
            />
          </div>
        </div>

        {/* Public Description */}
        <div>
          <Textarea
            label="Public Description"
            rows={3}
            placeholder="Describe the visible exterior of the item (brand, shape, scratches, stickers). Do not include private password hints here."
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* Private Ownership Verification Clues (Essential Security Feature) */}
        <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#CBD5CE] space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#059669]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#12241E]">
              Private Verification Clues (Confidential)
            </span>
          </div>
          <p className="text-[11px] text-[#536B63] leading-relaxed">
            This information is <strong>never displayed on the public feed</strong>. It is used exclusively to verify legitimate ownership when someone submits a claim. (e.g. "Last 4 digits of student ID: 4829", "Engraved initials A.C. on back", "Lock screen is a golden retriever").
          </p>
          <Textarea
            rows={2}
            placeholder="Private details known only to the true owner..."
            {...register('private_clues')}
            error={errors.private_clues?.message}
          />
        </div>

        {/* Photo Upload with Preview */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
            Photo (Optional, max 5MB)
          </label>
          {imagePreview ? (
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-[#CBD5CE]">
              <img src={imagePreview} alt="Item preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-black cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 px-4 border-2 border-dashed border-[#CBD5CE] rounded-xl hover:border-[#059669] bg-[#FAF9F6] cursor-pointer transition-colors">
              <Camera className="w-6 h-6 text-[#7C938C] mb-1" />
              <span className="text-xs font-semibold text-[#12241E]">
                Click or drag to upload photo
              </span>
              <span className="text-[10px] text-[#7C938C]">JPG, PNG, WEBP up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-[#E1E8E4] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Submit & Run Smart Matching
          </Button>
        </div>
      </form>

      {/* Immediate Match Alert Modal */}
      <Modal
        isOpen={showMatchModal}
        onClose={() => {
          setShowMatchModal(false);
          if (createdItemId) navigate(`/items/${createdItemId}`);
        }}
        title="Potential Match Discovered!"
        description="Back2You's matching engine detected high similarity with an existing campus report."
      >
        <div className="space-y-4">
          {foundMatches.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-900">
                  {foundMatches[0].similarity_score}% Compatibility Score
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  Recommended Candidate
                </span>
              </div>
              <p className="text-emerald-800 leading-relaxed font-medium">
                {foundMatches[0].breakdown_json.explanation}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMatchModal(false);
                if (createdItemId) navigate(`/items/${createdItemId}`);
              }}
            >
              View My Report
            </Button>
            {foundMatches.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowMatchModal(false);
                  const matchedId =
                    foundMatches[0].lost_item_id === createdItemId
                      ? foundMatches[0].found_item_id
                      : foundMatches[0].lost_item_id;
                  navigate(`/items/${matchedId}`);
                }}
              >
                Inspect Matching Report →
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
