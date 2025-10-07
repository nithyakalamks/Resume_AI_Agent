-- Rename tailored_resumes table to tweaked_resumes
ALTER TABLE public.tailored_resumes RENAME TO tweaked_resumes;

-- Update the foreign key constraint names for clarity
ALTER TABLE public.tweaked_resumes RENAME CONSTRAINT tailored_resumes_job_description_id_fkey TO tweaked_resumes_job_description_id_fkey;
ALTER TABLE public.tweaked_resumes RENAME CONSTRAINT tailored_resumes_resume_id_fkey TO tweaked_resumes_resume_id_fkey;
ALTER TABLE public.tweaked_resumes RENAME CONSTRAINT tailored_resumes_user_id_fkey TO tweaked_resumes_user_id_fkey;

-- Rename RLS policies for consistency
ALTER POLICY "Users can delete their own tailored resumes" ON public.tweaked_resumes RENAME TO "Users can delete their own tweaked resumes";
ALTER POLICY "Users can insert their own tailored resumes" ON public.tweaked_resumes RENAME TO "Users can insert their own tweaked resumes";
ALTER POLICY "Users can view their own tailored resumes" ON public.tweaked_resumes RENAME TO "Users can view their own tweaked resumes";

-- Rename the tailored_data column to tweaked_data
ALTER TABLE public.tweaked_resumes RENAME COLUMN tailored_data TO tweaked_data;