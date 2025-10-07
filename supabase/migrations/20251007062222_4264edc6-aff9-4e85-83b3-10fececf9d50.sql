-- Add UPDATE policy for tweaked_resumes
CREATE POLICY "Users can update their own tweaked resumes"
ON public.tweaked_resumes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);