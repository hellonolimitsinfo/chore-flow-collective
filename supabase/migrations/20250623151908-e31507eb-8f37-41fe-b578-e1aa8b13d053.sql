
-- Create household_invitations table to track pending invitations
CREATE TABLE public.household_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Policy to allow household members to view invitations for their household
CREATE POLICY "Household members can view invitations" 
  ON public.household_invitations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = household_invitations.household_id 
      AND user_id = auth.uid()
    )
  );

-- Policy to allow household admins to create invitations
CREATE POLICY "Household admins can create invitations" 
  ON public.household_invitations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = household_invitations.household_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy to allow deletion of invitations (for cleanup)
CREATE POLICY "Allow invitation cleanup" 
  ON public.household_invitations 
  FOR DELETE 
  USING (true);
