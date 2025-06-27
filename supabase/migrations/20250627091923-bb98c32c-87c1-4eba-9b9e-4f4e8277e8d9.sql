
-- Create pending_invites table for household invitation links
CREATE TABLE IF NOT EXISTS public.pending_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pending_invites table
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Create policy for household members to view invites for their household
CREATE POLICY "Household members can view invites for their household"
  ON public.pending_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = pending_invites.household_id
      AND hm.user_id = auth.uid()
    )
  );

-- Create policy for household members to create invites for their household
CREATE POLICY "Household members can create invites for their household"
  ON public.pending_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = pending_invites.household_id
      AND hm.user_id = auth.uid()
    )
  );

-- Create policy for household members to delete invites for their household
CREATE POLICY "Household members can delete invites for their household"
  ON public.pending_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = pending_invites.household_id
      AND hm.user_id = auth.uid()
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_pending_invites_household_id ON public.pending_invites(household_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_expires_at ON public.pending_invites(expires_at);
