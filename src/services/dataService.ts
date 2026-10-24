import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Campus,
  Profile,
  Item,
  Claim,
  MatchRecord,
  Notification,
  AbuseReport,
  AuditLog,
  ItemFilters,
  ItemReportType,
} from '../types';
import {
  SEED_CAMPUSES,
  DEMO_USERS,
  SEED_ITEMS,
  SEED_MATCHES,
  SEED_CLAIMS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from './mockData';
import { findPotentialMatches } from '../lib/matching';

// Local storage keys for persistent demo/offline mode
const STORAGE_KEYS = {
  CURRENT_USER_ID: 'back2you_curr_user_id',
  CURRENT_CAMPUS_ID: 'back2you_curr_campus_id',
  ITEMS: 'back2you_items',
  CLAIMS: 'back2you_claims',
  MATCHES: 'back2you_matches',
  NOTIFICATIONS: 'back2you_notifs',
  ABUSE_REPORTS: 'back2you_abuse',
  AUDIT_LOGS: 'back2you_audits',
  PROFILES: 'back2you_profiles',
  CAMPUSES: 'back2you_campuses',
};

// Helper for local storage persistence
function loadFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('Storage save failed:', err);
  }
}

// In-memory / localStorage cache state
let campuses: Campus[] = loadFromStorage(STORAGE_KEYS.CAMPUSES, SEED_CAMPUSES);
let profiles: Profile[] = loadFromStorage(STORAGE_KEYS.PROFILES, DEMO_USERS);
let items: Item[] = loadFromStorage(STORAGE_KEYS.ITEMS, SEED_ITEMS);
let claims: Claim[] = loadFromStorage(STORAGE_KEYS.CLAIMS, SEED_CLAIMS);
let matches: MatchRecord[] = loadFromStorage(STORAGE_KEYS.MATCHES, SEED_MATCHES);
let notifications: Notification[] = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
let abuseReports: AbuseReport[] = loadFromStorage(STORAGE_KEYS.ABUSE_REPORTS, []);
let auditLogs: AuditLog[] = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);

let currentUserId: string = loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, DEMO_USERS[0].id);
let currentCampusId: string = loadFromStorage(STORAGE_KEYS.CURRENT_CAMPUS_ID, SEED_CAMPUSES[0].id);

// Subscribers for reactive updates in React hooks
const listeners = new Set<() => void>();
function notifySubscribers() {
  listeners.forEach(fn => fn());
}

export function subscribeDataChanges(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/* =============================================================================
   CAMPUS & IDENTITY SERVICES
   ============================================================================= */

export async function getCampuses(): Promise<Campus[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('campuses').select('*').eq('is_active', true);
    if (!error && data) return data as Campus[];
  }
  return campuses.filter(c => c.is_active);
}

export async function getCampusById(id: string): Promise<Campus | null> {
  const all = await getCampuses();
  return all.find(c => c.id === id) || null;
}

export function getCurrentCampusId(): string {
  return currentCampusId;
}

export function setCurrentCampusId(campusId: string): void {
  currentCampusId = campusId;
  saveToStorage(STORAGE_KEYS.CURRENT_CAMPUS_ID, campusId);
  notifySubscribers();
}

export async function getCurrentUser(): Promise<Profile> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) return profile as Profile;
    }
  }
  const found = profiles.find(p => p.id === currentUserId) || profiles[0];
  return found;
}

export function switchDemoUser(userId: string): Profile {
  const target = profiles.find(p => p.id === userId) || profiles[0];
  currentUserId = target.id;
  if (target.default_campus_id) {
    currentCampusId = target.default_campus_id;
    saveToStorage(STORAGE_KEYS.CURRENT_CAMPUS_ID, currentCampusId);
  }
  saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  notifySubscribers();
  return target;
}

export function getAvailableDemoUsers(): Profile[] {
  return profiles;
}

/* =============================================================================
   ITEM REPORTING & DISCOVERY
   ============================================================================= */

export async function getItems(filters: ItemFilters = {}): Promise<Item[]> {
  const activeCampusId = filters.campus_id || currentCampusId;

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('items').select('*, campus:campuses(*), reporter:profiles(*)');
    if (activeCampusId) query = query.eq('campus_id', activeCampusId);
    if (filters.report_type && filters.report_type !== 'all') query = query.eq('report_type', filters.report_type);
    if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.color) query = query.ilike('color', `%${filters.color}%`);
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) return data as Item[];
  }

  // Local filtered implementation
  let result = items.filter(item => item.campus_id === activeCampusId);

  if (filters.report_type && filters.report_type !== 'all') {
    result = result.filter(item => item.report_type === filters.report_type);
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter(item => item.category === filters.category);
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter(item => item.status === filters.status);
  }

  if (filters.color) {
    const col = filters.color.toLowerCase();
    result = result.filter(item => item.color?.toLowerCase().includes(col));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location_name.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (filters.sortBy === 'oldest') {
    result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (filters.sortBy === 'date_lost_found') {
    result.sort((a, b) => new Date(b.date_lost_found).getTime() - new Date(a.date_lost_found).getTime());
  } else {
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Attach relations
  return result.map(item => ({
    ...item,
    campus: campuses.find(c => c.id === item.campus_id),
    reporter: profiles.find(p => p.id === item.user_id),
  }));
}

export async function getItemById(id: string): Promise<Item | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('items')
      .select('*, campus:campuses(*), reporter:profiles(*)')
      .eq('id', id)
      .single();
    if (!error && data) return data as Item;
  }

  const found = items.find(i => i.id === id);
  if (!found) return null;
  return {
    ...found,
    campus: campuses.find(c => c.id === found.campus_id),
    reporter: profiles.find(p => p.id === found.user_id),
  };
}

export async function createItem(itemInput: Omit<Item, 'id' | 'created_at' | 'status'>): Promise<Item> {
  const user = await getCurrentUser();
  const newItem: Item = {
    ...itemInput,
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    user_id: user.id,
    campus_id: itemInput.campus_id || currentCampusId,
    status: 'open',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('items').insert(newItem).select().single();
    if (!error && data) return data as Item;
  }

  items = [newItem, ...items];
  saveToStorage(STORAGE_KEYS.ITEMS, items);

  // Record audit log
  await recordAuditLog({
    action: 'ITEM_REPORTED',
    target_type: 'item',
    target_id: newItem.id,
    payload: { title: newItem.title, report_type: newItem.report_type },
  });

  // Run Intelligent Matching Engine immediately against opposite items on the same campus!
  const oppositeType: ItemReportType = newItem.report_type === 'lost' ? 'found' : 'lost';
  const candidatePool = items.filter(
    i => i.campus_id === newItem.campus_id && i.report_type === oppositeType && i.status !== 'resolved'
  );

  const potentialMatches = findPotentialMatches(newItem, candidatePool, 50);

  for (const match of potentialMatches) {
    const lostItem = newItem.report_type === 'lost' ? newItem : match.item;
    const foundItem = newItem.report_type === 'found' ? newItem : match.item;

    const newMatchRecord: MatchRecord = {
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      lost_item_id: lostItem.id,
      found_item_id: foundItem.id,
      similarity_score: match.breakdown.totalScore,
      breakdown_json: match.breakdown,
      status: 'suggested',
      created_at: new Date().toISOString(),
    };

    matches = [newMatchRecord, ...matches];
    saveToStorage(STORAGE_KEYS.MATCHES, matches);

    // Send notifications to both posters if score >= 70
    if (match.breakdown.totalScore >= 70) {
      await createNotification({
        user_id: lostItem.user_id,
        type: 'match_found',
        title: `High Match Alert (${match.breakdown.totalScore}%)`,
        message: `A matching found item "${foundItem.title}" was reported at ${foundItem.location_name}.`,
        link: `/items/${foundItem.id}`,
      });

      await createNotification({
        user_id: foundItem.user_id,
        type: 'match_found',
        title: `High Match Alert (${match.breakdown.totalScore}%)`,
        message: `Your found item matches a lost report: "${lostItem.title}".`,
        link: `/items/${lostItem.id}`,
      });
    }
  }

  notifySubscribers();
  return newItem;
}

export async function updateItem(
  id: string,
  updates: Partial<Pick<Item, 'title' | 'description' | 'color' | 'location_name' | 'status' | 'image_url'>>
): Promise<Item | null> {
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  saveToStorage(STORAGE_KEYS.ITEMS, items);
  notifySubscribers();
  return items[index];
}

export async function deleteItem(id: string): Promise<boolean> {
  items = items.filter(i => i.id !== id);
  claims = claims.filter(c => c.item_id !== id);
  matches = matches.filter(m => m.lost_item_id !== id && m.found_item_id !== id);
  saveToStorage(STORAGE_KEYS.ITEMS, items);
  saveToStorage(STORAGE_KEYS.CLAIMS, claims);
  saveToStorage(STORAGE_KEYS.MATCHES, matches);
  notifySubscribers();
  return true;
}

/* =============================================================================
   CLAIMS & RECOVERY WORKFLOW
   ============================================================================= */

export async function getClaimsForItem(itemId: string): Promise<Claim[]> {
  const filtered = claims.filter(c => c.item_id === itemId);
  return filtered.map(c => ({
    ...c,
    item: items.find(i => i.id === c.item_id),
    claimant: profiles.find(p => p.id === c.claimant_id),
    reviewer: profiles.find(p => p.id === c.reviewer_id),
  }));
}

export async function getMyClaims(userId: string): Promise<Claim[]> {
  const userClaims = claims.filter(c => c.claimant_id === userId);
  return userClaims.map(c => ({
    ...c,
    item: items.find(i => i.id === c.item_id),
    claimant: profiles.find(p => p.id === c.claimant_id),
  }));
}

export async function createClaim(
  itemId: string,
  claimData: { claim_message: string; proof_details: string }
): Promise<Claim> {
  const user = await getCurrentUser();
  const targetItem = await getItemById(itemId);
  if (!targetItem) throw new Error('Target item not found.');

  // Verification 1: Cannot claim own item
  if (targetItem.user_id === user.id) {
    throw new Error('You cannot claim an item you reported yourself.');
  }

  // Verification 2: Check for existing pending claim
  const existing = claims.find(c => c.item_id === itemId && c.claimant_id === user.id && c.status === 'pending');
  if (existing) {
    throw new Error('You already have a pending claim for this item.');
  }

  const newClaim: Claim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    item_id: itemId,
    claimant_id: user.id,
    claim_message: claimData.claim_message,
    proof_details: claimData.proof_details,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  claims = [newClaim, ...claims];
  saveToStorage(STORAGE_KEYS.CLAIMS, claims);

  // Send notification to item poster
  await createNotification({
    user_id: targetItem.user_id,
    type: 'claim_received',
    title: 'New Ownership Claim Received',
    message: `${user.full_name} submitted a claim for "${targetItem.title}". Review their proof details.`,
    link: `/items/${targetItem.id}`,
  });

  await recordAuditLog({
    action: 'CLAIM_SUBMITTED',
    target_type: 'claim',
    target_id: newClaim.id,
    payload: { item_id: itemId, claimant: user.email },
  });

  notifySubscribers();
  return newClaim;
}

export async function reviewClaim(
  claimId: string,
  decision: {
    status: 'approved' | 'rejected' | 'completed';
    review_notes?: string;
    handover_instructions?: string;
  }
): Promise<Claim> {
  const reviewer = await getCurrentUser();
  const index = claims.findIndex(c => c.id === claimId);
  if (index === -1) throw new Error('Claim not found.');

  const claim = claims[index];
  const targetItem = await getItemById(claim.item_id);
  if (!targetItem) throw new Error('Item not found.');

  claims[index] = {
    ...claim,
    status: decision.status,
    reviewer_id: reviewer.id,
    review_notes: decision.review_notes,
    handover_instructions: decision.handover_instructions,
    resolved_at: new Date().toISOString(),
  };

  saveToStorage(STORAGE_KEYS.CLAIMS, claims);

  // If approved: update item status to 'claimed'
  if (decision.status === 'approved') {
    await updateItem(targetItem.id, { status: 'claimed' });
  }

  // If completed: mark item as 'resolved'
  if (decision.status === 'completed') {
    await updateItem(targetItem.id, { status: 'resolved' });
  }

  // Notify claimant
  await createNotification({
    user_id: claim.claimant_id,
    type: 'claim_decision',
    title: `Claim ${decision.status.toUpperCase()}: ${targetItem.title}`,
    message:
      decision.status === 'approved'
        ? `Your claim was approved! Handover location: ${decision.handover_instructions || 'Campus Security Desk'}.`
        : decision.status === 'completed'
        ? `Return confirmed! Thank you for reuniting this item.`
        : `Your claim could not be verified by the reporter.`,
    link: `/items/${targetItem.id}`,
  });

  await recordAuditLog({
    action: `CLAIM_${decision.status.toUpperCase()}`,
    target_type: 'claim',
    target_id: claimId,
    payload: { reviewer: reviewer.email, item_id: targetItem.id },
  });

  notifySubscribers();
  return claims[index];
}

/* =============================================================================
   MATCH SUGGESTIONS
   ============================================================================= */

export async function getMatchesForItem(itemId: string): Promise<MatchRecord[]> {
  const itemMatches = matches.filter(
    m => (m.lost_item_id === itemId || m.found_item_id === itemId) && m.status !== 'dismissed'
  );

  return itemMatches.map(m => ({
    ...m,
    lost_item: items.find(i => i.id === m.lost_item_id),
    found_item: items.find(i => i.id === m.found_item_id),
  }));
}

export async function dismissMatch(matchId: string): Promise<void> {
  const index = matches.findIndex(m => m.id === matchId);
  if (index !== -1) {
    matches[index].status = 'dismissed';
    saveToStorage(STORAGE_KEYS.MATCHES, matches);
    notifySubscribers();
  }
}

/* =============================================================================
   NOTIFICATIONS
   ============================================================================= */

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  return notifications
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].is_read = true;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    notifySubscribers();
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  notifications = notifications.map(n => (n.user_id === userId ? { ...n, is_read: true } : n));
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  notifySubscribers();
}

export async function createNotification(
  notifInput: Omit<Notification, 'id' | 'is_read' | 'created_at'>
): Promise<Notification> {
  const newNotif: Notification = {
    ...notifInput,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  notifications = [newNotif, ...notifications];
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  notifySubscribers();
  return newNotif;
}

/* =============================================================================
   CAMPUS MODERATION & PLATFORM ADMIN
   ============================================================================= */

export async function getCampusMetrics(campusId: string) {
  const campusItems = items.filter(i => i.campus_id === campusId);
  const totalReports = campusItems.length;
  const lostReports = campusItems.filter(i => i.report_type === 'lost').length;
  const foundReports = campusItems.filter(i => i.report_type === 'found').length;
  const resolvedItems = campusItems.filter(i => i.status === 'resolved').length;
  const openClaims = claims.filter(c => {
    const item = items.find(i => i.id === c.item_id);
    return item?.campus_id === campusId && c.status === 'pending';
  }).length;

  const recoveryRate = totalReports > 0 ? Math.round((resolvedItems / totalReports) * 100) : 0;

  return {
    totalReports,
    lostReports,
    foundReports,
    resolvedItems,
    openClaims,
    recoveryRate,
  };
}

export async function submitAbuseReport(reportData: {
  target_item_id?: string;
  reason: string;
  details: string;
}): Promise<AbuseReport> {
  const user = await getCurrentUser();
  const newReport: AbuseReport = {
    id: `abuse-${Date.now()}`,
    campus_id: currentCampusId,
    reporter_id: user.id,
    target_item_id: reportData.target_item_id,
    reason: reportData.reason,
    details: reportData.details,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  abuseReports = [newReport, ...abuseReports];
  saveToStorage(STORAGE_KEYS.ABUSE_REPORTS, abuseReports);
  notifySubscribers();
  return newReport;
}

export async function getAbuseReportsForCampus(campusId: string): Promise<AbuseReport[]> {
  return abuseReports
    .filter(r => r.campus_id === campusId)
    .map(r => ({
      ...r,
      reporter: profiles.find(p => p.id === r.reporter_id),
      target_item: items.find(i => i.id === r.target_item_id),
    }));
}

export async function recordAuditLog(log: {
  action: string;
  target_type: string;
  target_id?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const user = await getCurrentUser();
  const entry: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    actor_id: user.id,
    campus_id: currentCampusId,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id,
    payload: log.payload,
    created_at: new Date().toISOString(),
  };

  auditLogs = [entry, ...auditLogs];
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  notifySubscribers();
}

export async function getCampusAuditLogs(campusId: string): Promise<AuditLog[]> {
  return auditLogs
    .filter(l => l.campus_id === campusId)
    .map(l => ({
      ...l,
      actor: profiles.find(p => p.id === l.actor_id),
      campus: campuses.find(c => c.id === l.campus_id),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
