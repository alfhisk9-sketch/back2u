# Back2You — Campus Lost & Found Platform

> **Lost something? Let's bring it back to you.**

Back2You is a modern, production-grade multi-campus lost-and-found platform designed to replace informal chat groups and physical notice boards with a secure, centralized recovery workflow.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Row Level Security, Auth, Storage)**.

---

## Key Features

1. **Intelligent Explainable Matching Engine (100-Point Normalized Model)**
   - Category similarity (30 pts)
   - Keyword & description token overlap (25 pts)
   - Campus location similarity (20 pts)
   - Date proximity decay (15 pts)
   - Color similarity (10 pts)
   - Human-readable breakdown explaining why two items match.

2. **Secure Multi-Campus Isolation & RLS**
   - Strictly scopes lost/found listings, claims, and search results to the student's authorized campus.
   - Prevents unauthorized cross-campus reads or data leakage.

3. **Complete Item Recovery Lifecycle**
   - Report Lost & Report Found with category selection, date picker, photo upload, and privacy protections.
   - Separation of public descriptions from private ownership verification clues (e.g. engravings, wallpaper, hidden contents).
   - Private claim submission and review workflow.
   - Safe handover location guidance (e.g., Campus Security Office, Student Union).
   - Return confirmation with automated resolution and celebratory UI.

4. **Role-Based Access Control (RBAC)**
   - **Student:** Report, search, claim, receive match suggestions, and manage personal reports.
   - **Moderator:** Campus-scoped moderation, review reported listings, inspect abuse flags, resolve disputes.
   - **Platform Admin:** Multi-campus registry, role assignments, platform audit logs, and metrics.

5. **In-App Notification Center**
   - High-score match alerts, claim status updates, and return notifications.

6. **Dual Mode Architecture**
   - **Live Supabase Mode:** Full persistence with PostgreSQL, Auth, and Storage.
   - **Interactive Demo / Offline Mode:** Instant local evaluation with rich realistic seed data for hackathon judges, administrators, and testing.

---

## Tech Stack

- **Frontend:** React 19, TypeScript (strict), Vite, Tailwind CSS, Lucide React
- **Forms & Validation:** React Hook Form, Zod
- **Data & State:** TanStack React Query, Supabase Client
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Testing:** Vitest, React Testing Library
- **Deployment:** Netlify & Vercel ready

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-username/back2you.git
cd back2you
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
To run against real Supabase:
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Run migrations located in `supabase/migrations/20261024000001_init_schema.sql` inside your Supabase SQL editor.

To run locally in **Interactive Demo Mode** (zero config required):
- Leave keys empty or set `VITE_DEMO_MODE=true`.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Tests
```bash
npm run test
```

### 5. Build for Production
```bash
npm run build
```

---

## License
MIT
