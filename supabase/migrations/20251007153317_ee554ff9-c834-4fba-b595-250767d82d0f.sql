-- Add score columns to tweaked_resumes table
ALTER TABLE public.tweaked_resumes 
ADD COLUMN original_score integer,
ADD COLUMN customized_score integer;

-- Add check constraints to ensure scores are between 0 and 100
ALTER TABLE public.tweaked_resumes 
ADD CONSTRAINT original_score_range CHECK (original_score >= 0 AND original_score <= 100);

ALTER TABLE public.tweaked_resumes 
ADD CONSTRAINT customized_score_range CHECK (customized_score >= 0 AND customized_score <= 100);