
-- First, let's check and fix the RLS policies for household deletion
-- The issue is likely that the current delete policy requires the user to be an admin member,
-- but we also need to allow the creator to delete their household

-- Drop the existing delete policy
DROP POLICY IF EXISTS "Admins can delete their households" ON public.households;

-- Create a new delete policy that allows both creators and admin members to delete
CREATE POLICY "Creators and admins can delete households" 
  ON public.households 
  FOR DELETE 
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Also, we need to make sure that when a household is deleted, 
-- all related household_members are also deleted (cascade)
-- Let's add the foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'household_members_household_id_fkey'
    AND table_name = 'household_members'
  ) THEN
    ALTER TABLE public.household_members 
    ADD CONSTRAINT household_members_household_id_fkey 
    FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;
  END IF;
END $$;
