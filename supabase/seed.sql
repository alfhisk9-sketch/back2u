-- =============================================================================
-- BACK2YOU - DATABASE SEED DATA (DEVELOPMENT & DEMO FIXTURES)
-- =============================================================================

-- Seed Campuses
INSERT INTO public.campuses (id, code, name, domain, city, state, country, security_office_location, security_contact_email)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'SU-MAIN', 'Stanford University (Main Campus)', 'stanford.edu', 'Stanford', 'CA', 'US', 'Campus Safety & Property Desk, Tresidder Memorial Union, Rm 104', 'lostfound@stanford.edu'),
    ('c2222222-2222-2222-2222-222222222222', 'MIT-CAMB', 'Massachusetts Institute of Technology', 'mit.edu', 'Cambridge', 'MA', 'US', 'MIT Police & Campus Services, W89 Bldg, 301 Vassar St', 'lostandfound@mit.edu'),
    ('c3333333-3333-3333-3333-333333333333', 'BERK-CAL', 'UC Berkeley (Central Campus)', 'berkeley.edu', 'Berkeley', 'CA', 'US', 'UCPD Lost and Found, 1 Sproul Hall Basement', 'property@ucpd.berkeley.edu')
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Demo Items for Stanford (SU-MAIN)
-- Note: Replace user_id with authentic user IDs when running in Supabase after creating test auth users
