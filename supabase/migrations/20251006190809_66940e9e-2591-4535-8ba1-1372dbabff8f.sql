-- Add columns for changes_summary and skill_matches to tailored_resumes table
ALTER TABLE public.tailored_resumes 
ADD COLUMN IF NOT EXISTS changes_summary jsonb,
ADD COLUMN IF NOT EXISTS skill_matches jsonb;