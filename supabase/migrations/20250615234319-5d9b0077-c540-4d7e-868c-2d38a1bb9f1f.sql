
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create households" ON public.households;
DROP POLICY IF EXISTS "Users can view households they are members of" ON public.households;
DROP POLICY IF EXISTS "Admins can update their households" ON public.households;
DROP POLICY IF EXISTS "Admins can delete their households" ON public.households;
DROP POLICY IF EXISTS "Users can view household members of their households" ON public.household_members;
DROP POLICY IF EXISTS "System can insert household members" ON public.household_members;
DROP POLICY IF EXISTS "Admins can update household members" ON public.household_members;
DROP POLICY IF EXISTS "Admins can delete household members" ON public.household_members;

-- Enable RLS on both tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for households table
CREATE POLICY "Users can view households they are members of" 
  ON public.households 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households" 
  ON public.households 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their households" 
  ON public.households 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete their households" 
  ON public.households 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for household_members table
CREATE POLICY "Users can view household members of their households" 
  ON public.household_members 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.household_members hm2 
      WHERE hm2.household_id = household_members.household_id 
      AND hm2.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert household members" 
  ON public.household_members 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can update household members" 
  ON public.household_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm2 
      WHERE hm2.household_id = household_members.household_id 
      AND hm2.user_id = auth.uid() 
      AND hm2.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete household members" 
  ON public.household_members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm2 
      WHERE hm2.household_id = household_members.household_id 
      AND hm2.user_id = auth.uid() 
      AND hm2.role = 'admin'
    )
  );
