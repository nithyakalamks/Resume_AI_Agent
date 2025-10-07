-- Add company_name and role_name columns to job_descriptions table
ALTER TABLE public.job_descriptions
ADD COLUMN company_name TEXT,
ADD COLUMN role_name TEXT;