export type UserRole = 'student' | 'moderator' | 'admin';

export interface Campus {
  id: string;
  code: string;
  name: string;
  domain?: string;
  city: string;
  state?: string;
  country: string;
  security_office_location: string;
  security_contact_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  phone_hidden: boolean;
  default_campus_id?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface CampusMembership {
  id: string;
  user_id: string;
  campus_id: string;
  role: UserRole;
  status: 'pending' | 'active' | 'suspended';
  verified_at: string;
  joined_at: string;
}

export type ItemReportType = 'lost' | 'found';
export type ItemStatus = 'open' | 'matching' | 'claimed' | 'resolved' | 'closed';

export type ItemCategory =
  | 'identity_cards'
  | 'books_notebooks'
  | 'wallets_purses'
  | 'electronics'
  | 'keys'
  | 'bags_backpacks'
  | 'clothing'
  | 'water_bottles'
  | 'accessories'
  | 'other';

export interface Item {
  id: string;
  campus_id: string;
  user_id: string;
  report_type: ItemReportType;
  title: string;
  category: ItemCategory;
  description: string;
  private_clues?: string;
  color?: string;
  distinguishing_features?: string;
  location_name: string;
  date_lost_found: string;
  status: ItemStatus;
  image_url?: string;
  is_sensitive?: boolean;
  created_at: string;
  updated_at?: string;
  
  // Relations
  campus?: Campus;
  reporter?: Profile;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  claim_message: string;
  proof_details: string;
  status: ClaimStatus;
  reviewer_id?: string;
  review_notes?: string;
  handover_instructions?: string;
  created_at: string;
  resolved_at?: string;
  
  // Relations
  item?: Item;
  claimant?: Profile;
  reviewer?: Profile;
}

export interface MatchBreakdown {
  categoryScore: number;      // 0 - 30 pts
  descriptionScore: number;   // 0 - 25 pts
  locationScore: number;      // 0 - 20 pts
  dateScore: number;          // 0 - 15 pts
  colorScore: number;         // 0 - 10 pts
  totalScore: number;         // 0 - 100 pts
  matchedKeywords: string[];
  explanation: string;
}

export interface MatchRecord {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  similarity_score: number;
  breakdown_json: MatchBreakdown;
  status: 'suggested' | 'dismissed' | 'claimed';
  created_at: string;
  updated_at?: string;

  // Relations
  lost_item?: Item;
  found_item?: Item;
}

export type NotificationType =
  | 'match_found'
  | 'claim_received'
  | 'claim_decision'
  | 'return_confirmed'
  | 'admin_notice';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AbuseReport {
  id: string;
  campus_id: string;
  reporter_id: string;
  target_item_id?: string;
  target_claim_id?: string;
  reason: string;
  details: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  reviewer_id?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  
  // Relations
  reporter?: Profile;
  target_item?: Item;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  campus_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  payload?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  
  // Relations
  actor?: Profile;
  campus?: Campus;
}

export interface ItemFilters {
  search?: string;
  campus_id?: string;
  report_type?: ItemReportType | 'all';
  category?: ItemCategory | 'all';
  status?: ItemStatus | 'all';
  startDate?: string;
  endDate?: string;
  color?: string;
  sortBy?: 'newest' | 'oldest' | 'date_lost_found';
}
