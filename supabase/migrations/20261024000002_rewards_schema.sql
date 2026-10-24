-- =============================================================================
-- BACK2YOU - REWARDS, ACHIEVEMENTS & CAMPUS LEADERBOARD SCHEMA
-- Back2You Stars — Verified Contribution Rewards and Achievement System
-- =============================================================================

-- 1. REWARD TRANSACTIONS LEDGER TABLE
-- Authoritative append-only ledger for all earned Stars
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL CHECK (
        event_type IN (
            'found_report_accepted',
            'moderator_verified',
            'recovery_completed',
            'helpful_report_recovery'
        )
    ),
    points INTEGER NOT NULL CHECK (points > 0),
    description TEXT NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER ACHIEVEMENTS TABLE
-- Authoritative unlocked badges; unique per (user_id, achievement_code)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    achievement_code VARCHAR(100) NOT NULL CHECK (
        achievement_code IN (
            'first_finder',
            'bronze_helper',
            'silver_helper',
            'gold_helper',
            'campus_hero',
            'recovery_champion',
            'trusted_contributor'
        )
    ),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_code)
);

-- =============================================================================
-- PERFORMANCE & AGGREGATION INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_reward_tx_user_created ON public.reward_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_tx_campus_created ON public.reward_transactions(campus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_tx_item ON public.reward_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_reward_tx_event ON public.reward_transactions(event_type);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_campus ON public.user_achievements(campus_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- REWARD TRANSACTIONS RLS:
-- Users can only view their own transactions; campus moderators can audit campus transactions.
CREATE POLICY "Users can view own reward transactions; moderators view campus transactions"
ON public.reward_transactions FOR SELECT TO authenticated
USING (
    auth.uid() = user_id OR public.is_campus_moderator(campus_id)
);

-- STRICT SECURITY: Authenticated users CANNOT directly INSERT, UPDATE, or DELETE transactions.
-- Rewards can only be minted via trusted SECURITY DEFINER stored procedures or service role.

-- USER ACHIEVEMENTS RLS:
-- Campus members can view achievements within their campus (for leaderboards and public profiles).
CREATE POLICY "Campus members can view campus user achievements"
ON public.user_achievements FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.campus_memberships
        WHERE campus_memberships.user_id = auth.uid()
          AND campus_memberships.campus_id = user_achievements.campus_id
          AND campus_memberships.status = 'active'
    ) OR public.is_admin()
);

-- STRICT SECURITY: Authenticated users CANNOT directly INSERT, UPDATE, or DELETE achievements.

-- =============================================================================
-- TRUSTED REWARD PROCESSING & EVALUATION PROCEDURES
-- SET search_path = public, pg_temp; to prevent CVE search_path injection
-- =============================================================================

/**
 * Trusted RPC: Issue Reward Points with Idempotency Key
 */
CREATE OR REPLACE FUNCTION public.issue_reward_points(
    p_user_id UUID,
    p_campus_id UUID,
    p_item_id UUID,
    p_event_type VARCHAR,
    p_points INTEGER,
    p_description TEXT,
    p_idempotency_key VARCHAR
)
RETURNS TABLE (
    transaction_id UUID,
    points_awarded INTEGER,
    is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_id UUID;
    v_new_id UUID;
BEGIN
    -- Validate point amounts according to authoritative rules
    IF p_event_type = 'found_report_accepted' AND p_points <> 10 THEN
        RAISE EXCEPTION 'Invalid Reward Points: found_report_accepted must award exactly 10 Stars.';
    ELSIF p_event_type = 'moderator_verified' AND p_points <> 15 THEN
        RAISE EXCEPTION 'Invalid Reward Points: moderator_verified must award exactly 15 Stars.';
    ELSIF p_event_type = 'recovery_completed' AND p_points <> 25 THEN
        RAISE EXCEPTION 'Invalid Reward Points: recovery_completed must award exactly 25 Stars.';
    ELSIF p_event_type = 'helpful_report_recovery' AND p_points <> 10 THEN
        RAISE EXCEPTION 'Invalid Reward Points: helpful_report_recovery must award exactly 10 Stars.';
    END IF;

    -- Check if transaction already exists for idempotency
    SELECT id INTO v_existing_id
    FROM public.reward_transactions
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_id IS NOT NULL THEN
        RETURN QUERY SELECT v_existing_id, 0, false;
        RETURN;
    END IF;

    -- Insert new reward transaction
    INSERT INTO public.reward_transactions (
        user_id,
        campus_id,
        item_id,
        event_type,
        points,
        description,
        idempotency_key,
        created_at
    ) VALUES (
        p_user_id,
        p_campus_id,
        p_item_id,
        p_event_type,
        p_points,
        p_description,
        p_idempotency_key,
        NOW()
    ) RETURNING id INTO v_new_id;

    -- Trigger authoritative achievement evaluation
    PERFORM public.evaluate_user_achievements(p_user_id, p_campus_id);

    RETURN QUERY SELECT v_new_id, p_points, true;
END;
$$;

/**
 * Trusted RPC: Evaluate User Achievements
 * Calculates progress from authoritative database records and awards new badges idempotently.
 */
CREATE OR REPLACE FUNCTION public.evaluate_user_achievements(
    p_user_id UUID,
    p_campus_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_found_count INTEGER;
    v_mod_verified_count INTEGER;
    v_recovery_count INTEGER;
    v_contribution_count INTEGER;
    
    v_award_badge RECORD;
    v_badge_title TEXT;
BEGIN
    -- 1. Authoritative Metric Counts
    SELECT COUNT(*) INTO v_found_count
    FROM public.items
    WHERE user_id = p_user_id AND report_type = 'found';

    SELECT COUNT(DISTINCT item_id) INTO v_mod_verified_count
    FROM public.reward_transactions
    WHERE user_id = p_user_id AND event_type = 'moderator_verified';

    SELECT COUNT(DISTINCT c.id) INTO v_recovery_count
    FROM public.claims c
    JOIN public.items i ON i.id = c.item_id
    WHERE (c.claimant_id = p_user_id OR i.user_id = p_user_id) AND c.status = 'completed';

    SELECT COUNT(*) INTO v_contribution_count
    FROM public.reward_transactions
    WHERE user_id = p_user_id;

    -- 2. Check each milestone rule
    -- Rule 1: first_finder
    IF v_found_count >= 1 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'first_finder')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '🏆 Achievement Unlocked: First Finder!',
                'You submitted your first qualifying found-item report. Badge awarded!',
                '/rewards'
            );
        END IF;
    END IF;

    -- Rule 2: bronze_helper (3 contributions)
    IF v_contribution_count >= 3 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'bronze_helper')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '🏆 Achievement Unlocked: Bronze Helper!',
                'You reached 3 verified campus contributions. Bronze Helper badge awarded!',
                '/rewards'
            );
        END IF;
    END IF;

    -- Rule 3: silver_helper (10 contributions)
    IF v_contribution_count >= 10 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'silver_helper')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '🏆 Achievement Unlocked: Silver Helper!',
                'You reached 10 verified campus contributions. Silver Helper badge awarded!',
                '/rewards'
            );
        END IF;
    END IF;

    -- Rule 4: gold_helper (25 contributions)
    IF v_contribution_count >= 25 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'gold_helper')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '🏆 Achievement Unlocked: Gold Helper!',
                'You reached 25 verified campus contributions. Gold Helper badge awarded!',
                '/rewards'
            );
        END IF;
    END IF;

    -- Rule 5: campus_hero (50 contributions)
    IF v_contribution_count >= 50 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'campus_hero')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '👑 Legendary Achievement: Campus Hero!',
                'Incredible dedication! You reached 50 verified contributions. Campus Hero crown awarded!',
                '/rewards'
            );
        END IF;
    END IF;

    -- Rule 6: recovery_champion (5 completed returns)
    IF v_recovery_count >= 5 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'recovery_champion')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '🏆 Achievement Unlocked: Recovery Champion!',
                'You facilitated 5 verified item recoveries. Recovery Champion badge awarded!',
                '/rewards'
            );
        END IF;
    END IF;

    -- Rule 7: trusted_contributor (10 moderator-verified found reports)
    IF v_mod_verified_count >= 10 THEN
        INSERT INTO public.user_achievements (user_id, campus_id, achievement_code)
        VALUES (p_user_id, p_campus_id, 'trusted_contributor')
        ON CONFLICT (user_id, achievement_code) DO NOTHING;
        
        IF FOUND THEN
            INSERT INTO public.notifications (user_id, type, title, message, link)
            VALUES (
                p_user_id,
                'achievement_unlocked',
                '🏆 Achievement Unlocked: Trusted Contributor!',
                '10 of your found items have been verified by campus moderators!',
                '/rewards'
            );
        END IF;
    END IF;
END;
$$;

/**
 * Trusted Leaderboard RPC: Campus-scoped ranking
 * Privacy-safe: returns only display_name and avatar_url; never returns email, phone, or student IDs.
 */
CREATE OR REPLACE FUNCTION public.get_campus_leaderboard(
    p_campus_id UUID,
    p_time_frame VARCHAR DEFAULT 'all_time'
)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    stars BIGINT,
    verified_contributions BIGINT,
    badge_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH timeframe_tx AS (
        SELECT 
            rt.user_id,
            SUM(rt.points) AS stars,
            COUNT(rt.id) AS verified_contributions
        FROM public.reward_transactions rt
        WHERE rt.campus_id = p_campus_id
          AND (
            p_time_frame = 'all_time'
            OR (p_time_frame = 'weekly' AND rt.created_at >= NOW() - INTERVAL '7 days')
            OR (p_time_frame = 'monthly' AND rt.created_at >= NOW() - INTERVAL '30 days')
          )
        GROUP BY rt.user_id
    ),
    user_badges AS (
        SELECT ua.user_id, COUNT(ua.id) AS badge_count
        FROM public.user_achievements ua
        WHERE ua.campus_id = p_campus_id
        GROUP BY ua.user_id
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY COALESCE(tt.stars, 0) DESC, COALESCE(tt.verified_contributions, 0) DESC) AS rank,
        p.id AS user_id,
        p.full_name AS display_name,
        p.avatar_url,
        COALESCE(tt.stars, 0) AS stars,
        COALESCE(tt.verified_contributions, 0) AS verified_contributions,
        COALESCE(ub.badge_count, 0) AS badge_count
    FROM public.profiles p
    JOIN timeframe_tx tt ON tt.user_id = p.id
    LEFT JOIN user_badges ub ON ub.user_id = p.id
    WHERE tt.stars > 0
    ORDER BY stars DESC, verified_contributions DESC
    LIMIT 100;
$$;
