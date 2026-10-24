import { describe, it, expect } from 'vitest';
import {
  reportItemSchema,
  claimItemSchema,
  reviewClaimSchema,
  loginSchema,
  registerSchema,
} from './validation';

describe('Validation Schemas (Zod)', () => {
  it('validates a correct lost report payload', () => {
    const validData = {
      report_type: 'lost' as const,
      title: 'Stanford ID Card',
      category: 'identity_cards' as const,
      description: 'Lost near student union patio with lanyard.',
      location_name: 'Tresidder Union',
      date_lost_found: '2026-10-24',
      is_sensitive: true,
      color: 'red',
    };
    const parsed = reportItemSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('rejects an item report with too short title', () => {
    const invalidData = {
      report_type: 'lost',
      title: 'No',
      category: 'keys',
      description: 'Lost my keys somewhere on campus.',
      location_name: 'Library',
      date_lost_found: '2026-10-24',
      is_sensitive: false,
    };
    const parsed = reportItemSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('validates a valid claim payload', () => {
    const validClaim = {
      claim_message: 'Hi, I lost this badge earlier this morning.',
      proof_details: 'The student ID number ends in 4829 with an enamel pin on lanyard.',
    };
    const parsed = claimItemSchema.safeParse(validClaim);
    expect(parsed.success).toBe(true);
  });

  it('rejects claim with empty proof details', () => {
    const invalidClaim = {
      claim_message: 'This is mine please give it back.',
      proof_details: 'Short',
    };
    const parsed = claimItemSchema.safeParse(invalidClaim);
    expect(parsed.success).toBe(false);
  });

  it('validates review claim status transitions', () => {
    expect(reviewClaimSchema.safeParse({ status: 'approved', handover_instructions: 'Security desk' }).success).toBe(true);
    expect(reviewClaimSchema.safeParse({ status: 'rejected', review_notes: 'Proof mismatched' }).success).toBe(true);
    expect(reviewClaimSchema.safeParse({ status: 'completed' }).success).toBe(true);
    expect(reviewClaimSchema.safeParse({ status: 'unknown_status' }).success).toBe(false);
  });

  it('validates authentication credentials', () => {
    expect(loginSchema.safeParse({ email: 'test@stanford.edu', password: 'password123' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'invalid-email', password: '123' }).success).toBe(false);

    expect(
      registerSchema.safeParse({
        full_name: 'Alice Chen',
        email: 'alice@stanford.edu',
        password: 'securepass123',
        campus_id: 'campus-1',
      }).success
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        full_name: 'A',
        email: 'bad-email',
        password: '123',
        campus_id: '',
      }).success
    ).toBe(false);
  });
});
