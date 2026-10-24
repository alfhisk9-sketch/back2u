-- =============================================================================
-- BACK2YOU - PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Multi-Campus Lost & Found Platform
-- =============================================================================

-- Enable UUID & Trigram extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. CAMPUSES TABLE
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    security_office_location TEXT DEFAULT 'Campus Security & Lost Property Desk, Student Center Bldg A',
    security_contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES TABLE (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(50),
    phone_hidden BOOLEAN DEFAULT true,
    default_campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPUS MEMBERSHIPS (Multi-campus verification)
CREATE TABLE IF NOT EXISTS public.campus_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campus_id)
);

-- 4. ITEMS TABLE (Lost & Found Listings - Public Attributes)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('lost', 'found')),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR(100),
    distinguishing_features TEXT,
    location_name VARCHAR(255) NOT NULL,
    date_lost_found DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matching', 'claimed', 'resolved', 'closed')),
    image_url TEXT,
    is_sensitive BOOLEAN DEFAULT false, -- For IDs/Wallets with private numbers masked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4B. ITEM PRIVATE DETAILS (Strict Column Confidentiality)
-- Hidden ownership verification clues are isolated in this table to prevent leakage in public queries
CREATE TABLE IF NOT EXISTS public.item_private_details (
    item_id UUID PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
    private_clues TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLAIMS TABLE (Ownership claim verification)
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    claim_message TEXT NOT NULL,
    proof_details TEXT NOT NULL, -- Answers to verify ownership
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    handover_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(item_id, claimant_id, status) -- Prevents multiple active claims by same claimant
);

-- 6. MATCHES TABLE (Pairwise Similarity Records)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lost_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    found_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5, 2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
    breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'dismissed', 'claimed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lost_item_id, found_item_id)
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'match_found', 'claim_received', 'claim_decision', 'return_confirmed', 'admin_notice'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ABUSE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    target_claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE & SEARCH
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_items_campus_status ON public.items(campus_id, status);
CREATE INDEX IF NOT EXISTS idx_items_report_type ON public.items(report_type);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_date ON public.items(date_lost_found DESC);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_title_trgm ON public.items USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_claims_item ON public.claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON public.claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);

CREATE INDEX IF NOT EXISTS idx_matches_lost ON public.matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found ON public.matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches(similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_campus ON public.audit_logs(campus_id, created_at DESC);

-- =============================================================================
-- SECURITY DEFINER FUNCTIONS WITH SEARCH_PATH HARDENING
-- Prevents CVE search_path injection attacks
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_campus_moderator(lookup_campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.campus_memberships 
        WHERE user_id = auth.uid() 
          AND campus_id = lookup_campus_id 
          AND role IN ('moderator', 'admin')
          AND status = 'active'
    ) OR public.is_admin();
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- CAMPUSES POLICIES
CREATE POLICY "Campuses viewable by authenticated users"
ON public.campuses FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Campuses modifiable only by admins"
ON public.campuses FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PROFILES POLICIES
CREATE POLICY "Public profiles viewable by campus members"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own non-role profile fields"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- TRIGGER: PREVENT SELF-ROLE ESCALATION
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Security Violation: Users cannot promote themselves to moderator or administrator.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- ITEMS POLICIES
CREATE POLICY "Items viewable by campus members"
ON public.items FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.campus_memberships 
        WHERE campus_memberships.user_id = auth.uid() 
          AND campus_memberships.campus_id = items.campus_id
          AND campus_memberships.status = 'active'
    ) OR public.is_admin()
);

CREATE POLICY "Users can insert items only for themselves in their campus"
ON public.items FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.campus_memberships 
        WHERE campus_memberships.user_id = auth.uid() 
          AND campus_memberships.campus_id = items.campus_id
          AND campus_memberships.status = 'active'
    )
);

CREATE POLICY "Users can update own open items; moderators can update campus items"
ON public.items FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id OR public.is_campus_moderator(campus_id)
)
WITH CHECK (
    auth.uid() = user_id OR public.is_campus_moderator(campus_id)
);

CREATE POLICY "Users can delete own items before claimed; moderators can delete"
ON public.items FOR DELETE TO authenticated
USING (
    (auth.uid() = user_id AND status IN ('open', 'closed')) OR public.is_campus_moderator(campus_id)
);

-- ITEM PRIVATE DETAILS POLICIES (Guarantees Private Clues Confidentiality)
CREATE POLICY "Private clues visible only to item owner or campus moderator"
ON public.item_private_details FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.items 
        WHERE items.id = item_private_details.item_id 
          AND (items.user_id = auth.uid() OR public.is_campus_moderator(items.campus_id))
    )
);

CREATE POLICY "Private clues insertable only by item owner"
ON public.item_private_details FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.items 
        WHERE items.id = item_private_details.item_id 
          AND items.user_id = auth.uid()
    )
);

-- CLAIMS POLICIES
CREATE POLICY "Claims viewable only by claimant, item poster, or moderator"
ON public.claims FOR SELECT TO authenticated
USING (
    auth.uid() = claimant_id 
    OR EXISTS (SELECT 1 FROM public.items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
    OR public.is_campus_moderator((SELECT campus_id FROM public.items WHERE items.id = claims.item_id))
);

CREATE POLICY "Users can create claim for items they do not own"
ON public.claims FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = claimant_id
    AND NOT EXISTS (SELECT 1 FROM public.items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
);

CREATE POLICY "Item poster or moderator can review claims"
ON public.claims FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
    OR public.is_campus_moderator((SELECT campus_id FROM public.items WHERE items.id = claims.item_id))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
    OR public.is_campus_moderator((SELECT campus_id FROM public.items WHERE items.id = claims.item_id))
);

-- TRIGGER: ENFORCE VALID CLAIM STATE TRANSITIONS
CREATE OR REPLACE FUNCTION public.check_claim_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Disallow updates if already completed
    IF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
        RAISE EXCEPTION 'Invalid State Transition: Completed claims are finalized and cannot be modified.';
    END IF;

    -- Disallow updates if already rejected
    IF OLD.status = 'rejected' AND NEW.status <> 'rejected' THEN
        RAISE EXCEPTION 'Invalid State Transition: Rejected claims cannot be reactivated.';
    END IF;

    -- Valid: pending -> approved or rejected
    -- Valid: approved -> completed or rejected
    IF OLD.status = 'pending' AND NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid State Transition: Pending claims can only move to approved or rejected.';
    END IF;

    IF OLD.status = 'approved' AND NEW.status NOT IN ('approved', 'completed', 'rejected') THEN
        RAISE EXCEPTION 'Invalid State Transition: Approved claims can only move to completed or rejected.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_claim_status_transition
BEFORE UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.check_claim_status_transition();

-- MATCHES POLICIES
CREATE POLICY "Matches viewable by item owners or moderators"
ON public.matches FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.items 
        WHERE (items.id = matches.lost_item_id OR items.id = matches.found_item_id)
          AND items.user_id = auth.uid()
    )
    OR public.is_campus_moderator((SELECT campus_id FROM public.items WHERE items.id = matches.lost_item_id))
);

CREATE POLICY "Matches updatable by item owners (dismiss)"
ON public.matches FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.items 
        WHERE (items.id = matches.lost_item_id OR items.id = matches.found_item_id)
          AND items.user_id = auth.uid()
    )
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ABUSE REPORTS POLICIES
CREATE POLICY "Users view reports they submitted; moderators view campus reports"
ON public.abuse_reports FOR SELECT TO authenticated
USING (
    auth.uid() = reporter_id OR public.is_campus_moderator(campus_id)
);

CREATE POLICY "Users can submit abuse reports"
ON public.abuse_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update abuse reports"
ON public.abuse_reports FOR UPDATE TO authenticated
USING (public.is_campus_moderator(campus_id));

-- AUDIT LOGS POLICIES
CREATE POLICY "Only admins and moderators can view campus audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_campus_moderator(campus_id));

CREATE POLICY "System can record audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- =============================================================================
-- STORAGE BUCKET RLS POLICIES (item-images)
-- =============================================================================
-- Insert storage bucket configuration if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'item-images',
    'item-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage bucket access policy
CREATE POLICY "Authenticated users can upload item images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'item-images'
    AND (LOWER(storage.extension(name)) = 'jpg' OR LOWER(storage.extension(name)) = 'jpeg' OR LOWER(storage.extension(name)) = 'png' OR LOWER(storage.extension(name)) = 'webp')
);

CREATE POLICY "Item images publicly readable"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'item-images');

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campuses_updated_at BEFORE UPDATE ON public.campuses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
