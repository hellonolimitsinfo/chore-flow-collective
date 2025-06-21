
-- Update the households SELECT policy to allow creators to see their households
-- even if they're not yet in the household_members table
DROP POLICY IF EXISTS "Users can view households they are members of" ON public.households;

CREATE POLICY "Users can view households they are members of" 
  ON public.households 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = id AND user_id = auth.uid()
    )
  );
