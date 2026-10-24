# Back2You Implementation Plan

**Product:** Back2You — Campus Lost & Found Platform  
**Tagline:** Lost something? Let's bring it back to you.  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Supabase (PostgreSQL, Auth, Storage, RLS), TanStack Query, Vitest.

---

## Architecture Overview

```
                               +----------------------------+
                               |     Back2You Frontend      |
                               |  React + Vite + Tailwind   |
                               +--------------+-------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
       +-----------v------------+                            +-----------v------------+
       |   Supabase Client /    |                            | Client-Side Algorithm  |
       | Live Supabase Adapter  |                            | Smart Matching Engine  |
       |  (Auth, DB, Storage)   |                            | (Normalized 0-100 pts) |
       +-----------+------------+                            +-----------+------------+
                   |                                                     |
       +-----------v------------+                            +-----------v------------+
       | PostgreSQL 15 Database |                            |   Explainable Match    |
       | Tables, RLS, Indexes,  |                            | Breakdown & Candidates |
       | Triggers, Audit Logs   |                            +------------------------+
       +------------------------+
```

---

## Phase Breakdown

### Phase 1: Repository Assessment & Project Foundation
- Initialize repository with Vite + React 19 + TypeScript.
- Setup strict type checking and ESLint/Oxlint.
- Configure Tailwind CSS with the custom Back2You design system (Emerald/Forest/Teal, warm off-white, muted sage, amber accent).
- Create `.env.example`, `IMPLEMENTATION_PLAN.md`, `PROJECT_STATUS.md`, and `README.md`.

### Phase 2: Design System & Application Shell
- Reusable UI primitives: Buttons, Badges, Inputs, Cards, Dialogs, Selects, Dropdowns, Toast notifications.
- Application layout with responsive navbar, campus switcher, user menu, breadcrumbs, and footer.
- Accessible modals, confirmation dialogs, skeleton loaders, and zero-state illustrations.

### Phase 3: Database Architecture & Supabase Integration
- Write production PostgreSQL migrations (`supabase/migrations/20261024000001_init_schema.sql`):
  - `campuses` (campus code, name, domain, address, settings)
  - `profiles` (id, email, full_name, avatar_url, phone_hidden, default_campus_id, role: student/moderator/admin)
  - `campus_memberships` (user_id, campus_id, role, verified, joined_at)
  - `items` (id, campus_id, user_id, report_type: lost/found, title, category, description, private_clues, color, location_name, coordinates, date_lost_found, status: open/matching/claimed/resolved/closed, image_url, etc.)
  - `claims` (id, item_id, claimant_id, claim_message, proof_details, status: pending/approved/rejected/completed, reviewer_id, review_notes, created_at, resolved_at)
  - `matches` (id, lost_item_id, found_item_id, similarity_score, breakdown_json, status: suggested/dismissed/claimed)
  - `notifications` (id, user_id, type, title, message, link, read, created_at)
  - `abuse_reports` (id, campus_id, reporter_id, target_item_id, reason, details, status)
  - `audit_logs` (id, actor_id, campus_id, action, target_type, target_id, payload, created_at)
- Comprehensive RLS policies enforcing campus isolation, private claim confidentiality, and administrative role protections.
- Supabase client configured with graceful offline/demo-mode persistence fallback.

### Phase 4: Core Reporting & Discovery
- Report Lost / Report Found dual wizard with category, color, location, date, private ownership clues, and photo upload with privacy warnings.
- Search and exploration page with text search, category pills, lost/found filters, campus filters, date ranges, and sorting.
- Item detail page with privacy-masked owner contact, image gallery, location metadata, and action drawer.
- My Reports dashboard for tracking own items, editing, closing, and reviewing matches/claims.

### Phase 5: Intelligent Matching Engine
- 100-point normalized explainable scoring model:
  - Category similarity: 30 pts
  - Keyword & description token overlap: 25 pts
  - Location similarity: 20 pts
  - Date proximity decay: 15 pts
  - Color similarity: 10 pts
- Match explanation generator (e.g. "92% Match: Exact category match, 1 day apart, matched keywords: Blue, Leather, Stanford Student ID").
- Dismiss irrelevant suggestions, mark as claimed, and trigger notifications on high-scoring matches.

### Phase 6: Claims & Recovery Workflow
- Submit private claim with private verification answers.
- Reviewer actions: approve or reject with feedback notes.
- Supervised campus handover coordination guidance (e.g. Campus Security Office).
- Return confirmation and auto-resolution of matched reports.
- Real-time in-app notification center.

### Phase 7: Moderation & Administration Dashboards
- Moderator portal: review campus reports, handle abuse flags, review duplicate reports, resolve disputes.
- Administrator portal: campus management, moderator role assignment, audit logs, platform metrics.

### Phase 8: Testing & Quality Assurance
- Unit & integration tests with Vitest + React Testing Library:
  - Smart matching algorithm unit tests.
  - Validation schema tests (Zod).
  - Component tests (Forms, Item Cards, Claim Dialogs).
  - RBAC and campus isolation tests.
- Build validation (`npm run build`).

### Phase 9: Deployment Preparation
- Netlify (`_redirects`, `netlify.toml`) and Vercel (`vercel.json`) configuration.
- Detailed migration and Supabase setup guide.
- Production readiness verification.
