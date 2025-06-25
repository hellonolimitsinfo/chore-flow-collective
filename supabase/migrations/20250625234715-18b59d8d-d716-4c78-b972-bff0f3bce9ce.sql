
-- Create shopping_logs table to track shopping actions
CREATE TABLE public.shopping_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'purchased', 'flagged_low', etc.
  item_name TEXT NOT NULL,
  member_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shopping_logs
ALTER TABLE public.shopping_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for shopping_logs - members can view logs for their household
CREATE POLICY "Members can view household shopping logs" 
  ON public.shopping_logs 
  FOR SELECT 
  USING (public.is_household_member(household_id));

-- Create policy for shopping_logs - members can insert logs for their household
CREATE POLICY "Members can create household shopping logs" 
  ON public.shopping_logs 
  FOR INSERT 
  WITH CHECK (public.is_household_member(household_id));
