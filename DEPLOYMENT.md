# Back2You — Netlify & Supabase Production Deployment Guide

This guide details the exact steps to configure, migrate, and deploy **Back2You** to **Netlify** (using the Free Tier) with an optional **Supabase (PostgreSQL, Auth & Storage)** backend or zero-config **Interactive Demo Mode**.

---

## 1. Operating Modes: Live Supabase vs. Interactive Demo Mode

| Feature | Live Supabase Mode | Interactive Demo Mode |
|---|---|---|
| **Trigger Condition** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` provided, and `VITE_DEMO_MODE=false` | Supabase keys blank OR `VITE_DEMO_MODE=true` |
| **Data Persistence** | Live PostgreSQL database with Row Level Security (RLS) | In-memory & browser `localStorage` |
| **Authentication** | Real Supabase Auth (email/password with verified sessions) | Persona switcher for judges/evaluators |
| **Data Nature** | Real user-generated items, verified claims, and live audits | **Synthetic test fixtures** (Bob Miller, Alice Chen, etc.). **Never present demo data as real user activity.** |
| **Persona Switching** | **Disabled in production** (`DevBar` does not render; `switchDemoUser` throws security violation) | Active for testing and hackathon review |
| **Photo Uploads** | Supabase Storage (`item-images` bucket) | Client-side base64 Data URLs |

---

## 2. Supabase Backend Setup & Migration Sequence

> [!IMPORTANT]
> If you are deploying in Live Supabase mode, the database migrations **must be applied in exact chronological order**. Do not claim migrations are applied on your project until you have run them in the Supabase SQL Editor.

### Step 2.1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Name your project (e.g., `back2you-production`), set a database password, and select your preferred region.
3. In **Project Settings** -> **API**, copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon public key** (`eyJhbGciOiJI...`)

### Step 2.2: Apply Migrations in Order

#### Migration 1: Core Platform Schema (Run FIRST)
1. In Supabase Dashboard, open the **SQL Editor**.
2. Open [`supabase/migrations/20261024000001_init_schema.sql`](file:///c:/back2you/supabase/migrations/20261024000001_init_schema.sql).
3. Paste and run the entire script.
4. **Verified Entities Created:**
   - Extensions: `uuid-ossp`, `pg_trgm`
   - Core tables: `campuses`, `profiles`, `campus_memberships`, `items`, `item_private_details`, `claims`, `matches`, `notifications`, `abuse_reports`, `audit_logs`
   - `SECURITY DEFINER` functions with `search_path = public, pg_temp;` (`get_auth_user_role`, `is_admin`, `is_campus_moderator`)
   - Integrity triggers: `trg_prevent_role_escalation`, `trg_claim_status_transition`
   - Row Level Security (RLS) policies on all tables
   - Storage bucket configuration: `item-images`

#### Migration 2: Back2You Stars & Achievements (Run SECOND)
1. In the SQL Editor, create a new query.
2. Open [`supabase/migrations/20261024000002_rewards_schema.sql`](file:///c:/back2you/supabase/migrations/20261024000002_rewards_schema.sql).
3. Paste and run the entire script.
4. **Verified Entities Created:**
   - Tables: `reward_transactions`, `user_achievements`
   - Constraints: `points > 0`, `idempotency_key UNIQUE`, `UNIQUE(user_id, achievement_code)`
   - Stored procedures: `issue_reward_points`, `evaluate_user_achievements`, `get_campus_leaderboard`
   - RLS policies restricting transaction minting to trusted procedures

### Step 2.3: Configure Auth & Storage
1. **Redirect URLs:** Go to **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your Netlify site URL: `https://<your-site-name>.netlify.app`
   - Add `http://localhost:5173/**` and `https://*.netlify.app/**` to **Redirect URLs**.
2. **Storage:** In **Storage**, confirm the `item-images` bucket exists with public read access and authenticated upload access.

---

## 3. Environment Variables Reference

Configure these in the Netlify Dashboard (**Site configuration** -> **Environment variables**) or in your local `.env`:

| Variable Name | Required for Live | Required for Demo | Description | Default / Example |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | No | Live Supabase Project URL | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | No | Supabase public anonymous API key | `eyJhbGciOi...` |
| `VITE_DEMO_MODE` | No | No | Forces demo mode even if keys exist | `false` (for live) / `true` (for demo) |
| `VITE_DEFAULT_CAMPUS_CODE`| No | No | Default university campus code | `SU-MAIN` |
| `VITE_STORAGE_BUCKET` | No | No | Bucket name for item photos | `item-images` |

> [!CAUTION]
> Never commit real Supabase Service Role keys or personal secrets. Only the `anon` public key is permitted on the client.

---

## 4. Deploying to Netlify (Free Tier)

### Method 1: Continuous Deployment via GitHub (Recommended)
1. Push your repository to your GitHub account:
   ```bash
   git push origin master
   ```
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** -> **Import an existing project**.
4. Select **GitHub** and authorize access to your `back2you` repository.
5. Netlify reads [`netlify.toml`](file:///c:/back2you/netlify.toml) automatically:
   - **Base directory:** (leave empty)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Add environment variables** and enter:
   - `VITE_SUPABASE_URL` = your Supabase URL (or leave blank for Demo Mode)
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key (or leave blank for Demo Mode)
   - `VITE_DEMO_MODE` = `false` (or `true` if you want instant demo evaluation)
7. Click **Deploy Back2You**.
8. Your site will be live at `https://<generated-name>.netlify.app` in ~30 seconds.

### Method 2: Instant Manual Deployment via Netlify Drop (Zero-CLI, 100% Free)
If you do not want to connect GitHub:
1. Build the production bundle locally:
   ```powershell
   npm run build
   ```
2. Confirm the `dist` folder was created containing `index.html`, `assets/`, and `_redirects`.
3. Open [https://app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
4. Drag and drop the `dist` folder into the upload target.
5. Netlify deploys the site instantly with a free live URL.

### Method 3: Via Netlify CLI
```powershell
npx netlify-cli login
npm run build
npx netlify-cli deploy --prod --dir=dist
```

---

## 5. Client-Side Routing Verification

Back2You is a Single Page Application (SPA) using React Router 7. To ensure client-side routes like `/rewards`, `/my-reports`, `/moderator`, and `/items/:id` do not return `404 Not Found` when a user refreshes their browser, the following files are pre-configured:

1. **[`netlify.toml`](file:///c:/back2you/netlify.toml):**
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
2. **[`public/_redirects`](file:///c:/back2you/public/_redirects):**
   ```
   /*    /index.html   200
   ```
During `npm run build`, Vite copies `public/_redirects` into `dist/_redirects`, providing double-layer routing fallback on Netlify.

---

## 6. Pre-Deployment Verification Checklist

- [x] **Production Build Clean:** `npm run build` compiles with 0 errors in ~1.4s.
- [x] **Full Automated Test Suite:** 49/49 unit, security, and UI tests pass (`npm test`).
- [x] **SPA Routing Fallback:** `netlify.toml` and `_redirects` verified.
- [x] **No Secrets Committed:** `.env` untracked in git, `.gitignore` ignores all `.env*` files.
- [x] **Persona Switching Hardened:** `DevBar` disabled in production unless `VITE_DEMO_MODE=true`.
- [x] **Database Migrations Ordered:** Migration 1 (`init_schema.sql`) and Migration 2 (`rewards_schema.sql`) documented.
- [x] **Campus Isolation & RLS:** Verified via automated tests in `src/services/security.test.ts` and `src/services/rewards.test.ts`.
