-- PrimeHR database schema. Safe to re-run: every statement is idempotent.
-- Apply with: npm run db:setup   (from the backend/ folder)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period)
);

CREATE TABLE IF NOT EXISTS public.goals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    UUID NOT NULL REFERENCES public.goal_submissions(id) ON DELETE CASCADE,
  thrust_area      TEXT NOT NULL DEFAULT '',
  goal_title       TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  uom_type         TEXT NOT NULL DEFAULT '',
  measurement_type TEXT NOT NULL DEFAULT '',
  target_value     NUMERIC NOT NULL DEFAULT 0,
  weightage        NUMERIC NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS goals_submission_id_idx ON public.goals (submission_id);

CREATE TABLE IF NOT EXISTS public.approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES public.goal_submissions(id) ON DELETE CASCADE,
  manager_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approval_action TEXT NOT NULL CHECK (approval_action IN ('approved', 'rejected')),
  remarks         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS approvals_submission_id_idx ON public.approvals (submission_id);

CREATE TABLE IF NOT EXISTS public.goal_checkins (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id            UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter            TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  actual_achievement NUMERIC,
  progress_status    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (goal_id, quarter)
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id                UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  goal_updates           BOOLEAN DEFAULT true,
  approval_notifications BOOLEAN DEFAULT true,
  weekly_summary         BOOLEAN DEFAULT false,
  profile_visibility     TEXT DEFAULT 'public',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
