-- Add UPDATE policy for job_descriptions
CREATE POLICY "Users can update their own job descriptions"
ON public.job_descriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for job_descriptions
CREATE POLICY "Users can delete their own job descriptions"
ON public.job_descriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);