import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Trash2,
  CheckCircle,
  ExternalLink,
  Building,
  Edit,
} from 'lucide-react';
import {
  getCurrentUser,
  getCampuses,
  getCurrentCampusId,
  getItems,
  getMyClaims,
  updateItem,
  deleteItem,
  subscribeDataChanges,
} from '../services/dataService';
import type { Item, Profile, Campus, Claim } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { CATEGORY_LABELS } from '../lib/validation';

export const MyReportsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'claims'>('all');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const loadData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);

    const campusId = getCurrentCampusId();
    const campusList = await getCampuses();
    setActiveCampus(campusList.find(c => c.id === campusId) || null);

    if (user) {
      const allItems = await getItems({ campus_id: campusId });
      const userItems = allItems.filter(i => i.user_id === user.id);
      setMyItems(userItems);

      const claimsList = await getMyClaims(user.id);
      setMyClaims(claimsList);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    await updateItem(editingItem.id, {
      title: editTitle,
      description: editDescription,
      location_name: editLocation,
    });

    setEditingItem(null);
  };

  const handleMarkResolved = async (itemId: string) => {
    if (window.confirm('Mark this report as resolved / reunited?')) {
      await updateItem(itemId, { status: 'resolved' });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await deleteItem(itemId);
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditLocation(item.location_name);
  };

  const lostCount = myItems.filter(i => i.report_type === 'lost').length;
  const foundCount = myItems.filter(i => i.report_type === 'found').length;
  const resolvedCount = myItems.filter(i => i.status === 'resolved').length;

  const filteredItems = myItems.filter(i => {
    if (activeTab === 'lost') return i.report_type === 'lost';
    if (activeTab === 'found') return i.report_type === 'found';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#E1E8E4] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">
              Student Dashboard
            </span>
            <span className="text-xs text-[#536B63]">•</span>
            <span className="text-xs font-semibold text-[#12241E] flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#059669]" /> {activeCampus?.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight mt-1">
            Welcome back, {currentUser?.full_name}
          </h1>
          <p className="text-xs text-[#536B63] mt-0.5">
            Track your open lost reports, registered found items, and active ownership claims.
          </p>
        </div>

        <Link to="/report">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            New Item Report
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-2xs">
          <span className="text-xs font-semibold text-[#536B63] block">My Lost Reports</span>
          <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{lostCount}</span>
          <span className="text-[10px] text-[#7C938C]">Missing items</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-2xs">
          <span className="text-xs font-semibold text-[#536B63] block">My Found Reports</span>
          <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">{foundCount}</span>
          <span className="text-[10px] text-[#7C938C]">Good samaritan reports</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-2xs">
          <span className="text-xs font-semibold text-[#536B63] block">Claims Submitted</span>
          <span className="text-2xl font-extrabold text-purple-700 mt-1 block">
            {myClaims.length}
          </span>
          <span className="text-[10px] text-[#7C938C]">Awaiting verification</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-2xs">
          <span className="text-xs font-semibold text-[#536B63] block">Successfully Reunited</span>
          <span className="text-2xl font-extrabold text-[#059669] mt-1 block">
            {resolvedCount}
          </span>
          <span className="text-[10px] text-[#7C938C]">Completed returns</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 border-b border-[#E1E8E4] flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'all'
              ? 'border-[#059669] text-[#059669]'
              : 'border-transparent text-[#536B63] hover:text-[#12241E]'
          }`}
        >
          All Reports ({myItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lost')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'lost'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-[#536B63] hover:text-rose-700'
          }`}
        >
          Lost ({lostCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('found')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'found'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-[#536B63] hover:text-emerald-800'
          }`}
        >
          Found ({foundCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'claims'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-[#536B63] hover:text-purple-700'
          }`}
        >
          My Claims ({myClaims.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'claims' ? (
          /* Claims Tab */
          myClaims.length === 0 ? (
            <div className="card-subtle rounded-2xl p-8 text-center bg-white border border-[#E1E8E4]">
              <p className="text-sm font-semibold text-[#12241E]">No active ownership claims</p>
              <p className="text-xs text-[#536B63] mt-1">
                When you find an item in the explore catalog that belongs to you, submit a claim.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myClaims.map(claim => (
                <div
                  key={claim.id}
                  className="bg-white p-5 rounded-2xl border border-[#E1E8E4] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#12241E]">
                        Claim for: {claim.item?.title || 'Campus Item'}
                      </span>
                      <Badge
                        status={
                          claim.status === 'pending'
                            ? 'open'
                            : claim.status === 'approved'
                            ? 'claimed'
                            : claim.status === 'completed'
                            ? 'resolved'
                            : 'closed'
                        }
                        size="sm"
                      >
                        {claim.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#536B63] leading-relaxed">
                      <strong>Submitted Proof:</strong> {claim.proof_details}
                    </p>
                    {claim.handover_instructions && (
                      <p className="text-xs text-[#059669] font-semibold">
                        📍 Handover Instructions: {claim.handover_instructions}
                      </p>
                    )}
                  </div>

                  {claim.item && (
                    <Link to={`/items/${claim.item.id}`} className="shrink-0">
                      <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                        View Item
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Reports Tab */
          filteredItems.length === 0 ? (
            <div className="card-subtle rounded-2xl p-8 text-center bg-white border border-[#E1E8E4]">
              <p className="text-sm font-semibold text-[#12241E]">No reports in this tab</p>
              <p className="text-xs text-[#536B63] mt-1">
                You haven't submitted any {activeTab === 'all' ? '' : activeTab} reports yet.
              </p>
              <Link to="/report" className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  Create a Report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-[#E1E8E4] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-[#EBF1EE] shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#7C938C]">
                          No Photo
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge reportType={item.report_type} size="sm" />
                        <Badge status={item.status} size="sm" />
                        <span className="text-xs text-[#7C938C]">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#12241E]">
                        <Link to={`/items/${item.id}`} className="hover:text-[#059669] hover:underline">
                          {item.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-[#536B63]">
                        {item.location_name} • Reported on {item.date_lost_found}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#E1E8E4]">
                    <Link to={`/items/${item.id}`}>
                      <Button variant="outline" size="sm">
                        View & Matches
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>

                    {item.status !== 'resolved' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkResolved(item.id)}
                        leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      >
                        Mark Reunited
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-[#7C938C] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Edit Item Modal */}
      <Modal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title="Edit Item Details"
        description="Update permissible fields for this report."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <Input
              label="Title"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Location"
              value={editLocation}
              onChange={e => setEditLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <Textarea
              label="Public Description"
              rows={3}
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8E4]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
