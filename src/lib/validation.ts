import { z } from 'zod';

export const ITEM_CATEGORIES = [
  'identity_cards',
  'books_notebooks',
  'wallets_purses',
  'electronics',
  'keys',
  'bags_backpacks',
  'clothing',
  'water_bottles',
  'accessories',
  'other',
] as const;

export const CATEGORY_LABELS: Record<(typeof ITEM_CATEGORIES)[number], string> = {
  identity_cards: 'Campus IDs & Badges',
  books_notebooks: 'Books & Course Notes',
  wallets_purses: 'Wallets & Purses',
  electronics: 'Electronics & Chargers',
  keys: 'Keys & Keycards',
  bags_backpacks: 'Backpacks & Bags',
  clothing: 'Jackets & Clothing',
  water_bottles: 'Water Bottles & Tumblers',
  accessories: 'Glasses & Jewelry',
  other: 'Other Belongings',
};

export const reportItemSchema = z.object({
  report_type: z.enum(['lost', 'found']),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .max(100, 'Title must be under 100 characters.'),
  category: z.enum(ITEM_CATEGORIES),
  description: z
    .string()
    .min(10, 'Please provide at least 10 characters describing the item.')
    .max(2000, 'Description must be under 2,000 characters.'),
  private_clues: z
    .string()
    .max(1000, 'Private clues must be under 1,000 characters.')
    .optional(),
  color: z.string().max(50).optional(),
  location_name: z
    .string()
    .min(2, 'Please specify the building, room, or campus landmark.')
    .max(150, 'Location must be under 150 characters.'),
  date_lost_found: z
    .string()
    .min(1, 'Please select the date.'),
  image_url: z.string().optional(),
  is_sensitive: z.boolean(),
});

export type ReportItemFormData = z.infer<typeof reportItemSchema>;

export const claimItemSchema = z.object({
  claim_message: z
    .string()
    .min(10, 'Please provide an introductory message explaining your claim (min 10 characters).')
    .max(1000, 'Message must be under 1,000 characters.'),
  proof_details: z
    .string()
    .min(10, 'Please provide distinct proof of ownership (e.g. lock screen description, internal tags, stickers, or serial details).')
    .max(2000, 'Proof details must be under 2,000 characters.'),
});

export type ClaimItemFormData = z.infer<typeof claimItemSchema>;

export const reviewClaimSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
  review_notes: z.string().max(1000).optional(),
  handover_instructions: z.string().max(1000).optional(),
});

export type ReviewClaimFormData = z.infer<typeof reviewClaimSchema>;

export const abuseReportSchema = z.object({
  reason: z.string().min(3, 'Please select or provide a reason.'),
  details: z.string().min(10, 'Please describe why this listing is abusive or suspicious (min 10 chars).'),
});

export type AbuseReportFormData = z.infer<typeof abuseReportSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid campus or personal email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter your college email or valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  campus_id: z.string().min(1, 'Please select your campus.'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
