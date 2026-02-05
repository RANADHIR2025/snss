-- Allow users to update their own quote requests (only pending ones)
CREATE POLICY "Users can update their own pending quotes"
ON public.quote_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own quote requests (only pending ones)
CREATE POLICY "Users can delete their own pending quotes"
ON public.quote_requests
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Allow admins to delete any quote requests
CREATE POLICY "Admins can delete quote requests"
ON public.quote_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));