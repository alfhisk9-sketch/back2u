# Back2You — DNR Campus Recovery

> **Lost something? Let's bring it back to you.**  
> The official lost-and-found recovery platform tailored for **DNR College of Engineering & Technology (DNRCET)**, Bhimavaram, Andhra Pradesh, India.  
> Official College Website: [https://dnrcet.org/](https://dnrcet.org/)

---

## 1. Overview & Campus Customization

Back2You replaces chaotic social media channels and physical notice boards with a secure, explainable recovery workflow. Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Row Level Security, Auth, Storage)**.

### DNR Campus Parameters
- **Institution:** DNR College of Engineering & Technology (DNRCET)
- **Short Campus Label:** DNR Engineering College
- **Campus Code:** `DNR-BVRM`
- **Location:** Bhimavaram, Andhra Pradesh, India
- **Timezone:** Asia/Kolkata (IST)
- **Currency:** INR (₹)
- **Date Format:** `DD MMM YYYY` (e.g., `24 Oct 2026`)
- **Default Security Desk:** Administrative Office & Security Help Desk, Main Block, DNRCET Campus

---

## 2. Team Demo Accounts

The application includes three dedicated student demo identities and a security desk moderator:

| Demo Persona | Role | Designation | Avatar | Demo Email | Campus |
|---|---|---|---|---|---|
| **Alfhi** | Student | Project Lead | `AF` | `alfhi.demo@back2you.test` | DNR College of Engineering & Technology |
| **Rabbani** | Student | Team Member | `RA` | `rabbani.demo@back2you.test` | DNR College of Engineering & Technology |
| **Santosh** | Student | Team Member | `SA` | `santosh.demo@back2you.test` | DNR College of Engineering & Technology |
| **Officer Prasad** | Moderator | Security Help Desk | `OP` | `security.desk@dnrcet.org` | DNR College of Engineering & Technology |

> **Note:** All three team demo accounts (`Alfhi`, `Rabbani`, `Santosh`) are strictly regular students with zero moderator/admin privileges. Moderator testing is isolated to `Officer Prasad` at the Campus Security Desk.

---

## 3. Demo Account Selector & DevBar

- When in evaluation/demo mode, a persistent top navigation bar displays a prominent **"DEMO MODE"** badge.
- Quick buttons allow instant persona switching:
  - **Continue as Alfhi (Project Lead)**
  - **Continue as Rabbani (Team Member)**
  - **Continue as Santosh (Team Member)**
  - Dropdown options for **Officer Prasad (Moderator)**
- Persona switching isolates private data: switching users updates the dashboard, reports, claims, and Stars while strictly hiding unreviewed ownership proof details from non-owners.

---

## 4. Realistic DNR Campus Demo Data

The demo environment features 15 realistic lost-and-found records distributed across 10 DNR campus locations:
1. **Main Library** (e.g., Casio fx-991EX Scientific Calculator, Sony Over-Ear Headphones)
2. **Computer Science Laboratory** (e.g., Wildcraft Laptop Backpack, Data Structures Lab Record Book, SanDisk USB Drive)
3. **Electronics Laboratory** (e.g., HP 65W Blue-Pin Laptop Adapter)
4. **College Canteen** (e.g., DNRCET Student ID Card with Green Lanyard)
5. **Seminar Hall** (e.g., boAt Airdopes 141 Wireless Earbuds)
6. **Main Entrance** (e.g., Black Windproof Folding Umbrella)
7. **Parking Area** (e.g., Bike Key with Honda Keychain & Mini Torch)
8. **Classroom Block** (e.g., Milton Stainless Steel Water Bottle 1000ml)
9. **College Bus Area** (e.g., Brown Leather Bi-fold Wallet with Bus Pass)
10. **Sports Ground** (e.g., Yonex Badminton Racket with Full Cover)

### Interactive Demo Scenario
1. **Alfhi** reports a lost *Casio fx-991EX Scientific Calculator* in the Main Library.
2. **Rabbani** reports finding a *Casio fx-991EX Calculator* in the Main Library reading hall.
3. The **Intelligent Matching Engine** scores the pair at **94.5% compatibility** with a full explainable breakdown.
4. **Alfhi** submits an ownership claim with confidential proof (handwritten name sticker inside cover and screen contrast setting).
5. **Rabbani** (or **Officer Prasad**) reviews and approves the claim with handover instructions at the *Main Block Security Desk*.
6. The item is marked as completed/reunited, awarding **+25 Stars** to Rabbani.

---

## 5. Back2You Stars & Rewards

- **Found Report Accepted:** +10 Stars
- **Moderator Verification:** +15 Stars
- **Completed Return Recovery:** +25 Stars
- **Idempotency Protection:** Database and service-level idempotency prevents duplicate points on retries or page refreshes.
- **Milestone Badges:** *First Finder*, *Bronze Helper*, *Silver Helper*, *Gold Helper*, *Campus Hero*.
- **Campus Leaderboard:** Real-time ranking of top campus helpers (Rabbani, Alfhi, Santosh) with student privacy protection (no emails or roll numbers leaked).

---

## 6. How to Run & Verify

### Interactive Demo Mode (Local & Evaluation)
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/alfhisk9-sketch/back2u.git
   cd back2u
   npm install
   ```
2. Start the development server (runs with local seed data by default):
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`. Use the top DevBar or Login screen to switch between **Alfhi**, **Rabbani**, and **Santosh**.

### Live Supabase Mode
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_DEMO_MODE=false
   ```
3. Apply migrations in order via the Supabase SQL Editor:
   - `supabase/migrations/20261024000001_init_schema.sql` (Core schema & RLS)
   - `supabase/migrations/20261024000002_rewards_schema.sql` (Back2You Stars & Leaderboard)
   - `supabase/migrations/20261024000003_dnr_campus_seed.sql` (DNR College configuration)
4. (Optional) Run `supabase/seed.sql` to populate sample campus records.

---

## 7. Automated Testing & Verification

Run the comprehensive test suite (all 51 tests):
```bash
npm test
```

Build the production bundle:
```bash
npm run build
```

---

## 8. License
MIT License. Developed for DNR College of Engineering & Technology (DNRCET), Bhimavaram.
