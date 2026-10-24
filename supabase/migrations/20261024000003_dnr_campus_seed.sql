-- =============================================================================
-- MIGRATION: 20261024000003_dnr_campus_seed.sql
-- DNR College of Engineering & Technology (DNRCET) Campus Configuration
-- Bhimavaram, Andhra Pradesh, India
-- =============================================================================

-- 1. Ensure team_designation column exists on profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_designation VARCHAR(100);

-- 2. Register or update DNR College of Engineering & Technology as primary campus
INSERT INTO public.campuses (
    id, 
    code, 
    name, 
    domain, 
    city, 
    state, 
    country, 
    security_office_location, 
    security_contact_email, 
    is_active
)
VALUES (
    'c1111111-1111-1111-1111-111111111111',
    'DNR-BVRM',
    'DNR College of Engineering & Technology',
    'dnrcet.org',
    'Bhimavaram',
    'Andhra Pradesh',
    'India',
    'Administrative Office & Security Help Desk, Main Block, DNRCET Campus',
    'lostfound@dnrcet.org',
    true
)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    security_office_location = EXCLUDED.security_office_location,
    security_contact_email = EXCLUDED.security_contact_email,
    is_active = true,
    updated_at = NOW();

-- Also ensure code uniqueness conflict doesn't fail if ID differed
INSERT INTO public.campuses (
    id, 
    code, 
    name, 
    domain, 
    city, 
    state, 
    country, 
    security_office_location, 
    security_contact_email, 
    is_active
)
VALUES (
    'c2222222-2222-2222-2222-222222222222',
    'SRKR-BVRM',
    'SRKR Engineering College',
    'srkrec.edu.in',
    'Bhimavaram',
    'Andhra Pradesh',
    'India',
    'Campus Security Desk, Main Administrative Block',
    'security@srkrec.edu.in',
    true
)
ON CONFLICT (code) DO NOTHING;

-- 3. Document campus settings in metadata / comments
COMMENT ON TABLE public.campuses IS 'Campus registry supporting isolated Lost & Found recovery portals with DNR-BVRM as primary';
