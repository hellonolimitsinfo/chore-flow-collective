
-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to read profiles of household members
CREATE POLICY "Users can view household member profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm1
      JOIN public.household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid() AND hm2.user_id = public.profiles.id
    )
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
