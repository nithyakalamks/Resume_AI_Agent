-- Add missing_skills column to tweaked_resumes table
ALTER TABLE public.tweaked_resumes 
ADD COLUMN IF NOT EXISTS missing_skills jsonb;