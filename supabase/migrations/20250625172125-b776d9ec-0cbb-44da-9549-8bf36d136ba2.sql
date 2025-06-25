
-- Create a table for chores
CREATE TABLE public.chores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
  current_assignee_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- Add Row Level Security (RLS) to ensure users can only see chores from their households
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

-- Create policy that allows household members to SELECT chores from their households
CREATE POLICY "Household members can view household chores" 
  ON public.chores 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = chores.household_id 
      AND user_id = auth.uid()
    )
  );

-- Create policy that allows household members to INSERT chores to their households
CREATE POLICY "Household members can create household chores" 
  ON public.chores 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = chores.household_id 
      AND user_id = auth.uid()
    )
  );

-- Create policy that allows household members to UPDATE chores in their households
CREATE POLICY "Household members can update household chores" 
  ON public.chores 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = chores.household_id 
      AND user_id = auth.uid()
    )
  );

-- Create policy that allows household members to DELETE chores from their households
CREATE POLICY "Household members can delete household chores" 
  ON public.chores 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = chores.household_id 
      AND user_id = auth.uid()
    )
  );

-- Create a table to track chore completions for rotation logic
CREATE TABLE public.chore_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE NOT NULL,
  completed_by UUID REFERENCES public.profiles(id) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_assignee_id UUID REFERENCES public.profiles(id) NOT NULL
);

-- Add RLS to chore_completions
ALTER TABLE public.chore_completions ENABLE ROW LEVEL SECURITY;

-- Create policy for chore_completions
CREATE POLICY "Household members can view chore completions" 
  ON public.chore_completions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chores c
      JOIN public.household_members hm ON c.household_id = hm.household_id
      WHERE c.id = chore_completions.chore_id 
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create chore completions" 
  ON public.chore_completions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chores c
      JOIN public.household_members hm ON c.household_id = hm.household_id
      WHERE c.id = chore_completions.chore_id 
      AND hm.user_id = auth.uid()
    )
  );

-- Function to get next assignee in rotation
CREATE OR REPLACE FUNCTION get_next_chore_assignee(chore_household_id UUID, current_assignee_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_assignee UUID;
  member_ids UUID[];
  current_index INTEGER;
  next_index INTEGER;
BEGIN
  -- Get all household member IDs in a consistent order
  SELECT ARRAY(
    SELECT hm.user_id 
    FROM household_members hm 
    WHERE hm.household_id = chore_household_id 
    ORDER BY hm.joined_at, hm.user_id
  ) INTO member_ids;
  
  -- Find current assignee's position
  SELECT array_position(member_ids, current_assignee_id) INTO current_index;
  
  -- Calculate next index (wrap around to 1 if at end)
  next_index := CASE 
    WHEN current_index IS NULL OR current_index = array_length(member_ids, 1) 
    THEN 1 
    ELSE current_index + 1 
  END;
  
  -- Get next assignee
  next_assignee := member_ids[next_index];
  
  RETURN next_assignee;
END;
$$;
