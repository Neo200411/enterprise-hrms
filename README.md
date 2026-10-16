# PrimeHR – HR Management System

A full-stack HRMS for **goal management and quarterly performance tracking**, with separate dashboards for Employees, Managers and Admins.

- **Employees** plan goals for a quarter (with an optional ✨ AI assistant that turns a rough idea into a measurable goal), submit them for approval, and record quarterly check-ins.
- **Managers** review submissions, adjust targets/weightage, approve or return them for rework, and track team progress.
- **Admins** see organisation-wide analytics, the audit log, manage people's names, and export reports to CSV.

How it works end to end — tables, workflows, API — is in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Next.js App Router), TypeScript, Tailwind CSS |
| Forms & validation | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Node.js + Express REST API |
| Database | PostgreSQL (5 tables) |
| Auth | JWT + bcrypt password hashing, role-based access control |
| AI (optional) | Groq API (GPT-OSS 120B) for the goal-writing assistant |

## Project Structure

```
app/                  Pages (one folder per screen)
components/           Layout, goal form, auth + toast providers
lib/validations/      Zod schema for goal submissions
lib/export.ts         CSV export helper
services/api.ts       Every call to the backend

backend/
  db/schema.sql       The 5 tables
  db/setup.js         Creates tables + demo users
  src/server.js       Express app
  src/routes/         auth · goals · approvals · checkins · reports · users · ai
  src/controllers/    Business logic + SQL for each route group
  src/middleware/     JWT auth, role checks, rate limiting
```

## Getting Started

**1. Install**

```bash
npm install
cd backend && npm install
```

**2. Configure** — create `backend/.env` (see `backend/.env.example`):

```env
DATABASE_URL=postgresql://localhost:5432/primehr
DATABASE_SSL=false
JWT_SECRET=<random string, 32+ characters>
PORT=5001
```

Optional — the **✨ Improve with AI** button in the goal form needs a free Groq key from https://console.groq.com/keys:

```env
GROQ_API_KEY=gsk_...
```

Without it, everything else works and the button just says the assistant isn't set up.

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Any PostgreSQL works — local, Supabase, Neon, RDS — just change `DATABASE_URL` (and set `DATABASE_SSL=true` for hosted databases).

The frontend reads `NEXT_PUBLIC_API_URL` from `.env.local` (defaults to `http://localhost:5001/api`).

**3. Create the database**

```bash
createdb primehr          # if using local Postgres
cd backend && npm run db:setup
```

**4. Run** (two terminals)

```bash
cd backend && npm run dev   # API on http://localhost:5001
npm run dev                 # App on http://localhost:3000
```

## Deploy to Render

`render.yaml` describes everything, so Render can create it in one go:

1. Render dashboard → **New → Blueprint** → connect this GitHub repo (branch `express-migration`).
2. Render asks for three values. Fill them using the names from `render.yaml`:
   - `CORS_ORIGIN` = `https://primehr-web.onrender.com`
   - `NEXT_PUBLIC_API_URL` = `https://primehr-api.onrender.com/api`
   - `GROQ_API_KEY` = your Groq key (optional)
3. Click **Apply**. Render creates the database, the API and the website. On start, the API runs `npm run db:setup`, which creates the tables and the demo accounts.
4. If Render gave a service a different URL (it adds a suffix when the name is taken), update `CORS_ORIGIN` / `NEXT_PUBLIC_API_URL` to the real URLs and redeploy the website — `NEXT_PUBLIC_API_URL` is baked in at build time.

Free plan notes: services sleep after ~15 minutes idle, so the first visit can take up to a minute; the free database has an expiry date — check Render's current limits.

## Demo Accounts

Password for all: `Test@123`

| Role | Email |
|---|---|
| Employee | employee@test.com |
| Manager | manager@test.com |
| Admin | admin@test.com |

New sign-ups are always employees. To promote someone:

```sql
UPDATE users SET role = 'manager' WHERE email = 'person@company.com';
```

## Possible Next Steps

- Reporting lines (`manager_id` on users) so managers only see their own team
- Email notifications when goals are approved or returned
- Deploying the API and database (e.g. Render + Supabase)
