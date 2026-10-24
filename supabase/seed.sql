-- =============================================================================
-- BACK2YOU - DATABASE SEED DATA (DNR CAMPUS RECOVERY)
-- DNR College of Engineering & Technology (DNRCET), Bhimavaram, AP, India
-- =============================================================================

-- Seed Campuses
INSERT INTO public.campuses (id, code, name, domain, city, state, country, security_office_location, security_contact_email)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'DNR-BVRM', 'DNR College of Engineering & Technology', 'dnrcet.org', 'Bhimavaram', 'Andhra Pradesh', 'India', 'Administrative Office & Security Help Desk, Main Block, DNRCET Campus', 'lostfound@dnrcet.org'),
    ('c2222222-2222-2222-2222-222222222222', 'SRKR-BVRM', 'SRKR Engineering College', 'srkrec.edu.in', 'Bhimavaram', 'Andhra Pradesh', 'India', 'Campus Security Desk, Main Administrative Block', 'security@srkrec.edu.in')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    security_office_location = EXCLUDED.security_office_location,
    security_contact_email = EXCLUDED.security_contact_email;
