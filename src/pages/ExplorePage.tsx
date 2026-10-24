import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  PlusCircle,
  Building,
  RotateCcw,
} from 'lucide-react';
import {
  getItems,
  getCampuses,
  getCurrentCampusId,
  setCurrentCampusId,
  subscribeDataChanges,
} from '../services/dataService';
import type { Item, Campus, ItemCategory, ItemReportType, ItemStatus } from '../types';
import { ItemCard } from '../components/items/ItemCard';
import { Button } from '../components/ui/Button';
import { ITEM_CATEGORIES, CATEGORY_LABELS } from '../lib/validation';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Item[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [activeCampusId, setActiveCampusId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [reportType, setReportType] = useState<ItemReportType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'date_lost_found'>('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    setIsLoading(true);
    const campusId = getCurrentCampusId();
    setActiveCampusId(campusId);
    const campusList = await getCampuses();
    setCampuses(campusList);

    const fetchedItems = await getItems({
      campus_id: campusId,
      report_type: reportType,
      category: selectedCategory,
      status: selectedStatus,
      color: selectedColor || undefined,
      search: searchQuery || undefined,
      sortBy: sortBy,
    });

    setItems(fetchedItems);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, [reportType, selectedCategory, selectedStatus, selectedColor, sortBy, searchQuery]);

  // Sync search input if query param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setReportType('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedColor('');
    setSortBy('newest');
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleCampusChange = (campusId: string) => {
    setCurrentCampusId(campusId);
    setActiveCampusId(campusId);
    setCurrentPage(1);
  };

  // Paginated slice
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const activeCampus = campuses.find(c => c.id === activeCampusId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#E1E8E4] gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#059669] block">
            Campus Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight">
            Explore Lost & Found
          </h1>
          <p className="text-xs text-[#536B63] mt-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#059669]" />
            Showing listings for <span className="font-semibold text-[#12241E]">{activeCampus?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick campus changer */}
          <select
            value={activeCampusId}
            onChange={e => handleCampusChange(e.target.value)}
            className="text-xs bg-white border border-[#CBD5CE] rounded-lg px-3 py-2 text-[#12241E] focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {campuses.map(campus => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>

          <Link to="/report">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Report Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
        {/* Mobile filter toggle button */}
        <div className="lg:hidden flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            {showMobileFilters ? 'Hide Filters' : 'Filter & Sort'}
          </Button>

          {(searchQuery || reportType !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Filters Sidebar */}
        <aside
          className={`lg:block ${
            showMobileFilters ? 'block' : 'hidden'
          } bg-white p-5 rounded-2xl border border-[#E1E8E4] shadow-2xs h-fit space-y-6`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12241E] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#059669]" /> Filters
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-[#536B63] hover:text-[#059669] hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#7C938C] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Title, brand, location..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#CBD5CE] bg-white text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#059669]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#7C938C] hover:text-[#12241E] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Report Type (Lost vs Found) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-2">
              Listing Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF9F6] rounded-xl border border-[#E1E8E4] text-xs">
              <button
                type="button"
                onClick={() => {
                  setReportType('all');
                  setCurrentPage(1);
                }}
                className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  reportType === 'all'
                    ? 'bg-white shadow-2xs text-[#12241E] font-bold'
                    : 'text-[#536B63] hover:text-[#12241E]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportType('lost');
                  setCurrentPage(1);
                }}
                className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  reportType === 'lost'
                    ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                    : 'text-[#536B63] hover:text-rose-700'
                }`}
              >
                Lost
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportType('found');
                  setCurrentPage(1);
                }}
                className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  reportType === 'found'
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'text-[#536B63] hover:text-emerald-800'
                }`}
              >
                Found
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value as ItemCategory | 'all');
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#CBD5CE] bg-white px-3 py-2 text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#059669] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {ITEM_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Report Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value as ItemStatus | 'all');
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#CBD5CE] bg-white px-3 py-2 text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#059669] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open (Unclaimed)</option>
              <option value="matching">Matching Suggestions</option>
              <option value="claimed">Claim In Review</option>
              <option value="resolved">Resolved / Reunited</option>
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Color Filter
            </label>
            <input
              type="text"
              value={selectedColor}
              onChange={e => {
                setSelectedColor(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="e.g. Blue, Black, Red..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#CBD5CE] bg-white text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#059669]"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C534B] mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={e => {
                setSortBy(e.target.value as 'newest' | 'oldest' | 'date_lost_found');
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-[#CBD5CE] bg-white px-3 py-2 text-[#12241E] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#059669] cursor-pointer"
            >
              <option value="newest">Newest Reports First</option>
              <option value="date_lost_found">Event Date (Lost / Found)</option>
              <option value="oldest">Oldest Reports First</option>
            </select>
          </div>
        </aside>

        {/* Listings Grid */}
        <main className="lg:col-span-3">
          {/* Result Count and Active Filters Bar */}
          <div className="flex items-center justify-between mb-4 text-xs text-[#536B63]">
            <span>
              Found <strong>{items.length}</strong> items registered on this campus
            </span>
            {items.length > 0 && (
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="card-subtle rounded-2xl h-80 bg-white animate-pulse p-4 flex flex-col justify-between"
                >
                  <div className="h-44 bg-neutral-200 rounded-xl"></div>
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card-subtle rounded-2xl p-12 text-center bg-white border border-[#E1E8E4]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#12241E]">No matching items found</h3>
              <p className="text-xs text-[#536B63] mt-1 max-w-sm mx-auto">
                No items matched your active search and filter criteria on this campus. Try clearing your filters or report your missing item.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear Filters
                </Button>
                <Link to="/report">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Report Item
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-[#536B63] px-3 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
