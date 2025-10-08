-- Add updated_at column to tweaked_resumes table
ALTER TABLE public.tweaked_resumes 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_tweaked_resumes_updated_at
BEFORE UPDATE ON public.tweaked_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();