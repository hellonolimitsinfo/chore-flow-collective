
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create households" ON public.households;
DROP POLICY IF EXISTS "Users can view households they are members of" ON public.households;
DROP POLICY IF EXISTS "Household admins can update households" ON public.households;
DROP POLICY IF EXISTS "Household admins can delete households" ON public.households;

-- Enable RLS on households table if not already enabled
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create households
CREATE POLICY "Users can create households"
  ON public.households
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Create policy to allow users to view households they are members of
CREATE POLICY "Users can view households they are members of"
  ON public.households
  FOR SELECT
  TO authenticated
  USING (public.is_household_member(id));

-- Create policy to allow household admins to update their households
CREATE POLICY "Household admins can update households"
  ON public.households
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Create policy to allow household admins to delete their households
CREATE POLICY "Household admins can delete households"
  ON public.households
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );
