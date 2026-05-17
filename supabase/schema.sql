-- Execute this in your Supabase SQL Editor

-- 1. Create goal_submissions table
CREATE TABLE IF NOT EXISTS public.goal_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, period)
);

-- 2. Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES public.goal_submissions(id) ON DELETE CASCADE,
    thrust_area TEXT NOT NULL,
    goal_title TEXT NOT NULL,
    description TEXT,
    uom_type TEXT NOT NULL,
    measurement_type TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    weightage NUMERIC NOT NULL CHECK (weightage >= 10 AND weightage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.goal_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Submissions Policies
CREATE POLICY "Users can view their own submissions" 
    ON public.goal_submissions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions" 
    ON public.goal_submissions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft submissions" 
    ON public.goal_submissions FOR UPDATE 
    USING (auth.uid() = user_id AND (status = 'draft' OR status = 'rejected'));

-- Goals Policies
CREATE POLICY "Users can view goals of their submissions" 
    ON public.goals FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.goal_submissions gs 
        WHERE gs.id = submission_id AND gs.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert goals to their own submissions" 
    ON public.goals FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.goal_submissions gs 
        WHERE gs.id = submission_id AND gs.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own goals if draft" 
    ON public.goals FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.goal_submissions gs 
        WHERE gs.id = submission_id AND gs.user_id = auth.uid() AND (gs.status = 'draft' OR gs.status = 'rejected')
    ));

CREATE POLICY "Users can delete their own goals if draft" 
    ON public.goals FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.goal_submissions gs 
        WHERE gs.id = submission_id AND gs.user_id = auth.uid() AND (gs.status = 'draft' OR gs.status = 'rejected')
    ));
